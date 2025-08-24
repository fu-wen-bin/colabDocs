import { Button } from 'antd'
import { Github, User } from 'lucide-react'
import { useNavigate } from 'react-router'

export default function Login () {

  const navigate = useNavigate()

  const handleGitHubLogin = () => {
    const clientID = 'Ov23liLWI73TRxSWHiPg'
    const authorize_uri = 'https://github.com/login/oauth/authorize'
    // 这里必须和GitHub应用设置中的回调URL一致
    const redirect_uri = 'http://localhost:5173/oauth/redirect'
    // 构建GitHub授权URL
    const authUrl = `${authorize_uri}?client_id=${clientID}&redirect_uri=${redirect_uri}`

    window.location.href = authUrl
  }

  const handleAccountLogin = () => {
    navigate('/auth/account')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div
        className="w-full max-w-md p-10 space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">欢迎回来</h1>
          <p className="mt-3 text-gray-600">请登录以继续使用文档系统</p>
        </div>

        <div
          className="flex flex-col items-center justify-center space-y-6 mt-8">
          <div className="w-full border-t border-gray-100"></div>

          <Button
            className="w-full flex items-center justify-center py-4 px-4 space-x-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-md"
            onClick={handleGitHubLogin}
          >
            <Github className="mr-2 h-5 w-5 text-white"/>
            <span className="text-base text-white">使用 GitHub 登录</span>
          </Button>

          <Button
            className="w-full flex items-center justify-center py-4 px-4 space-x-3 text-gray-700 hover:text-gray-900 border-gray-200 hover:border-gray-300 rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
            onClick={handleAccountLogin}
          >
            <User className="mr-2 h-5 w-5"/>
            <span className="text-base">使用账号密码登录</span>
          </Button>

          <p
            className="text-sm text-gray-500 mt-6">安全登录，保护您的账户隐私</p>
        </div>

      </div>
    </div>
  )
}