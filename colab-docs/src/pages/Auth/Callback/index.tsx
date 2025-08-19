import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios, { authUtils } from '@/api'
import toast from 'react-hot-toast'

// 定义用户数据接口
interface UserValues {
  id: number;
  name: string;
  login: string;
  node_id: string;
  avatar_url: string;
}

// Token响应接口，使其与后端返回结构匹配
interface TokenResponse {
  code: string;
  message: string;
  userdata: UserValues;
  access_token: string;
  refresh_token: string;
}

export default function OauthCallback () {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      // 从URL获取授权码
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      console.log('授权码:', code)

      if (!code) {
        setError('授权失败，未获取到授权码')
        setLoading(false)
        return
      }

      try {
        // 向后端发送授权码获取用户信息
        const response = await axios.get(
          `http://localhost:8888/oauth/callback?code=${code}`, {
            withCredentials: true, // 允许跨域请求携带cookie
          })
        console.log('后端响应:', response)

        // 修改：从response.data获取数据
        const userData = response.data;

        const values: UserValues = {
          id: userData.id,
          name: userData.name,
          login: userData.login,
          node_id: userData.node_id,
          avatar_url: userData.avatar_url,
        }
        console.log('用户信息:', values)

        if (response.data.success) {
          // 后端响应成功后发出请求，生成jwt的token
          const tokenResponse = await axios.post<TokenResponse>('/token/init', values)
          console.log('Token响应:', tokenResponse)

          // 修改：从tokenResponse.data获取数据
          if (tokenResponse.data) {
            // 使用authUtils中的方法保存token
            authUtils.setTokens(tokenResponse.data.access_token, tokenResponse.data.refresh_token)

            // 将data转成json字符串存储到浏览器中
            localStorage.setItem('userInfo', JSON.stringify(tokenResponse.data.userdata))

            // 登录成功弹窗
            toast.success(tokenResponse.data.message)
            navigate('/')
          }
        } else {
          setError('登录失败')
          setLoading(false)
        }
      } catch (error) {
        console.error('认证处理出错:', error)
        setError('登录过程发生错误')
        setLoading(false)
      }
    }

    handleCallback()
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4">处理中...</div>
          <p>正在完成登录，请稍候...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="error-icon mb-4">❌</div>
          <p className="text-red-500">{error}</p>
          <button onClick={() => navigate('/auth')}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
            返回登录页
          </button>
        </div>
      </div>
    )
  }

  return null
}