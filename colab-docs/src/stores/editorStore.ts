import { create } from 'zustand'
import { Editor as TiptapEditor } from '@tiptap/react'

interface EditorState {
  editor: TiptapEditor | null
  isTocVisible: boolean
  toggleToc: () => void
  setEditor: (editor: TiptapEditor) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  editor: null,
  isTocVisible: false,
  toggleToc: () => set((state) => ({ isTocVisible: !state.isTocVisible })),
  setEditor: (editor) => set({ editor: editor }),
}))

// 抛出钩子函数以便在组件中使用 -- 避免全局订阅带来的多余渲染问题
export const useTipTap = () => useEditorStore(state => state.editor)
export const useTocVisible = () => useEditorStore(state => state.isTocVisible)
export const useToggleToc = () => useEditorStore(state => state.toggleToc)
export const useSetEditor = () => useEditorStore(state => state.setEditor)

