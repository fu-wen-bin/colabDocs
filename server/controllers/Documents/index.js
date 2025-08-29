const { allServices } = require('../../config')
const { nanoid } = require('nanoid')

// 根据文件Id查找文件内容（返回 y_state 和 content）
const findContent = (data) => {
  // 1. 构建查询语句
  const sql = 'SELECT content, y_state FROM documents_content WHERE document_id = ?'
  // 2. 执行查询
  return allServices.query(sql,[data.fileId])
}

// upsert 保存（y_state 为权威，同时保存 JSON 方便检索/导出）
const upsertDocumentContent = async ({ fileId, yState, content }) => {
  const sql = `
    INSERT INTO documents_content (document_id, content, y_state)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      content = VALUES(content),
      y_state = VALUES(y_state),
      updated_at = CURRENT_TIMESTAMP
  `
  await allServices.query(sql, [fileId, content ?? null, yState ?? null])

  // 维护 documents.updated_at，便于列表按最近编辑排序
  await allServices.query('UPDATE documents SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [fileId])

  return { success: true }
}

// 获取用户作为拥有者的文档列表
const getOwnedDocumentList = (userId) => {
  const sql = `
    SELECT 
      d.id,
      d.doc_name,
      d.owner_id,
      d.created_at,
      d.updated_at,
      'owner' as role
    FROM documents d
    WHERE d.status = 'active' AND d.owner_id = ?
    ORDER BY d.updated_at DESC
  `
  return allServices.query(sql, [userId])
}

// 获取用户作为协作者的文档列表
const getCollaboratedDocumentList = (userId) => {
  const sql = `
    SELECT DISTINCT
      d.id,
      d.doc_name,
      d.owner_id,
      d.created_at,
      d.updated_at,
      'editor' as role
    FROM documents d
    JOIN document_collaborators dc ON d.id = dc.document_id
    WHERE d.status = 'active' 
      AND dc.user_id = ?
      AND d.owner_id != ?  /* 确保不包含用户自己拥有的文档 */
    ORDER BY d.updated_at DESC
  `
  return allServices.query(sql, [userId, userId])
}

// 保留原有函数以保持向后兼容性
const getDocumentList = async (userId) => {
  const ownedDocs = await getOwnedDocumentList(userId)
  const collaboratedDocs = await getCollaboratedDocumentList(userId)
  return [...ownedDocs, ...collaboratedDocs]
}

// 创建新文档
const createDocument = async (data) => {
  const { name, userId } = data

  // 生成唯一的文档ID
  const documentId = nanoid()

  // 开启事务 -- 专用连接
  const connection = await allServices.getConnection()

  try {
    await connection.beginTransaction()

    // 1. 插入文档基本信息
    const insertDocSql = `
      INSERT INTO documents (id, doc_name, owner_id, status) 
      VALUES (?, ?, ?, 'active')
    `
    await connection.query(insertDocSql, [documentId, name, userId])

    // 2. 插入初始内容（空文档）
    const insertContentSql = `
      INSERT INTO documents_content (document_id, content) 
      VALUES (?, ?)
    `
    // 初始化一个空的 Tiptap 文档结构
    const initialContent = JSON.stringify({
      type: 'doc',
      content: [{
        type: 'paragraph',
        content: []
      }]
    })
    await connection.query(insertContentSql, [documentId, initialContent])

    // 3. 将创建者添加到协作者表
    const insertCollaboratorSql = `
      INSERT INTO document_collaborators (document_id, user_id, role) 
      VALUES (?, ?, 'owner')
    `
    await connection.query(insertCollaboratorSql, [documentId, userId])

    // 提交事务
    await connection.commit()

    return { success: true, documentId }
  } catch (error) {
    // 回滚事务
    await connection.rollback()
    throw error
  } finally {
    // 释放连接
    connection.release()
  }
}

// 删除文档（软删除）
const deleteDocument = async (data) => {
  const { fileId, userId } = data

  // 先检查用户是否有权限删除（必须是文档所有者）
  const checkOwnerSql = 'SELECT owner_id FROM documents WHERE id = ? AND status = "active"'
  const [doc] = await allServices.query(checkOwnerSql, [fileId])

  if (!doc) {
    throw new Error('文档不存在')
  }

  if (doc.owner_id !== userId) {
    throw new Error('您没有权限删除此文档')
  }

  // 执行软删除
  const sql = 'UPDATE documents SET status = "deleted" WHERE id = ?'
  const result = await allServices.query(sql, [fileId])

  return { success: result.affectedRows > 0 }
}

// 重命名文档
const renameDocument = async (data) => {
  const { fileId, newName, userId } = data

  // 检查用户是否有权限（所有者或协作者都可以重命名）
  const checkPermissionSql = `
    SELECT 1 FROM documents d
    LEFT JOIN document_collaborators dc ON d.id = dc.document_id
    WHERE d.id = ? 
      AND d.status = 'active'
      AND (d.owner_id = ? OR dc.user_id = ?)
    LIMIT 1
  `
  const permission = await allServices.query(checkPermissionSql, [fileId, userId, userId])

  if (!permission || permission.length === 0) {
    throw new Error('您没有权限重命名此文档')
  }

  // 执行重命名
  const sql = 'UPDATE documents SET doc_name = ? WHERE id = ?'
  const result = await allServices.query(sql, [newName, fileId])

  return { success: result.affectedRows > 0 }
}

// 复制文档
const duplicateDocument = async (data) => {
  const { fileId, newName, userId } = data

  // 获取原文档信息和内容
  const getDocSql = `
    SELECT d.*, dc.content 
    FROM documents d
    JOIN documents_content dc ON d.id = dc.document_id
    WHERE d.id = ? AND d.status = 'active'
  `
  const [originalDoc] = await allServices.query(getDocSql, [fileId])

  if (!originalDoc) {
    throw new Error('原文档不存在')
  }

  // 创建新文档
  const newDocumentId = nanoid()
  const connection = await allServices.getConnection()

  try {
    await connection.beginTransaction()

    // 1. 创建新文档记录
    const insertDocSql = `
      INSERT INTO documents (id, doc_name, owner_id, status) 
      VALUES (?, ?, ?, 'active')
    `
    await connection.query(insertDocSql, [newDocumentId, newName, userId])

    // 2. 复制文档内容
    const insertContentSql = `
      INSERT INTO documents_content (document_id, content) 
      VALUES (?, ?)
    `
    await connection.query(insertContentSql, [newDocumentId, originalDoc.content])

    // 3. 添加协作者记录
    const insertCollaboratorSql = `
      INSERT INTO document_collaborators (document_id, user_id, role) 
      VALUES (?, ?, 'owner')
    `
    await connection.query(insertCollaboratorSql, [newDocumentId, userId])

    await connection.commit()

    return { success: true, documentId: newDocumentId }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

// 获取文档用于下载
const getDocumentForDownload = async (data) => {
  const { fileId, userId } = data

  // 检查用户权限并获取文档内容
  const sql = `
    SELECT d.doc_name, dc.content
    FROM documents d
    JOIN documents_content dc ON d.id = dc.document_id
    LEFT JOIN document_collaborators col ON d.id = col.document_id
    WHERE d.id = ? 
      AND d.status = 'active'
      AND (d.owner_id = ? OR col.user_id = ?)
    LIMIT 1
  `

  const result = await allServices.query(sql, [fileId, userId, userId])

  if (!result || result.length === 0) {
    throw new Error('文档不存在或您没有访问权限')
  }

  return result[0]
}

module.exports = {
  findContent,
  upsertDocumentContent,
  getDocumentList,
  getOwnedDocumentList,
  getCollaboratedDocumentList,
  createDocument,
  deleteDocument,
  renameDocument,
  duplicateDocument,
  getDocumentForDownload,
}