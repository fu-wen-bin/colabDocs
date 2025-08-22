const jwt = require('jsonwebtoken')
const { logger } = require('./logger')

function sign (options, duration) {
  return jwt.sign(options, 'ColabDocs', {
    expiresIn: duration, // 过期时间
  })
}

function verify () {
  return async (ctx, next) => {
    const token = ctx.headers.authorization
    if (token) {
      // 校验合法
      try {
        const decoded = jwt.verify(token, 'ColabDocs')
        if (decoded.id) { // 合法
          logger.success('token校验编码成功')
          ctx.name = decoded.name

          await next()
        } else {
          console.log('token校验编码失败')
        }

      } catch (error) {
        console.log(error, '-----')
        ctx.status = 401
        ctx.body = { error: '登录过期请重新登录' }
      }

    } else {
      logger.info('没有token')
      ctx.status = 401
      ctx.body = { error: '登录过期请重新登录' }
    }
  }
}

function refreshVerify (token) {
  try {
    const decoded = jwt.verify(token, 'ColabDocs')
    if (decoded.id) {
      return decoded
    }
  } catch (error) {
    return false
  }
}

module.exports = {
  sign,
  verify,
  refreshVerify,
}