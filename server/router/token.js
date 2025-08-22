const Router = require('@koa/router')
const router = new Router()
const { sign, refreshVerify } = require('../utils/jwt.js')
const { verify } = require('../utils/jwt')

router.prefix('/token') // 路由前缀，所有路由都以 /token 开头

// 初始化access_token和refresh_token
router.post('/init', async (ctx) => {
  // 1. 获取请求体中的数据
  // 从GitHub OAuth回调获取的用户信息
  const { id, name, login, node_id, avatar_url } = ctx.request.body

  try {
    // 这里我们不需要查询数据库，直接根据GitHub返回的信息生成token
    let data = {
      id,
      name,
      login,
      node_id,
      avatar_url,
    }

    const access_token = sign(data, '1h')
    const refresh_token = sign(data, '7d')

    // 返回标准格式的响应
    ctx.body = {
      code: '1',
      message: '登录成功',
      access_token,
      refresh_token,
      userdata: data,
    }
  } catch (error) { // 程序性错误，返回错误信息
    ctx.body = {
      code: '-1',
      message: '服务器错误',
      error: error.message,
    }
  }
})

// 刷新token的路由
router.post('/refresh', async (ctx) => {
  const { refresh_token } = ctx.request.body
  if (!refresh_token) {
    ctx.status = 401
    ctx.body = {
      code: '0',
      message: '未提供刷新令牌',
    }
    return
  }

  try {
    // 验证refresh_token
    const decoded = await refreshVerify(refresh_token)

    if (!decoded || !decoded.id) {
      ctx.status = 401
      ctx.body = {
        code: '0',
        message: '无效的刷新令牌',
      }
      return
    }

    // 关键：只挑选业务字段，避免把 exp/iat 等保留字段传入 sign
    const payload = {
      id: decoded.id,
      name: decoded.name,
      login: decoded.login,
      node_id: decoded.node_id,
      avatar_url: decoded.avatar_url,
    }

    // 生成新的access_token
    const access_token = sign(payload, '1d')

    ctx.body = {
      code: '1',
      message: '刷新成功',
      access_token,
      refresh_token, // 返回原refresh_token
    }
  } catch (error) {
    ctx.status = 401
    ctx.body = {
      code: '0',
      message: '无效的刷新令牌',
      error: error.message,
    }
  }
})

module.exports = router
