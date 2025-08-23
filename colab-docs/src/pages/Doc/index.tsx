import { Suspense} from 'react'
import DocumentSidebar from './_components/DocumentSidebar'

import { Outlet } from 'react-router'

export default function Doc () {
 return (
    <div className="flex h-screen bg-white dark:bg-slate-900 overflow-hidden">
      {/* 侧边栏区域 - 固定宽度设计 */}
      <Suspense>
        <DocumentSidebar/>
      </Suspense>

      {/* 主内容区域 */}
      <Outlet/>

    </div>
  )
}