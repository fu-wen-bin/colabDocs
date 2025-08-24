import { Suspense, useMemo } from 'react'
import DocumentSidebar from './_components/DocumentSidebar'

import { useSearchParams } from 'react-router'
import MainContainer from '@/pages/Doc/MainContainer.tsx'
//import Page from '@/pages/Doc/Page.tsx'

export default function Doc () {
  const [searchParams] = useSearchParams();

  // 从查询参数获取 fileId
  const fileId = searchParams.get('fileId');

  // 根据是否有 fileId 来决定渲染哪个组件
  const mainContent = useMemo(() => {
    if (fileId) {
      return <MainContainer />;
    } else {
      return <MainContainer />;
    }
  }, [fileId]);
 return (
    <div className="flex h-screen bg-white dark:bg-slate-900 overflow-hidden">
      {/* 侧边栏区域 - 固定宽度设计 */}
      <Suspense>
        <DocumentSidebar/>
      </Suspense>

      {/* 主内容区域 */}
        {mainContent}

    </div>
  )
}