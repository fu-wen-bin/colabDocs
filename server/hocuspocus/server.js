const { logger } = require('../utils/logger.js')
const { ws_port } = require('../base.config.js')
const jwt = require('jsonwebtoken')
const { decode } = require('../utils/jwt')
const { findContent } = require('../controllers/Documents')

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
      // createLoggerExtension(),

      // 数据库扩展
      new Database({
        type: 'memory',
        // 其他数据库配置
      }),
    ],

    // 验证用户身份
    async onAuthenticate ({ token }) {
      if (!token) {
        logger.error('身份验证失败: 无 token')
        throw new Error("身份验证失败: 无 token");
      }

      try {
        const { userId, username } = decode(token)
        const currentTime = new Date().toLocaleString()

        const user = {
          id: userId,
          name: username,
          loginTime: currentTime,
        }

        logger.debug(
          `验证成功！用户ID：${userId}，用户名：${username}，时间：${currentTime}`)

        // 直接返回用户信息，而不是尝试使用 connection.context
        return { user }
      } catch (error) {
        logger.error('身份验证错误', error)
        throw new Error("身份验证错误！");
      }
    },

    // 连接时
    async onConnect ({ documentName }){
      logger.debug(`正在连接到文档 ${documentName}`)
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

  })
}

module.exports = { createHocuspocusServer }
