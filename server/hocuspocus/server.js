const { logger } = require('../utils/logger.js')
const { ws_port } = require('../base.config.js')
const jwt = require('jsonwebtoken')

// 使用动态 import 以在 CommonJS 中加载可能为 ESM-only 的依赖
async function createHocuspocusServer () {
  const { Server } = await import('@hocuspocus/server')
  const { Database } = await import('@hocuspocus/extension-database')
  // 兼容 CJS（default）与 ESM 两种导出
  const loggerAdapterModule = await import('./loggerAdapter.js')
  const { createLoggerExtension } = loggerAdapterModule.default || loggerAdapterModule

  return new Server({
    port: ws_port, // 使用配置端口，避免与前端不一致
    // 设置服务器级别的防抖
    debounce: 3000, // Hocuspocus 内置防抖，3秒内的多次更新会合并
    extensions: [
      // 使用自定义日志扩展代替官方 Logger
      createLoggerExtension(),

      // 数据库扩展
      new Database({
        type: 'memory',
        // 其他数据库配置
      }),
    ],

    // 身份验证
    async onAuthenticate ({ token }) {
      if (!token) {
        logger.warn('身份验证失败: 无 token')
        return {
          user: { id: 'anonymous', name: '匿名用户' },
        }
      }

      try {

        const decoded = jwt.verify(token, 'ColabDocs')

        const userId = decoded.id
        const username = decoded.name

        logger.debug(`验证成功: 用户ID: ${userId}, 用户名: ${username}`)
        return {
          user: { id: userId, name: username },
        }
      } catch (error) {
        logger.error('身份验证错误', error)
        throw new Error('无效的访问令牌')
      }
    },

    // 连接事件
    async onConnect ({ documentName, context, socketId, clientsCount }) {
      const user = context?.user?.name || '未知用户'
      logger.info(
        `用户连接: ${user}, 文档: ${documentName}, 连接ID: ${socketId}, 当前连接数: ${clientsCount}`)
    },

  })
}

module.exports = { createHocuspocusServer }
