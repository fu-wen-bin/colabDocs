const { logger } = require('../utils/logger.js')
const { ws_port } = require('../base.config.js')

// 使用动态 import 以在 CommonJS 中加载可能为 ESM-only 的依赖
async function createHocuspocusServer () {
  const { Server } = await import('@hocuspocus/server')
  const { Database } = await import('@hocuspocus/extension-database')
  // 兼容 CJS（default）与 ESM 两种导出
  const loggerAdapterModule = await import('./loggerAdapter.js')
  const { createLoggerExtension } = loggerAdapterModule.default || loggerAdapterModule

  return new Server({
    port: ws_port, // 使用配置端口，避免与前端不一致
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
        // 实际的 token 验证逻辑
        // ...

        logger.debug('身份验证成功')
        return {
          user: { id: 'user-id', name: 'Username' },
        }
      } catch (error) {
        logger.error('身份验证错误', error)
        throw new Error('无效的访问令牌')
      }
    },

    // 文档存储
    async onStoreDocument (data) {
      logger.debug(`文档 ${data.documentName} 已存储`)
      // 额外的存储逻辑
    },
  })
}

module.exports = { createHocuspocusServer }
