const jwt = require('jsonwebtoken')

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
          console.log('token校验编码成功')
          ctx.name = decoded.name

          await next()
        }
      } catch (error) {
        console.log(error, '-----')
        ctx.status = 401
        ctx.body = { error: '登录过期请重新登录' }
      }

    } else {
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