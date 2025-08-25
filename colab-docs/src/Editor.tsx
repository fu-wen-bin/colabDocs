import './editor.css'
import {
  SimpleEditor,
} from './components/tiptap-templates/simple/simple-editor'
import TableOfContents from './components/TableOfContents'
import { useTipTap, useTocVisible } from '@/stores/editorStore.ts'


export default function Editor () {
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
          />
        </div>
      </div>
    </div>
  )
}