const Router = require('@koa/router')
const router = new Router()
const { sign, refreshVerify } = require('../utils/jwt.js')
const { verify } = require('../utils/jwt')

router.prefix('/doc') // 路由前缀，所有路由都以 /token 开头

// 获取文档信息
