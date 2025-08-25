const { logger } = require('../utils/logger.js') // CommonJS 导入

/**
 * 创建 Hocuspocus 自定义日志扩展
 * 使用现有的 logger 而不是官方的 Logger 扩展
 */
function createLoggerExtension () {
  return {
    // 当文档被加载时
    onLoadDocument: ({ documentName }) => {
      logger.info(`文档加载: ${documentName}`)
    },

    // 当文档发生变更时
    onChange: ({ documentName, context, clientsCount }) => {
      const user = context?.user?.name || '未知用户'
      logger.info(
        `文档变更: ${documentName}, 用户: ${user}, 连接数: ${clientsCount}`)
    },

    // 当文档被存储时
    onStoreDocument: ({ documentName }) => {
      logger.debug(`文档已存储：${documentName}`)
    },

    // 断开连接事件
    onDisconnect: ({ documentName, context, socketId, clientsCount }) => {
      const user = context?.user?.name || '未知用户'
      logger.info(
        `用户断开连接: ${user}, 文档: ${documentName}, 连接ID: ${socketId}, 当前连接数: ${clientsCount}`)
    },


    // 授权事件
    onAuthorize: ({ documentName, context }) => {
      const user = context?.user?.name || '未知用户'
      logger.debug(`授权检查: 用户: ${user}, 文档: ${documentName}`)
    },

    // 配置完成
    onConfigure: () => {
      logger.info('Hocuspocus 配置完成')
    },

    // 发生错误时
    onError: ({ error }) => {
      logger.error(`Hocuspocus 错误: ${error.message}`, error)
    },
  }
}

module.exports = { createLoggerExtension }
