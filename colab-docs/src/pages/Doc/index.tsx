import { Suspense, useRef, useState } from 'react'
import DocumentSidebar from './_components/DocumentSidebar'
import Editor from '@/Editor'
import { Card } from 'antd'
import { Editor as TiptapEditor, EditorContext } from '@tiptap/react'
import { Toolbar } from '@/components/tiptap-ui-primitive/toolbar'
import {
  MainToolbarContent,
} from '@/components/tiptap-templates/simple/toolbar-content'

// 优化的加载组件 - 与 TabSidebar 保持一致的样式
function SidebarSkeleton () {
  return (
    <div
      className="flex h-full relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800/90 dark:to-slate-900 shadow-2xl shadow-slate-200/30 dark:shadow-slate-900/50 backdrop-blur-xl"
      style={{ width: '280px' }} // 固定宽度为280px
    >
      {/* 左侧图标栏骨架 */}
      <div
        className="w-16 relative bg-gradient-to-b from-white/90 via-white/70 to-white/90 dark:from-slate-800/90 dark:via-slate-800/70 dark:to-slate-800/90 backdrop-blur-lg flex flex-col items-center py-4 after:absolute after:right-0 after:top-4 after:bottom-4 after:w-px after:bg-gradient-to-b after:from-transparent after:via-slate-200/50 after:to-transparent dark:after:via-slate-600/30">
        {/* Logo骨架 */}
        <div
          className="w-10 h-10 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-2xl animate-pulse mb-6"/>

        {/* 按钮骨架 */}
        <div className="space-y-2 flex-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-12 h-12 bg-white/60 dark:bg-slate-700/60 rounded-2xl animate-pulse backdrop-blur-md border border-slate-200/50 dark:border-slate-600/50"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>

        {/* 底部按钮骨架 */}
        <div
          className="w-12 h-12 bg-white/60 dark:bg-slate-700/60 rounded-2xl animate-pulse backdrop-blur-md border border-slate-200/50 dark:border-slate-600/50"/>
      </div>

      {/* 右侧内容区骨架 */}
      <div
        className="flex-1 overflow-hidden relative bg-gradient-to-br from-white/95 via-slate-50/60 to-white/95 dark:from-slate-800/95 dark:via-slate-800/70 dark:to-slate-800/95 backdrop-blur-lg before:absolute before:left-0 before:top-0 before:bottom-0 before:w-4 before:bg-gradient-to-r before:from-slate-900/5 before:to-transparent dark:before:from-slate-900/20 before:pointer-events-none">
        <div className="h-full overflow-hidden flex flex-col">
          {/* 标题栏骨架 */}
          <header
            className="flex items-center justify-between px-5 py-4 relative bg-gradient-to-r from-white/95 via-slate-50/80 to-white/95 dark:from-slate-800/95 dark:via-slate-700/80 dark:to-slate-800/95 backdrop-blur-xl after:absolute after:bottom-0 after:left-4 after:right-4 after:h-px after:bg-gradient-to-r after:from-transparent after:via-slate-200/60 after:to-transparent dark:after:via-slate-600/40">
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-xl animate-pulse"/>
              <div
                className="h-4 w-16 bg-slate-200/60 dark:bg-slate-600/60 rounded-md animate-pulse"/>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className="h-3 w-10 bg-slate-200/60 dark:bg-slate-600/60 rounded animate-pulse"/>
              <div
                className="w-8 h-8 bg-white/60 dark:bg-slate-700/60 rounded-xl animate-pulse"/>
            </div>
          </header>

          {/* 内容区骨架 */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            <div
              className="h-6 bg-slate-200/60 dark:bg-slate-600/60 rounded-lg animate-pulse w-3/4"/>
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-5 bg-slate-200/60 dark:bg-slate-600/60 rounded-md animate-pulse"
                  style={{
                    width: `${60 + ((i * 7) % 30)}%`,
                    animationDelay: `${i * 150}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 整体右侧柔和阴影 */}
      <div
        className="absolute -right-4 top-0 bottom-0 w-4 pointer-events-none bg-gradient-to-r from-slate-900/10 to-transparent dark:from-slate-900/30"/>
    </div>
  )
}

export default function Doc () {
  const mainRef = useRef<HTMLDivElement>(null)
  const [editor, setEditor] = useState<TiptapEditor | null>(null)
  const [isTocVisible, setIsTocVisible] = useState(false)
  const documentId = 'example-doc'

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900 overflow-hidden">
      {/* 侧边栏区域 - 固定宽度设计 */}
      <Suspense fallback={<SidebarSkeleton/>}>
        <DocumentSidebar/>
      </Suspense>

      {/* 主内容区域 */}
      <main
        ref={mainRef}
        className="flex-1 flex flex-col bg-white dark:bg-slate-900 relative min-w-0 overflow-hidden">
        {/* 顶部工具栏（保持不变，已注入 EditorContext） */}
        <div
          className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
          {/* 将顶部工具栏放入 EditorContext，提供 editor 实例 */}
          <EditorContext.Provider value={{ editor }}>
            <Toolbar
              className="tiptap-toolbar fixed-toolbar pointer-events-auto">
              {editor && (
                <MainToolbarContent
                  editor={editor}
                  isTocVisible={isTocVisible}
                  onToggleToc={() => setIsTocVisible(!isTocVisible)}
                />
              )}
            </Toolbar>
          </EditorContext.Provider>
        </div>

        {/* 左侧柔和分隔阴影 */}
        <div
          className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-900/5 to-transparent dark:from-slate-900/20 pointer-events-none z-10"/>

        <div className="w-full h-full flex-1">
          <Card
            className="h-full overflow-hidden rounded-2xl"
          >
            <Editor
              isTocVisible={isTocVisible}
              onEditorReady={setEditor}
              documentId={documentId}
            />
          </Card>
        </div>
      </main>
    </div>
  )
}