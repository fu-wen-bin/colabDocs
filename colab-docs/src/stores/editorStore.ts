import { create } from 'zustand'
import { Editor as TiptapEditor } from '@tiptap/react'
import type { JSONContent } from '@tiptap/core'

interface EditorState {
  editor: TiptapEditor | null
  fileId: string | null
  isTocVisible: boolean
  initialContent: JSONContent
  toggleToc: () => void
  setEditor: (editor: TiptapEditor) => void
  setFileId: (fileId: string | null) => void
  setInitialContent: (content: JSONContent) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  editor: null,
  fileId: null,
  isTocVisible: false,
  initialContent: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [] }],
  },
  setFileId: (fileId) => set({ fileId: fileId }),
  toggleToc: () => set((state) => ({ isTocVisible: !state.isTocVisible })),
  setEditor: (editor) => set({ editor: editor }),
  setInitialContent: (content) => set({ initialContent: content }),
}))

// 抛出钩子函数以便在组件中使用 -- 避免全局订阅带来的多余渲染问题
export const useTipTap = () => useEditorStore(state => state.editor)
export const useTocVisible = () => useEditorStore(state => state.isTocVisible)
export const useToggleToc = () => useEditorStore(state => state.toggleToc)

