const Router = require('@koa/router')
const router = new Router()
const { sign, verify } = require('../utils/jwt.js')
const { escape } = require('../utils/security.js')
const { nanoid } = require('nanoid')
const {
  findUser,
  userGithubRegister,
  userAccountRegister, userAccountLogin, githubUserUpdate,
} = require('../controllers/Account')
const axios = require('axios')
const jwt = require('jsonwebtoken')
const COOKIE_MAX_AGE = 400 * 24 * 60 * 60 * 1000 // 400天

router.prefix('/user') // 路由前缀，所有路由都以 /user 开头

// 生成默认头像URL
function generateDefaultAvatar (username) {
  // 随机生成背景颜色
  const bgc = Math.floor(Math.random() * 16777215).toString(16)
  // 使用 DiceBear API 生成基于用户名的头像
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
    username)}&backgroundColor=${bgc}`
}

// 登录接口
router.post('/accountLogin', async (ctx) => {
  // 1. 获取请求体中的数据
  // POST请求携带的参数都在请求体中
  let { name, password } = ctx.request.body
  console.log(`Received username: ${name}, password: ${password}`)
  name = escape(name) // 转义标签
  password = escape(password) // 转义标签

  // 2. 模拟登录验证--检验账号密码是否合法
  try {
    const res = await userAccountLogin(name, password)
    if (res.length) { // 有长度代表有数据，返回登录成功
      // 这里不可以直接用res判断，因为对象不管空不空布尔值都为true
      let data = {
        id: res[0].id,
        name: res[0].name,
        avatar_url: res[0].avatar_url,
      }

      const access_token = sign(data, '1h')
      const refresh_token = sign(data, '7d')

      ctx.body = {
        code: '1', // 提示前端这种状态码代表登陆成功--用于处理逻辑错误
        message: '登录成功',
        userdata: data,
        access_token,
        refresh_token,
      }
    } else { // 逻辑性错误
      ctx.body = {
        code: '0', // 提示前端这种状态码代表登陆失败--用于处理逻辑错误
        message: '用户名或密码错误',
      }
    }
  } catch (error) { // 程序性错误，返回错误信息
    ctx.body = {
      code: '-1',
      message: '服务器错误',
      error: error.message,
    }
  }
})

// 账户注册接口
router.post('/accountRegister', async (ctx) => {
  let { name, password } = ctx.request.body

  const id = nanoid() // 生成 nanoId
  const avatar_url = generateDefaultAvatar(name)

  // 转义标签
  name = escape(name)
  password = escape(password)

  try {
    // 检验账号是否存在
    const res = await findUser({ name })
    if (res.length) {
      ctx.body = {
        code: '0',
        message: '用户已存在',
      }
      return
    }
    // 数据库写入
    const result = await userAccountRegister(
      { id, name, password, avatar_url })
    if (result.affectedRows > 0) {
      // 注册成功
      ctx.body = {
        code: '1',
        message: '注册成功',
        id: result.id,
        name: result.name,
        avatar_url: result.avatar_url,
        create_time: result.create_time,
      }

    } else {
      // 注册失败
      ctx.body = {
        code: '0',
        message: '注册失败，请稍后再试',
      }
    }
  } catch (error) {
    ctx.body = {
      code: '-1',
      message: '服务器错误',
      error: error.message,
    }
  }
})

// GitHub账户初始化接口
router.post('/githubRegister', async (ctx) => {
  // 1. 获取请求体中的数据
  // 从GitHub OAuth回调获取的用户信息
  const { id, name, avatar_url } = ctx.request.body

  console.log(`Received id: ${id}, name: ${name}, avatar_url: ${avatar_url}`)

  try {
    // 检验账号是否存在
    const res = await findUser({ id })
    if (res.length) {
      const updateResult = await githubUserUpdate({ id, name, avatar_url })
      if (updateResult.affectedRows > 0) {
        // 更新成功
        ctx.body = {
          code: '1',
          message: '用户已存在，更新信息成功',
          id: res[0].id,
          name: res[0].name,
          avatar_url: res[0].avatar_url,
          create_time: res[0].create_time,
        }
        return
      }
    }
    // 数据库写入
    const result = await userGithubRegister(
      { id, name, avatar_url })
    if (result.affectedRows > 0) {
      // 注册成功
      ctx.body = {
        code: '1',
        message: '首次使用，自动注册成功',
        id: result.id,
        name: result.id,
        avatar_url: result.avatar_url,
        create_time: result.create_time,
      }

    } else {
      // 注册失败
      ctx.body = {
        code: '0',
        message: '注册失败，请稍后再试',
      }
    }
  } catch (error) {
    ctx.body = {
      code: '-1',
      message: '服务器错误',
      error: error.message,
    }
  }

})

// 获取用户信息接口
router.get('/getInfo', verify(), async (ctx) => {
  const gitToken = ctx.cookies.get('github_token')
  const access_token = ctx.headers.authorization

  console.log('获取到的GitHub令牌:', gitToken)

  if (!gitToken) {
    const decoded = jwt.verify(access_token, 'ColabDocs')
    console.log('用户信息解码成功')
    ctx.status = 200
    ctx.body = {
      success: true,
      code: '1', // 添加code字段，保持接口一致性
      message: '获取用户信息成功',
      data: {
        id: decoded.id,
        name: decoded.name,
        avatar_url: decoded.avatar_url,
      },
    }
    return
  }

  try {
    ctx.cookies.set('github_token', gitToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      overwrite: true,
    })

    console.log('准备请求GitHub API...')
    const result = await axios({
      method: 'get',
      url: `https://api.github.com/user`,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${gitToken}`,
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

// 用户退出登录
router.post('/logout', async (ctx) => {
  ctx.cookies.set('github_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    // path: '/',
  })
  console.log('已清除GitHub令牌cookie')
  ctx.body = {
    code: '1',
    success: true,
    message: '已退出登录',
  }
})

module.exports = router