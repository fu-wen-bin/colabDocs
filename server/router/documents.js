const Router = require('@koa/router')
const router = new Router()
const { sign, refreshVerify, verify } = require('../utils/jwt.js')
const { findContent } = require('../controllers/Documents')

router.prefix('/doc') // 路由前缀，所有路由都以 /token 开头

// 获取文档信息
router.post('/getContent', verify(), async (ctx) => {
  // 获取请求携带的数据
  const { fileId } = ctx.request.body
  console.log('文件ID', fileId)
  try {
    const res = await findContent({ fileId })
    if (res && res.length > 0) {
      ctx.body = {
        code: '1', // 提示前端这种状态码代表查询成功--用于处理逻辑错误
        message: '内容查询成功',
        content: res[0].json_content,
      }
    } else {
      ctx.body = {
        code: '0',
        message: '文档不存在或内容为空',
      }
    }
  } catch (error) {
    console.error('获取文档内容出错:', error)
    ctx.body = {
      code: '-1',
      message: '查询失败:' + error.message,
    }
  }
})




module.exports = router