import Editor from '@/Editor'
import { Card } from 'antd'
import { EditorContext } from '@tiptap/react'
import { Toolbar } from '@/components/tiptap-ui-primitive/toolbar'
import {
  MainToolbarContent,
} from '@/components/tiptap-templates/simple/toolbar-content'
import { useTipTap } from '@/stores/editorStore.ts'
import { useRef } from 'react'

export default function MainContainer ({documentId}: { documentId?: string }) {
  const editor = useTipTap()
  const mainRef = useRef<HTMLDivElement>(null)
  return (
    <main
      ref={mainRef}
      className="flex-1 flex flex-col bg-white dark:bg-slate-900 relative min-w-0 overflow-auto"
      data-side-shadow="left" // 添加属性用于CSS选择器
    >
      <div
        className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
      >
        <EditorContext.Provider value={{ editor }}>
          <Toolbar
            className="tiptap-toolbar fixed-toolbar pointer-events-auto">
            {editor && (
              <MainToolbarContent/>
            )}
          </Toolbar>
        </EditorContext.Provider>
      </div>

      {/* 正文容器：为工具栏预留空间，避免"上移/遮挡" */}
      <div className="w-full flex-1 ">
        <Card
          className="overflow-hidden h-full rounded-2xl"
          style={{ overflow: 'visible' }} // 可选：避免裁切内部滚动
        >
          <Editor
            documentId={documentId}
          />
        </Card>
      </div>
    </main>
  )
}