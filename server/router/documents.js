const Router = require('@koa/router')
const router = new Router()
const { verify } = require('../utils/jwt.js')
const {
  findContent,
  getOwnedDocumentList,
  getCollaboratedDocumentList,
  createDocument,
  deleteDocument,
  renameDocument,
  duplicateDocument,
  getDocumentForDownload,
} = require('../controllers/Documents')
const jwt = require('jsonwebtoken')

router.prefix('/doc') // 路由前缀，所有路由都以 /doc 开头

// 获取文档内容
router.post('/getContent', verify(), async (ctx) => {
  // 获取请求携带的数据
  const { fileId } = ctx.request.body

  // 参数校验
  if (!fileId) {
    ctx.body = {
      code: '0',
      message: '文件ID不能为空',
    }
    return
  }

  console.log('获取文档内容 - 文件ID:', fileId)

  try {
    const res = await findContent({ fileId })
    console.log('文档内容查询结果：', res)
    if (res && res.length > 0 && res[0].content) {
      ctx.body = {
        code: '1', // 成功状态码
        message: '内容查询成功',
        content: res[0].content, // 返回字符串格式的文档内容（JSON字符串）
        y_state: res[0].y_state, // 返回Yjs状态
        success: true, // 添加 success 字段
      }
    } else {
      ctx.body = {
        code: '0',
        message: '文档不存在或内容为空',
        content: null,
        success: false,
      }
    }
  } catch (error) {
    console.error('获取文档内容出错:', error)
    ctx.body = {
      code: '-1',
      message: '查询失败: ' + error.message,
      content: null,
      success: false,
    }
  }
})

// 获取文档列表
router.post('/getList', verify(), async (ctx) => {
  try {
    // 从JWT中获取用户ID
    const access_token = ctx.headers.authorization
    const decoded = jwt.verify(access_token, 'ColabDocs')

    const userId = decoded.id

    console.log('获取文档列表 - 用户ID:', userId)

    // 查询用户的文档列表 - 分别获取拥有的和协作的文档
    const ownedDocs = await getOwnedDocumentList(userId)
    const collaboratedDocs = await getCollaboratedDocumentList(userId)

    ctx.body = {
      code: '1',
      message: '获取文档列表成功',
      data: ownedDocs,        // 用户拥有的文档
      dataS: collaboratedDocs // 用户作为协作者的文档
    }
  } catch (error) {
    console.error('获取文档列表失败:', error)
    ctx.body = {
      code: '-1',
      message: '获取文档列表失败: ' + error.message,
    }
  }
})

// 创建文档
router.post('/create', verify(), async (ctx) => {
  const { name } = ctx.request.body

  // 参数校验
  if (!name || !name.trim()) {
    ctx.body = {
      code: '0',
      message: '文档名称不能为空',
    }
    return
  }

  try {
    // 从JWT中获取用户ID
    const access_token = ctx.headers.authorization
    const decoded = jwt.verify(access_token, 'ColabDocs')

    const userId = decoded.id

    console.log('创建文档 - 用户ID:', userId, '文档名:', name)

    // 创建文档
    const result = await createDocument({
      name: name.trim(),
      userId,
    })

    ctx.body = {
      code: '1',
      message: '文档创建成功',
      data: {
        documentId: result.documentId,
      },
    }
  } catch (error) {
    console.error('创建文档失败:', error)
    ctx.body = {
      code: '-1',
      message: '创建文档失败: ' + error.message,
    }
  }
})

// 删除文档
router.post('/delete', verify(), async (ctx) => {
  const { fileId } = ctx.request.body

  // 参数校验
  if (!fileId) {
    ctx.body = {
      code: '0',
      message: '文件ID不能为空',
    }
    return
  }

  try {
    // 从JWT中获取用户ID
    const access_token = ctx.headers.authorization
    const decoded = jwt.verify(access_token, 'ColabDocs')

    const userId = decoded.id

    console.log('删除文档 - 文件ID:', fileId, '用户ID:', userId)

    // 删除文档
    const result = await deleteDocument({
      fileId,
      userId,
    })

    ctx.body = {
      code: '1',
      message: '文档删除成功',
      data: result,
    }
  } catch (error) {
    console.error('删除文档失败:', error)
    ctx.body = {
      code: '-1',
      message: error.message || '删除文档失败',
    }
  }
})

// 重命名文档
router.post('/rename', verify(), async (ctx) => {
  const { fileId, newName } = ctx.request.body

  // 参数校验
  if (!fileId || !newName || !newName.trim()) {
    ctx.body = {
      code: '0',
      message: '参数不完整',
    }
    return
  }

  try {
    // 从JWT中获取用户ID
    const access_token = ctx.headers.authorization
    const decoded = jwt.verify(access_token, 'ColabDocs')

    const userId = decoded.id

    console.log('重命名文档 - 文件ID:', fileId, '新名称:', newName)

    // 重命名文档
    const result = await renameDocument({
      fileId,
      newName: newName.trim(),
      userId,
    })

    ctx.body = {
      code: '1',
      message: '重命名成功',
      data: result,
    }
  } catch (error) {
    console.error('重命名文档失败:', error)
    ctx.body = {
      code: '-1',
      message: error.message || '重命名失败',
    }
  }
})

// 复制文档
router.post('/duplicate', verify(), async (ctx) => {
  const { fileId, newName } = ctx.request.body

  // 参数校验
  if (!fileId || !newName || !newName.trim()) {
    ctx.body = {
      code: '0',
      message: '参数不完整',
    }
    return
  }

  try {
    // 从JWT中获取用户ID
    const access_token = ctx.headers.authorization
    const decoded = jwt.verify(access_token, 'ColabDocs')

    const userId = decoded.id

    console.log('复制文档 - 原文件ID:', fileId, '新名称:', newName)

    // 复制文档
    const result = await duplicateDocument({
      fileId,
      newName: newName.trim(),
      userId,
    })

    ctx.body = {
      code: '1',
      message: '文档复制成功',
      data: {
        documentId: result.documentId,
      },
    }
  } catch (error) {
    console.error('复制文档失败:', error)
    ctx.body = {
      code: '-1',
      message: error.message || '复制文档失败',
    }
  }
})

// 下载文档
router.post('/download', verify(), async (ctx) => {
  const { fileId } = ctx.request.body

  // 参数校验
  if (!fileId) {
    ctx.body = {
      code: '0',
      message: '文件ID不能为空',
    }
    return
  }

  try {
    // 从JWT中获取用户ID
    const access_token = ctx.headers.authorization
    const decoded = jwt.verify(access_token, 'ColabDocs')

    const userId = decoded.id

    console.log('下载文档 - 文件ID:', fileId)

    // 获取文档内容
    const document = await getDocumentForDownload({
      fileId,
      userId,
    })

    // 将JSON内容转换为Markdown或其他格式
    // 这里简单地返回JSON内容，实际使用时可以根据需要转换格式
    const content = JSON.stringify(JSON.parse(document.content), null, 2)
    console.log(content)

    // 设置响应头
    ctx.set('Content-Type', 'application/json')
    ctx.set('Content-Disposition', `attachment; filename="${document.doc_name}.json"`)

    // 返回文件内容
    ctx.body = content
  } catch (error) {
    console.error('下载文档失败:', error)
    ctx.body = {
      code: '-1',
      message: error.message || '下载文档失败',
    }
  }
})

module.exports = router