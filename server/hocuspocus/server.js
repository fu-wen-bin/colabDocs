const { logger } = require('../utils/logger.js')
const { ws_port } = require('../base.config.js')
const jwt = require('jsonwebtoken')
const { decode } = require('../utils/jwt')
const { findContent, upsertDocumentContent } = require('../controllers/Documents')
const { sql_config } = require('../base.config')
const Y = require('yjs')
const  debounce  = require('debounce')

// 统一解析 requestParameters 的工具：支持 string / URLSearchParams / object
function getParam(requestParameters, key) {
  if (!requestParameters) return undefined

  // 已经是 URLSearchParams
  if (typeof URLSearchParams !== 'undefined' && requestParameters instanceof URLSearchParams) {
    return requestParameters.get(key) ?? undefined
  }

  // 字符串（如 "a=1&b=2"）
  if (typeof requestParameters === 'string') {
    try {
      const params = new URLSearchParams(requestParameters)
      return params.get(key) ?? undefined
    } catch {
      // 兜底：手动解析
      const pairs = requestParameters.split('&').map(s => s.split('='))
      const hit = pairs.find(([k]) => k === key)
      return hit ? decodeURIComponent(hit[1] || '') : undefined
    }
  }

  // 普通对象（可能值是数组）
  if (typeof requestParameters === 'object') {
    const v = requestParameters[key]
    if (Array.isArray(v)) return v[0]
    return v
  }

  return undefined
}

