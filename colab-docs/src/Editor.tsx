import './editor.css'
import {
  SimpleEditor,
} from './components/tiptap-templates/simple/simple-editor'
import TableOfContents from './components/TableOfContents'
import { useState } from 'react'
import { Editor as TiptapEditor } from '@tiptap/react'

interface EditorProps {
  isTocVisible?: boolean; // 从外部传入目录可见性状态
  onEditorReady?: (editor: TiptapEditor) => void; // 将编辑器实例传递给父组件
  documentId?: string; // 新增：协作文档ID
}

export default function Editor ({
                                  isTocVisible = false,
                                  onEditorReady,
                                  documentId = 'example-doc', // 新增：默认文档ID
                                }: EditorProps) {
  const [editor, setEditor] = useState<TiptapEditor | null>(null)

  // 将编辑器实例传递给父组件
  const handleEditorReady = (editor: TiptapEditor) => {
    setEditor(editor)
    if (onEditorReady) {
      onEditorReady(editor)
    }
  }

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
            height: '100%',
            padding: '0', // 移除内联的左右内边距
          }}
        >
          <SimpleEditor
            onEditorReady={handleEditorReady}
            showToolbar={false} // 禁用编辑器内部的工具栏
            documentId={documentId} // 新增：传递协作文档ID
          />
        </div>
      </div>
    </div>
  )
}