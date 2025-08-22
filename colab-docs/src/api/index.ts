import axios from 'axios'
import toast from 'react-hot-toast'

// 设置axios的默认地址配置
axios.defaults.baseURL = 'http://localhost:8888'
// 关键：允许跨站发送cookie（用于 github_token）
axios.defaults.withCredentials = true

// 告诉浏览器如果发送的是 post 请求，后端数据一定会以json格式返回。
// 此时浏览器需要以解析 json 的方式来解析响应体
axios.defaults.headers.post['Content-Type'] = 'application/json'

// 响应拦截器 - 处理token过期和错误情况
axios.interceptors.response.use(
  response => {
    // 特殊处理OAuth回调接口，直接返回响应数据
    if (response.config.url && response.config.url.includes('/oauth/callback')) {
      return response;
    }

    if (response.status !== 200) {
      // 程序性错误
      toast.error('服务器异常')
      return Promise.reject(response) // 返回一个被拒绝的 Promise，方便程序员捕获异常用于调试
    } else {
      if (response.data.code !== '1') {
        // 逻辑性错误
        toast.error(response.data.message)
        return Promise.reject(response) // 返回一个被拒绝的 Promise，方便程序员捕获异常用于调试
      }
      return Promise.resolve(response)
    }
  },
  async error => {
    // 处理401错误（Token过期或无效）
    if (error.response && error.response.status === 401) {
      // 尝试使用refresh_token获取新token
      try {
        const refreshToken = authUtils.getRefreshToken()

        if (!refreshToken) {
          // 没有refresh_token，直接跳转登录页
          window.location.href = '/auth'
          return Promise.reject(error)
        }

        // 使用refresh_token获取新的access_token
        const res = await axios.post('/token/refresh', {
          refresh_token: refreshToken,
        }, {
          headers: { 'Authorization': '' }, // 清空Authorization头
        })
        console.log(res.data)

        if (res.data && res.data.access_token) {
          // 保存新token
          authUtils.setTokens(res.data.access_token, res.data.refresh_token)

          // 规范为 Bearer
          error.config.headers.Authorization = `Bearer ${res.data.access_token}`
          return axios(error.config)
        } else {
          // 刷新token失败，跳转登录页
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/auth'
          return Promise.reject(error)
        }
      } catch (refreshError) {
        // 刷新token过程出错，清除token并跳转登录页
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/auth'
        return Promise.reject(error)
      }
    }

    // 处理其他错误情况
    if (error.response) {
      switch (error.response.status) {
        case 403: // 禁止访问
          console.error('权限不足，无法访问请求的资源')
          break
        case 404: // 资源不存在
          console.error('请求的资源不存在')
          break
        case 500: // 服务器错误
        case 502: // 网关错误
        case 503: // 服务不可用
        case 504: // 网关超时
          console.error('服务器错误，请稍后再试')
          break
        default:
          console.error(`未处理的错误状态: ${error.response.status}`)
          break
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('网络错误，无法连接到服务器')
    } else {
      // 请求设置时发生错误
      console.error('请求配置错误', error.message)
    }

    return Promise.reject(error)
  },
)

// 请求拦截器 - 添加JWT token到请求头
axios.interceptors.request.use(
  config => {
    // 获取token
    const accessToken = localStorage.getItem('access_token')

    // 如果有token，添加到请求头
    if (accessToken) {
      // 规范为 Bearer
      config.headers.Authorization = accessToken
    }

    // 添加请求时间戳，避免缓存问题
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: new Date().getTime(),
      }
    }

    return config
  },
  error => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  },
)

// 提供token管理工具
export const authUtils = {
  setTokens (accessToken: string, refreshToken: string) {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
  },

  clearTokens () {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },

  getAccessToken () {
    return localStorage.getItem('access_token')
  },

  getRefreshToken () {
    return localStorage.getItem('refresh_token')
  },

  isAuthenticated () {
    return !!localStorage.getItem('access_token')
  },

  setUser (userInfo: any) {
    // 将用户信息存储为JSON字符串
    localStorage.setItem('userInfo', JSON.stringify(userInfo))
  },

  getUser () {
    const userStr = localStorage.getItem('userInfo')
    try {
      return userStr ? JSON.parse(userStr) : null
    } catch (e) {
      console.error('解析用户信息失败:', e)
      return null
    }
  }
}

export default axios