// 使用动态 import 以在 CommonJS 中加载可能为 ESM-only 的依赖
async function createHocuspocusServer () {
  const { Server } = await import('@hocuspocus/server')
  const { Database } = await import('@hocuspocus/extension-database')
  const { TiptapTransformer } = await import('@hocuspocus/transformer')

  let debounced
  return new Server({
    port: ws_port, // 使用配置端口，避免与前端不一致
    // 设置服务器级别的防抖
    debounce: 3000, // Hocuspocus 内置防抖，3秒内的多次更新会合并
    extensions: [

      // 数据库扩展
      /*new Database({
        // 基本 MySQL 连接配置
        type: 'mysql',
        host: sql_config.host,
        port: parseInt(process.env.DB_PORT || '3306'),
        database: process.env.DB_NAME || 'collaboration_db',
        user: process.env.DB_USER || 'db_user',
        password: process.env.DB_PASSWORD || 'password',

        // 自定义表名和字段
        tableName: 'document_contents', // 您的表名

        // 自定义查询 - 适应您的表结构
        async fetch(documentName) {
          logger.info(`[2025-08-27 14:01:43] 正在加载文档 ${documentName} (用户: fu-wen-bin)`)

          try {
            // 获取连接
            const connection = await this.pool.getConnection()

            try {
              // 自定义查询 - 根据您的表结构调整
              const [rows] = await findContent()

              if (rows.length === 0) {
                logger.info(`文档 ${documentName} 不存在，将创建新文档`)
                return null
              }

              // 记录文档加载
              logger.info(`文档 ${documentName} 已加载，标题: ${rows[0].title}`)

              // 返回文档内容（YDOC二进制数据）
              return rows[0].doc_content
            } finally {
              // 释放连接
              connection.release()
            }
          } catch (error) {
            logger.error(`加载文档失败: ${error.message}`)
            return null
          }
        },

        async store(documentName, state) {
          logger.info(`[2025-08-27 14:01:43] 正在保存文档 ${documentName} (用户: fu-wen-bin)`)

          try {
            const connection = await this.pool.getConnection()

            try {
              // 检查文档是否存在
              const [existingDoc] = await connection.execute(
                'SELECT doc_id FROM document_contents WHERE doc_id = ?',
                [documentName]
              )

              const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ')

              if (existingDoc.length === 0) {
                // 插入新文档
                await connection.execute(
                  `INSERT INTO document_contents (
                  doc_id, doc_content, created_at, updated_at
                ) VALUES (?, ?, ?, ?)`,
                  [documentName, state, currentTime, currentTime]
                )

                // 可能需要在metadata表中也创建记录
                logger.info(`创建了新文档: ${documentName}`)
                  `INSERT INTO document_metadata (
                  doc_id, title, owner_id, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?)`,
                  [documentName, '未命名文档', 'system', currentTime, currentTime]
                )

                logger.info(`创建了新文档: ${documentName}`)
              } else {
                // 更新现有文档
                await connection.execute(
                  'UPDATE document_contents SET doc_content = ?, updated_at = ? WHERE doc_id = ?',
                  [state, currentTime, documentName]
                )

                // 更新元数据中的最后修改时间
                await connection.execute(
                  'UPDATE document_metadata SET updated_at = ? WHERE doc_id = ?',
                  [currentTime, documentName]
                )

                logger.info(`更新了文档: ${documentName}`)
              }

              return true
            } finally {
              connection.release()
            }
          } catch (error) {
            logger.error(`保存文档失败: ${error.message}`)
            return false
          }
        }
      })*/
    ],

    // 验证用户身份
    async onAuthenticate ({ token }) {
      if (!token) {
        logger.error('身份验证失败: 无 token')
        throw new Error('身份验证失败: 无 token')
      }

      try {
        const { userId, username } = decode(token)
        const currentTime = new Date().toLocaleString()

        const user = { id: userId, name: username, loginTime: currentTime, }

        logger.debug(
          `验证成功！用户ID：${userId}，用户名：${username}，时间：${currentTime}`)

        // 直接返回用户信息，而不是尝试使用 connection.context
        return { user }
      } catch (error) {
        logger.error('身份验证错误', error)
        throw new Error('身份验证错误！')
      }
    },

    // 读取 URL 参数 preferLocal 并写入 context
    async onConnect ({ documentName, requestParameters, connection }) {
      logger.debug(`正在连接到文档 ${documentName}`)
      const raw = getParam(requestParameters, 'preferLocal')
      const preferLocal = raw === '1' || raw === 'true'
      logger.debug(`preferLocal 参数: ${preferLocal}`)
      // 返回值将会 merge 到 context
      return { preferLocal }
    },

    // 连接验证与权限控制
    async connected ({ documentName, context, clientsCount }) {
      // 从 connection.context 获取在 onAuthenticate 中设置的用户信息
      const user = context?.user

      if (!user) {
        logger.warn(`拒绝连接！文档 ${documentName} - 无用户信息`)
        return false
      }

      logger.info(
        `用户 ${user.name} 在 ${user.loginTime} 连接到文档 ${documentName}`)

      // 这里可以添加文档权限检查
      // const hasPermission = await checkDocumentPermission(user.id, documentName)
      // if (!hasPermission) {
      //   logger.warn(`用户 ${user.name} 无权访问文档 ${documentName}`)
      //   return false
      // }
      return true // 允许连接
    },

    // 初始化加载文档
    async onLoadDocument ({ documentName, document, context }) {
      logger.info(`开始加载文档: ${documentName}`)

      try {
        // 如果前端声明本地为主，跳过服务器播种
        if (context?.preferLocal === true) {
          logger.info(`跳过服务器播种（preferLocal=true）：${documentName}`)
          return document
        }

        // 从数据库获取文档内容
        const result = await findContent({ fileId: documentName })
        console.log(result)

        function bufferToUint8(b) {
          // mysql2 返回的是 Buffer
          return new Uint8Array(b.buffer, b.byteOffset, b.byteLength)
        }

        if (result && result[0] && result[0].y_state) {
          logger.info(`从服务器数据库加载文档: ${documentName}`)

          /*// 解析 JSON 内容
          const jsonContent = typeof result[0].content === 'string'
                              ? JSON.parse(result[0].content) : result[0].content

          // 使用 TiptapTransformer 将 JSON 转换为 Y.Doc
          const ydoc = TiptapTransformer.toYdoc(
            jsonContent,
            'content', // 字段名必须与前端 Collaboration 扩展配置一致
          )

          // 应用更新到文档
          const update = Y.encodeStateAsUpdate(ydoc)*/
          const update = bufferToUint8(result[0].y_state)
          Y.applyUpdate(document, result[0].y_state)

          logger.info(`文档 ${documentName} 加载完成`)
          return document
        } else {
          logger.info(`文档 ${documentName} 不存在`)
          // 返回空文档，让客户端创建新内容
          return document
        }
      } catch (error) {
        logger.error(`加载文档失败: ${error.message}`)
        // 返回空文档
        return document
      }
    },

    // 文档变更时保存
    async onChange ({ documentName, document, context }) {
      const save = async () => {
        logger.debug(`文档 ${documentName} 发生变更`)

        try {
          // 获取用户信息
          const user = context?.user
          if (!user) {
            logger.warn('无用户信息，跳过保存')
            return
          }

          // 二进制 Y 状态（权威）
          const yUpdate = Y.encodeStateAsUpdate(document)
          // 将 Y.Doc 转换为 JSON（便于导出/检索）
          const jsonContent = TiptapTransformer.fromYdoc(document, 'content')

          await upsertDocumentContent({
            fileId: documentName,
            yState: Buffer.from(yUpdate),
            content: JSON.stringify(jsonContent),
          })

          logger.info(`文档 ${documentName} 已保存`)
        } catch (error) {
          console.log(error)
          logger.error(`保存文档失败: ${error.message}`)
        }
      }
      debounced?.clear()
      debounced = debounce(save, 800)
      debounced()
    },

    // 断开连接时
    async onDisconnect ({ documentName, context }) {
      const user = context?.user
      logger.info(
        `用户 ${user?.name || '未知'} 断开文档 ${documentName} 的连接`)
    },


  })

}

module.exports = { createHocuspocusServer }
