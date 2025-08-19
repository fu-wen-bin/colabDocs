const Koa = require('koa')
const cors = require('@koa/cors')
const json = require('koa-json')
const { bodyParser } = require('@koa/bodyparser')
const { server_port, ws_port } = require('./base.config.js') // 引入 server_port
const { logger } = require('./utils/logger.js')
const { createHocuspocusServer } = require('./hocuspocus/server.js')

// 兼容路由的 CommonJS/ESM 导出
const oauthRouterModule = require('./router/OauthGithub.js')
const tokenRouterModule = require('./router/token.js')
const oauthRouter = oauthRouterModule.default || oauthRouterModule
const tokenRouter = tokenRouterModule.default || tokenRouterModule

// 创建 Koa 应用
const app = new Koa()

// 跨域中间件
// 必须先让跨域代码在路由之前
app.use(cors({
  origin: 'http://localhost:5173', // 前端应用的域名
  credentials: true, // 允许跨域请求携带凭证（Cookie）
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept']
}))

app.use(json())
// 解析请求体中间件
// 必须先让代码在路由之前
app.use(bodyParser(
  {
    enableTypes: ['json', 'form', 'text'], // 支持的请求体类型
    jsonLimit: '50mb', // 限制json请求体大小为50MB
    formLimit: '50mb', // 限制form请求体大小为50MB
    textLimit: '50mb', // 限制text请求体大小为50MB
  }
)) // 辅助koa解析请求体中的数据，ctx.request.body

// 添加日志中间件
app.use(async (ctx, next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  logger.info(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// useRouter 是一个对象，不是函数
// 1. 被 app.use 调用的函数中一定拥有参数 ctx
// 2. userRouter.routes() 就是 user.js 中所有被定义好的路由的回调函数
app.use(oauthRouter.routes()).use(oauthRouter.allowedMethods())
app.use(tokenRouter.routes()).use(tokenRouter.allowedMethods())

// 启动流程：分别启动 WS 与 HTTP
;(async () => {
  try {
    const hocuspocus = await createHocuspocusServer()
    // 直接使用端口号，避免传入 { server } 导致 ERR_INVALID_ARG_VALUE
    hocuspocus.listen()
    logger.success(`Hocuspocus WS 运行在 ws://localhost:${ws_port}`)

    app.listen(server_port, () => {
      logger.success(`HTTP 服务运行在 http://localhost:${server_port}`)
    })
  } catch (err) {
    logger.error('Hocuspocus 初始化失败:', err)
    process.exit(1)
  }
})().catch((err) => {
  logger.error('启动失败:', err)
  process.exit(1)
})

// 应用级错误
app.on('error', (err, ctx) => {
  logger.error('Koa 应用错误:', err)
})

process.on('unhandledRejection', (reason) => {
  logger.error('未处理的 Promise 拒绝:', reason)
})

process.on('uncaughtException', (err) => {
  logger.error('未捕获的异常:', err)
  process.exit(1)
})