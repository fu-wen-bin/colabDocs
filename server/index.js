const Koa = require('koa')
const app = new Koa()
const cors = require('@koa/cors')
const oauthRouter = require('./router/OauthGithub.js')
const tokenRouter = require('./router/token.js')
const { bodyParser } = require('@koa/bodyparser')

// 跨域中间件
// 必须先让跨域代码在路由之前
app.use(cors({
  origin: 'http://localhost:5173', // 前端应用的域名
  credentials: true, // 允许跨域请求携带凭证（Cookie）
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept']
}))

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

/*app.use(async (ctx) => {
  console.log(ctx)
  if(ctx.request.url === '/home'){
    ctx.body = 'Hello, World!'
  }
})*/

// useRouter 是一个对象，不是函数
// 1. 被 app.use 调用的函数中一定拥有参数 ctx
// 2. userRouter.routes() 就是 user.js 中所有被定义好的路由的回调函数
 app.use(oauthRouter.routes(), oauthRouter.allowedMethods())
 app.use(tokenRouter.routes(), tokenRouter.allowedMethods())


app.listen(8888, () => {
  console.log('Server is running on http://localhost:8888')
})