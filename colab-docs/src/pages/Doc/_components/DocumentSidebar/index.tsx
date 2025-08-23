'use client'

import { useRef } from 'react'
import { useSidebar } from '@/stores/sidebarStore'
import { Card } from 'antd'

// 移除宽度相关props接口
function DocumentSidebar () {
  const { isOpen } = useSidebar()
  const sidebarRef = useRef<HTMLDivElement>(null)

  // 移除所有拖拽调整宽度相关代码

  if (!isOpen) {
    return null
  }

  return (
    <div
      ref={sidebarRef}
      className="rounded-r-2xl flex h-full relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800/90 dark:to-slate-900 shadow-2xl shadow-slate-200/30 dark:shadow-slate-900/50 backdrop-blur-xl z-10"
      style={{ width: '280px' }} // 固定宽度为280px
    >
      {/* 左侧内容区域 */}
      <div
        className="rounded-r-2xl flex-1 h-full overflow-hidden relative bg-gradient-to-br from-white/95 via-slate-50/60 to-white/95 dark:from-slate-800/95 dark:via-slate-800/70 dark:to-slate-800/95 backdrop-blur-lg before:absolute before:left-0 before:top-0 before:bottom-0 before:w-4 before:bg-gradient-to-r before:from-slate-900/5 before:to-transparent dark:before:from-slate-900/20 before:pointer-events-none">

        <Card
          className="h-full overflow-hidden rounded-r-2xl"
          style={{ width: '280px' }} // 固定宽度为280px
        >

          文件列表
        </Card>
      </div>

    </div>
  )
}

export default DocumentSidebar
