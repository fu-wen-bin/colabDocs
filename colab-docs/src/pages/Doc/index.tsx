import { Suspense, useState } from 'react'
import DocumentSidebar from './_components/DocumentSidebar'
import MainContainer from './MainContainer.tsx'
import Page from './Page.tsx'

export default function Doc () {
  const [documentId, setDocumentId] = useState<string | null>('example-doc')
  return (
    <div className="flex h-screen bg-white dark:bg-slate-900 overflow-hidden">
      {/* 侧边栏区域 - 固定宽度设计 */}
      <Suspense>
        <DocumentSidebar/>
      </Suspense>

      {/* 主内容区域 */}
      {
        documentId ? <MainContainer documentId={documentId}/> : <Page/>
      }

    </div>
  )
}