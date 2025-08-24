import React from 'react'
import { BrowserRouter, useRoutes } from 'react-router'

// 使用React.lazy懒加载组件
const Home = React.lazy(() => import('../pages/Home'))
const Auth = React.lazy(() => import('../pages/Auth'))
const AccountLogin = React.lazy(() => import('../pages/Auth/AccountLogin'))
const Callback = React.lazy(() => import('../pages/Auth/Callback'))
const Doc = React.lazy(() => import('../pages/Doc'))

const routes = [
  {
    path: '/',
    element: <Home/>,
  },
  {
    path: '/firstPage',
    element: <Home/>,
  },
  {
    path: '/auth',
    element: <Auth/>,
  },
  {
    path: '/auth/account',
    element: <AccountLogin/>,
  },
  {
    path: '/oauth/redirect',
    element: <Callback/>,
  },
  {
    path: '/doc',
    element: <Doc/>,
  }
]

function WrapperRoutes () {
  // useRoutes 是 react-router-dom v6.4+ 的新特性
  // useRoutes 只能用在路由组件中，也就是说该组件不能被抛出
  return useRoutes(routes)
  // 上述代码得到的是：
  /*
  <Routes>
    {/!*重定向自动去首页，如果未登录则去登录页*!/}
    <Route path="/" element={<Navigate to="/noteClass"/>}/>
    <Route path="/login" element={<Login/>}/>
  </Routes>
  */
}

export default function WrapperRouter () {
  return (
    <BrowserRouter>
      <WrapperRoutes/>
    </BrowserRouter>
  )
}