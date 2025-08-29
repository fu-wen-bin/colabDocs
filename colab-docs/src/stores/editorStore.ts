import { create } from 'zustand'
import { Editor as TiptapEditor } from '@tiptap/react'
import type { JSONContent } from '@tiptap/core'
import type { CollaborationUser } from '@/pages/Doc/type'

// @ts-ignore
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

export interface EditorStore {
  editor: TiptapEditor | null
  fileId: string | null
  isTocVisible: boolean
  initialContent: JSONContent
  provider: any | null
  connectedUsers: CollaborationUser[]
  currentUser: CollaborationUser | null
  connectionStatus: string
  toggleToc: () => void
  setEditor: (editor: TiptapEditor) => void
  setFileId: (fileId: string | null) => void
  setInitialContent: (content: JSONContent) => void
  setProvider: (provider: any) => void
  setConnectedUsers: (users: CollaborationUser[]) => void
  setCurrentUser: (user: CollaborationUser | null) => void
  setConnectionStatus: (status: string) => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  editor: null,
  fileId: null,
  isTocVisible: false,
  initialContent: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [] }],
  },
  provider: null,
  connectedUsers: [],
  currentUser: null,
  connectionStatus: 'disconnected',
  setFileId: (fileId) => set({ fileId: fileId }),
  toggleToc: () => set((state) => ({ isTocVisible: !state.isTocVisible })),
  setEditor: (editor) => set({ editor: editor }),
  setInitialContent: (content) => set({ initialContent: content }),
  setProvider: (provider) => set({ provider }),
  setConnectedUsers: (users) => set({ connectedUsers: users }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
}))

// 抛出钩子函数以便在组件中使用 -- 避免全局订阅带来的多余渲染问题
export const useTipTap = () => useEditorStore((state) => state.editor)
export const useTocVisible = () => useEditorStore((state) => state.isTocVisible)
export const useToggleToc = () => useEditorStore((state) => state.toggleToc)
// 导出协同编辑状态
export const useProvider = () => useEditorStore((state) => state.provider)
export const useConnectedUsers = () => useEditorStore((state) => state.connectedUsers)
export const useCurrentUser = () => useEditorStore((state) => state.currentUser)
export const useConnectionStatus = () => useEditorStore((state) => state.connectionStatus)
