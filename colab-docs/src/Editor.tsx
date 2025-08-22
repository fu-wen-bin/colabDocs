import './editor.css'
import {
  SimpleEditor,
} from './components/tiptap-templates/simple/simple-editor'
import TableOfContents from './components/TableOfContents'
import { Editor as TiptapEditor } from '@tiptap/react'
import { useTipTap, useTocVisible } from '@/stores/editorStore.ts'

interface EditorProps {
  onEditorReady?: (editor: TiptapEditor) => void; // 将编辑器实例传递给父组件
  documentId?: string; // 协作文档ID
}

export default function Editor ({
                                  documentId = 'example-doc', // 默认文档ID
                                }: EditorProps) {
  const editor = useTipTap()
  const isTocVisible = useTocVisible()

  return (
    <div className="flex h-full w-full relative">
      {/* 左侧目录栏 */}
      <div
        className={`toc-sidebar h-full overflow-y-auto border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 transition-all duration-300 ${
          isTocVisible ? 'w-64' : 'w-0'
        }`}
      >
        {isTocVisible && <TableOfContents editor={editor}/>}
      </div>

      {/* 编辑器区域 */}
      <div className="flex-1 overflow-x-auto">
        <div
          className="editor-container"
          style={{
            maxWidth: '100%',
            width: '100%',
            margin: '0 auto',
            height: 'auto', // 原为 '100%'，避免强制占满阻碍自然滚动
            padding: '0',
          }}
        >
          <SimpleEditor
            showToolbar={false} // 禁用编辑器内部的工具栏
            documentId={documentId} // 新增：传递协作文档ID
          />
        </div>
      </div>
    </div>
  )
}