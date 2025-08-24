import { motion, useMotionValue, useSpring } from 'motion/react'
import { Button } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Edit3, FileText, Layers, Sparkles, UserRoundCheck } from 'lucide-react'
import axios, { authUtils } from '@/api'
import toast from 'react-hot-toast'

// 定义用户数据接口
interface UserValues {
  id: number;
  name: string;
  avatar_url: string;
}

// User响应接口，与后端返回结构匹配
// 由于拦截器直接返回 response.data，所以这个接口需要匹配后端的完整响应结构
interface UserResponse {
  success: boolean;
  code: string;
  message: string;
  data: UserValues; // 与后端 OauthGithub.js 中返回的结构一致
}

interface LogoutResponse {
  success: boolean;
  code: string;
  message: string;
}

export default function Index () {

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const navigate = useNavigate()

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springConfig = { damping: 25, stiffness: 700 }
  const springX = useSpring(mouseX, springConfig)
  const springY = useSpring(mouseY, springConfig)

  useEffect(() => {
    const getInfo = async () => {
      // 请求用户信息，则认为用户已登录
      try {
        console.log('开始请求用户信息')
        const response = await axios.get<UserResponse>('/user/getInfo')
        console.log('后端响应全部数据:', response)

        // 这里的 response 已经是 response.data，因为拦截器已经处理过
        if (response.data && response.data.code === '1') {
          const userData = response.data.data
          console.log('用户信息:', userData)

          // 设置用户信息到authUtils中
          authUtils.setUser(userData)
          setIsLoggedIn(true)
          toast.success(`欢迎回来，${userData.name}`)
        } else {
          console.warn('后端返回数据异常:', response)
          setIsLoggedIn(false)
        }
      } catch (error) {
        console.log('获取用户信息失败:', error)
        toast.error('获取用户信息失败，请登录')
        setIsLoggedIn(false)
      }

    }
    getInfo()
  }, [])

  // 添加effect使isMounted在组件挂载后变为true
  useEffect(() => {
    setIsMounted(true)

    // 处理鼠标移动事件
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - 192)
      mouseY.set(e.clientY - 192)
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }

  }, [mouseX, mouseY])

  // 快速开始按钮事件
  const handleGetStarted = () => {
    if (isLoggedIn) {
      // 假设用户已登录，跳转到仪表盘
      navigate('/doc')
    } else {
      // 假设用户未登录，跳转到登录页
      navigate('/auth')
    }
  }

  // 退出登录
  const handleLogout = async () => {
    // 清除本地存储的token和用户信息
    const logoutRes = await axios.post<LogoutResponse>('/user/logout')
    authUtils.clearUser()
    authUtils.clearTokens()
    setIsLoggedIn(false)
    toast.success(logoutRes.data.message)
    // 退出登录后跳转到首页
    navigate('/')
  }

  const features = [
    {
      icon: Edit3,
      title: '多人实时协作',
      description: '支持多人协同，实时看到其他人的光标和修改，就像 Google Docs 一样流畅',
      gradient: 'from-emerald-500 to-teal-600',
      glowColor: 'rgba(16, 185, 129, 0.3)',
      bgGradient: 'from-emerald-500/10 via-teal-500/5 to-emerald-500/10',
      details: ['实时同步编辑', '冲突自动解决', '历史版本追踪'],
    },

    {
      icon: Layers,
      title: '丰富编辑功能',
      description: '支持富文本、表格、代码块、图片等多种内容格式，满足各种文档编写需求',
      gradient: 'from-blue-500 to-cyan-600',
      glowColor: 'rgba(59, 130, 246, 0.3)',
      bgGradient: 'from-blue-500/10 via-cyan-500/5 to-blue-500/10',
      details: ['富文本编辑', '插入表格图片', '代码语法高亮'],
    },

    {
      icon: UserRoundCheck,
      title: '用户体验友好',
      description: '界面UI清晰，符合现代审美，提供直观的操作方式和丰富的快捷键',
      gradient: 'from-indigo-400 to-violet-500',
      glowColor: 'rgba(129, 140, 248, 0.18)',
      bgGradient: 'from-gray-400/20 via-violet-200/10 to-gray-400/20',
      details: ['直观的界面设计', '丰富的快捷键支持', '自定义主题和样式'],
    },
  ]

  return (
    <div
      className="min-h-screen bg-black relative overflow-hidden"
    >
      {/* 动态背景 */}
      <div className="absolute inset-0">
        {/* 鼠标跟随光圈 - 使用优化的 motion value */}
        <motion.div
          className="absolute w-96 h-96 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-full blur-3xl pointer-events-none will-change-transform"
          style={{
            x: springX,
            y: springY,
          }}
        />

        {/* 网格背景 */}
        <div
          className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[length:60px_60px]"/>
      </div>

      {/* Header - 从这里移除了Hero Section */}
      <header className="relative z-50 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div
              className="w-10 h-10 bg-gradient-to-b from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <FileText className="h-5 w-5 text-white"/>
            </div>
            <span className="text-2xl font-bold text-white">ColabDocs</span>

          </motion.div>

          <motion.div
            className="flex items-center space-x-6 transition-all duration-300"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          >
            {
              isLoggedIn ?
                <Button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-orange-500 to-red-400 hover:bg-white hover:from-white hover:to-white text-white hover:text-orange-500 shadow-lg shadow-orange-500/25 transition-all duration-300 w-[90px] h-[36px] rounded-[8px] flex items-center justify-center border-none"
                  >
                  退出登录
                </Button> : ''
            }
            <Button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:bg-white hover:from-white hover:to-white text-white hover:text-emerald-500 shadow-lg shadow-emerald-500/25 transition-all duration-300 w-[90px] h-[36px] rounded-[8px] flex items-center justify-center border-none"
            >
              {isLoggedIn ? '快速开始' : '免费使用'}
            </Button>

          </motion.div>

        </div>
      </header>

      {/* Hero Section - 现在作为header的兄弟元素，而不是嵌套在内部 */}
      <section
        className="relative px-6 flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="max-w-7xl mx-auto text-center relative z-10 w-full">
          {/* 主标题部分 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mb-12"
          >
            <div
              className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-xl text-white px-4 py-2 rounded-full border border-white/10 mb-6">
              <Sparkles className="h-4 w-4 text-emerald-200"/>
              <span
                className="text-sm font-medium">基于 Tiptap + Yjs 构建</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span
                className="bg-gradient-to-r from-white via-emerald-100 to-green-100 bg-clip-text text-transparent">
                在线协作
              </span>
              <br/>
              <span
                className="bg-gradient-to-r from-emerald-200 via-green-400 to-teal-500 bg-clip-text text-transparent">
                文档编辑器
              </span>
            </h1>

            <p
              className="text-lg text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              让团队像使用 Google Docs 一样协作编辑文档
              <br/>
              <span
                className="text-gray-400">支持实时同步、富文本编辑、版本管理</span>
            </p>
          </motion.div>

          {/* 三个功能卡片 - 美化版本，有平滑的加载状态 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: isMounted ? 1 : 0.7, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{
                  opacity: isMounted ? 1 : 0.6,
                  y: 0,
                  scale: isMounted ? 1 : 0.95,
                }}
                transition={{
                  duration: 0.6,
                  delay: isMounted ? 0.4 + index * 0.1 : 0.2 + index * 0.05,
                  ease: 'easeOut',
                }}
                className="group relative"
              >
                {/* 背景渐变光效 - 只在 mounted 后显示完整效果 */}
                <div
                  className={`absolute -inset-0.5 bg-gradient-to-r ${feature.gradient} rounded-3xl blur transition-all duration-1000 ${
                    isMounted
                      ? 'opacity-20 group-hover:opacity-40 group-hover:duration-200'
                      : 'opacity-10'
                  }`}
                />

                {/* 主卡片 */}
                <div
                  className="relative bg-black/80 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
                  {/* 顶部装饰渐变 */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient}`}
                  />

                  {/* 背景图案 */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} transition-opacity duration-1000 ${
                      isMounted ? 'opacity-30' : 'opacity-10'
                    }`}
                  />

                  {/* 内容区域 */}
                  <div className="relative p-6 h-full">
                    {/* 图标区域 */}
                    <div className="flex justify-center mb-4">
                      <motion.div
                        className={`relative w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 ${
                          isMounted ? 'group-hover:scale-110' : ''
                        }`}
                        style={{
                          boxShadow: isMounted
                            ? `0 15px 30px ${feature.glowColor}, 0 0 0 1px rgba(255,255,255,0.1)`
                            : `0 8px 16px ${feature.glowColor}, 0 0 0 1px rgba(255,255,255,0.05)`,
                        }}
                        whileHover={
                          isMounted
                            ? {
                              scale: 1.15,
                              boxShadow: `0 20px 40px ${feature.glowColor}, 0 0 0 1px rgba(255,255,255,0.2)`,
                            }
                            : undefined
                        }
                        transition={{ duration: 0.3 }}
                      >
                        <feature.icon
                          className="h-7 w-7 text-white drop-shadow-lg"/>

                        {/* 图标光环效果 - 只在 mounted 后显示 */}
                        {isMounted && (
                          <div
                            className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-500`}
                          />
                        )}
                      </motion.div>
                    </div>

                    {/* 标题 */}
                    <h2
                      className={`text-xl font-bold text-white mb-3 transition-all duration-300 ${
                        isMounted
                          ? 'group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-white group-hover:to-gray-300'
                          : ''
                      }`}
                    >
                      {feature.title}
                    </h2>

                    {/* 描述 */}
                    <p
                      className={`text-gray-400 text-sm mb-4 leading-relaxed transition-colors duration-300 ${
                        isMounted ? 'group-hover:text-gray-300' : ''
                      }`}
                    >
                      {feature.description}
                    </p>

                    {/* 特性列表 */}
                    <div className="space-y-2">
                      {feature.details.map((detail, detailIndex) => (
                        <motion.div
                          key={detailIndex}
                          className={`flex items-center text-xs text-gray-500 transition-colors duration-300 ${
                            isMounted ? 'group-hover:text-gray-400' : ''
                          }`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: isMounted ? 0.6 + detailIndex * 0.1 : 0.3 +
                                                                         detailIndex *
                                                                         0.05,
                            duration: 0.4,
                          }}
                        >
                          <div
                            className={`w-1.5 h-1.5 bg-gradient-to-r ${feature.gradient} rounded-full mr-3 flex-shrink-0 shadow-sm`}
                          />
                          <span>{detail}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* 底部装饰线 */}
                    <div
                      className={`absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r ${feature.gradient} transition-opacity duration-500 ${
                        isMounted
                          ? 'opacity-20 group-hover:opacity-40'
                          : 'opacity-10'
                      }`}
                    />
                  </div>

                  {/* 悬浮时的边框光效 - 只在 mounted 后显示 */}
                  {isMounted && (
                    <div
                      className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                      style={{
                        background: `linear-gradient(135deg, ${feature.glowColor}00, ${feature.glowColor}20, ${feature.glowColor}00)`,
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 0 20px ${feature.glowColor}`,
                      }}
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  )
}