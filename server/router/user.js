const Router = require('@koa/router')
const router = new Router()
const { userLogin, findUser, userRegister } = require('../controllers/index.js')
const { sign } = require('../utils/jwt.js')
const { escape } = require('../utils/security.js')
const { verify } = require('../utils/jwt')
const { nanoid } = require('nanoid')

router.prefix('/user') // 路由前缀，所有路由都以 /user 开头

// 生成默认头像URL
function generateDefaultAvatar (username) {
  // 使用 DiceBear API 生成基于用户名的头像
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    username)}&backgroundColor=random`
}

// 登录接口
router.post('/login', async (ctx) => {
  // 1. 获取请求体中的数据
  // POST请求携带的参数都在请求体中
  let { username, password } = ctx.request.body
  console.log(`Received username: ${username}, password: ${password}`)
  username = escape(username) // 转义标签
  password = escape(password) // 转义标签

  // 2. 模拟登录验证--检验账号密码是否合法
  try {
    const res = await userLogin(username, password)
    if (res.length) { // 有长度代表有数据，返回登录成功
      // 这里不可以直接用res判断，因为对象不管空不空布尔值都为true
      let data = {
        id: res[0].id,
        username: res[0].username,
        nickname: res[0].nickname,
        create_time: res[0].create_time,
      }

      const access_token = sign(data, '1h')
      const refresh_token = sign(data, '7d')

      ctx.body = {
        code: '1', // 提示前端这种状态码代表登陆成功--用于处理逻辑错误
        message: '登录成功',
        data: data,
        access_token,
        refresh_token,

      }
    } else { // 逻辑性错误
      ctx.body = {
        code: '0', // 提示前端这种状态码代表登陆失败--用于处理逻辑错误
        message: '用户名或密码错误',
        data: {},
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

// 注册接口
router.post('/register', async (ctx) => {
  let { username, password, nickname } = ctx.request.body

    const userId = nanoid() // 生成 nanoId
    const avatarUrl = generateDefaultAvatar(username)
  // 验证数据不能为空
  if (!username || !password || !nickname) {
    ctx.body = {
      code: '0',
      message: '用户名、密码和昵称不能为空',
      data: {},
    }
  }

  // 转义标签
  username = escape(username)
  password = escape(password)
  nickname = escape(nickname)

  try {
    // 检验账号是否存在
    const res = await findUser(username)
    if (res.length) {
      ctx.body = {
        code: '0',
        message: '用户名已存在',
        data: {},
      }
      return
    }
    // 数据库写入
    const result = await userRegister(
      { username, password, nickname, create_time: Date.now() })
    if (result.affectedRows > 0) {
      // 注册成功
      ctx.body = {
        code: '1',
        message: '注册成功',
        data: {
          id: result.id,
          username,
          nickname,
          create_time: Date,
        },
      }

    } else {
      // 注册失败
      ctx.body = {
        code: '0',
        message: '注册失败，请稍后再试',
        data: {},
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

router.post('/githubRegister',async (ctx) => {
  // 1. 获取请求体中的数据
  // 从GitHub OAuth回调获取的用户信息
  const { id, name, login, node_id, avatar_url } = ctx.request.body

  try {
    // 检验账号是否存在
    const res = await findUser(name)
    if (res.length) {
      ctx.body = {
        code: '0',
        message: '用户名已存在',
        data: {},
      }
      return
    }
    // 数据库写入
    const result = await userRegister(
      { username, password, nickname, create_time: new Date() })
    if (result.affectedRows > 0) {
      // 注册成功
      ctx.body = {
        code: '1',
        message: '注册成功',
        data: {
          id: result.id,
          username,
          nickname,
          create_time: Date,
        },
      }

    } else {
      // 注册失败
      ctx.body = {
        code: '0',
        message: '注册失败，请稍后再试',
        data: {},
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

module.exports = router