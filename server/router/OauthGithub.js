const Router = require('@koa/router')
const router = new Router()
const axios = require('axios')
const { verify } = require('../utils/jwt')
// 在应用顶部引入dotenv
require('dotenv').config()

// 从环境变量获取敏感信息
const clientID = process.env.GITHUB_CLIENT_ID || 'Ov23liLWI73TRxSWHiPg'
const clientSecret = process.env.GITHUB_CLIENT_SECRET ||
                     '4a6368fbc73fe2ae4e260726fc7e64b8904ea8c4'
const COOKIE_MAX_AGE = parseInt(process.env.COOKIE_MAX_AGE) || 30 * 24 * 60 *
                       60 * 1000 // 30天

// GitHub授权回调处理
router.get('/oauth/callback', async (ctx) => {
  const requestToken = ctx.request.query.code
  console.log('收到GitHub授权码:', requestToken)

  if (!requestToken) {
    ctx.status = 400
    ctx.body = { error: '缺少授权码' }
    return
  }

  try {
    // 获取访问令牌 - 使用更规范的格式
    console.log('开始请求GitHub访问令牌')
    const tokenResponse = await axios({
      method: 'post',
      url: 'https://github.com/login/oauth/access_token?' +
           `client_id=${clientID}&` +
           `client_secret=${clientSecret}&` +
           `code=${requestToken}`,
      headers: {
        accept: 'application/json',
      },
    })

    console.log('GitHub令牌响应:', tokenResponse.data)

    const accessToken = tokenResponse.data.access_token

    if (!accessToken) {
      console.error('访问令牌获取失败:', tokenResponse.data)
      ctx.status = 401
      ctx.body = { error: '获取访问令牌失败' }
      return
    }

    console.log('成功获取令牌(部分):', accessToken.substring(0, 5) + '...')

    // 获取用户信息 - 修改Authorization头格式
    const result = await axios({
      method: 'get',
      url: `https://api.github.com/user`,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'ColabDocs', // 添加User-Agent头，GitHub API要求
      },
    })

    console.log('GitHub用户数据:', result.data)

    ctx.cookies.set('github_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      // path: '/', // 如有需要可明确指定
    })

    ctx.body = {
      success: true,
      code: '1', // 添加code字段，保持接口一致性
      message: '登录成功',
      id: result.data.id,
      name: result.data.name,
      login: result.data.login,
      node_id: result.data.node_id,
      avatar_url: result.data.avatar_url,

    }
  } catch (error) {
    console.error('OAuth处理错误:', error.message)
    if (error.response) {
      console.error('错误详情:', error.response.data)
    }
    ctx.status = 500
    ctx.body = { error: '授权处理失败' }
  }
})

// 获取当前用户信息API
router.get('/api/user', verify(), async (ctx) => {
  const token = ctx.cookies.get('github_token')
  console.log('获取到的GitHub令牌:', token)

  if (!token) {
    ctx.status = 401
    ctx.body = { error: '未登录' }
    return
  }

  try {
    console.log('准备请求GitHub API...')
    const result = await axios({
      method: 'get',
      url: `https://api.github.com/user`,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'ColabDocs', // 添加User-Agent头，GitHub API要求
      },
    })

    console.log('GitHub API响应成功:', result.data.login)
    ctx.status = 200
    ctx.body = {
      success: true,
      code: '1', // 添加code字段，保持接口一致性
      message: '获取用户信息成功',
      data: {
        id: result.data.id,
        name: result.data.name,
        login: result.data.login,
        node_id: result.data.node_id,
        avatar_url: result.data.avatar_url,
      },

    }
  } catch (error) {
    // 增强错误日志
    console.error('GitHub API请求失败:', error.message)
    if (error.response) {
      console.error('错误状态码:', error.response.status)
      console.error('错误详情:', error.response.data)
    }

    // 令牌可能已失效
    ctx.cookies.set('github_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    })
    ctx.status = 401
    ctx.body = { error: '登录已过期' }
  }
})

// 注销API
router.post('/api/logout', (ctx) => {
  ctx.cookies.set('github_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    // path: '/',
  })
  ctx.body = { success: true }
})

module.exports = router