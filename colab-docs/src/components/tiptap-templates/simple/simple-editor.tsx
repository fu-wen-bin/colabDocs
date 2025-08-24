import { useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, EditorContext, useEditor } from '@tiptap/react'
import { IndexeddbPersistence } from 'y-indexeddb'

// --- Tiptap Core Extensions ---
import { StarterKit } from '@tiptap/starter-kit'
import { Image } from '@tiptap/extension-image'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { TextAlign } from '@tiptap/extension-text-align'
import { Typography } from '@tiptap/extension-typography'
import { Highlight } from '@tiptap/extension-highlight'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { Selection } from '@tiptap/extensions'

// --- UI Primitives ---
import { Toolbar } from '@/components/tiptap-ui-primitive/toolbar'

// --- Tiptap Node ---
import {
  ImageUploadNode,
} from '@/components/tiptap-node/image-upload-node/image-upload-node-extension'
import {
  HorizontalRule,
} from '@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension'
import '@/components/tiptap-node/blockquote-node/blockquote-node.scss'
import '@/components/tiptap-node/code-block-node/code-block-node.scss'
import '@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss'
import '@/components/tiptap-node/list-node/list-node.scss'
import '@/components/tiptap-node/image-node/image-node.scss'
import '@/components/tiptap-node/heading-node/heading-node.scss'
import '@/components/tiptap-node/paragraph-node/paragraph-node.scss'

// --- Hooks ---
import { useIsMobile } from '@/hooks/use-mobile'
import { useWindowSize } from '@/hooks/use-window-size'
import { useCursorVisibility } from '@/hooks/use-cursor-visibility'

// --- Components ---
// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from '@/lib/tiptap-utils'

// --- Styles ---
import '@/components/tiptap-templates/simple/simple-editor.scss'

import content from '@/components/tiptap-templates/simple/data/content.json'

// 协同编辑相关
import { HocuspocusProvider } from '@hocuspocus/provider'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCaret from '@tiptap/extension-collaboration-caret'
import { ws_server_url } from '@/lib/defaultConfig.ts'
import * as Y from 'yjs'
import axios,{ authUtils } from '@/api'
import { getCursorColorByUserId } from '@/lib/cursor_color.ts'
import { useEditorStore } from '@/stores/editorStore'
import { useSearchParams } from 'react-router'

// 修改接口定义，添加 documentId 属性
interface SimpleEditorProps {
  showToolbar?: boolean;
  documentId?: string; // 新增：协作文档ID
}

interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  avatar: string;
}

type ConnectionStatus =
  'connecting'
  | 'connected'
  | 'disconnected'
  | 'syncing'
  | 'error';

export function SimpleEditor ({
                                showToolbar = true,
                                documentId = 'default-doc', // 新增：默认文档ID
                              }: SimpleEditorProps) {
  const isMobile = useIsMobile()
  const { height } = useWindowSize()
  const toolbarRef = useRef<HTMLDivElement>(null)
  // Hocuspocus Provider
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null)
  const [doc, setDoc] = useState<Y.Doc | null>(null)
  const providerRef = useRef<HocuspocusProvider | null>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [authToken, setAuthToken] = useState<string>('')
  const [currentUser, setCurrentUser] = useState<CollaborationUser | null>(null)
  const [connectedUsers, setConnectedUsers] = useState<CollaborationUser[]>([])
  const [isClientReady, setIsClientReady] = useState(false)
  const setEditor = useEditorStore((state) => state.setEditor)
  const [isServerSynced, setIsServerSynced] = useState(false)
  const hasUnsyncedChangesRef = useRef(false)
  const [isLocalLoaded, setIsLocalLoaded] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    'connecting')
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams()

  // 创建Y.Doc
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDoc(new Y.Doc())
      setAuthToken(authUtils.getAccessToken() as string)
      setIsClientReady(true)
    }
  }, [])

  // 获取对应id文件的内容
  const getDocumentContent = async () => {
    const fileId = searchParams.get('fileId')
    try {
      setLoading(true);
      const result = await axios.post('/doc/getContent', {fileId})

    } catch {

    }
  }

  // 从localStorage获取当前用户信息
  useEffect(() => {
    if (!authToken || !documentId || documentId === '') return

    try {
      const userProfileStr = authUtils.getUser()
      if (userProfileStr) {
        setCurrentUser({
          id: userProfileStr.id.toString(),
          name: userProfileStr.name,
          color: getCursorColorByUserId(userProfileStr.id.toString()),
          avatar: userProfileStr.avatar_url,
        })
      }

    } catch (error) {
      console.error('解析用户信息失败:', error)
    }
  }, [authToken, documentId])

  // 本地持久化 - IndexedDB 只在浏览器中可用
  useEffect(() => {
    if (!documentId || !doc || typeof window === 'undefined') return

    const persistence = new IndexeddbPersistence(
      `tiptap-collaborative-${documentId}`, doc)
    const localStorageKey = `offline-edits-${documentId}`

    persistence.on('synced', () => {
      setIsLocalLoaded(true)

      if (localStorage.getItem(localStorageKey) === 'true') {
        hasUnsyncedChangesRef.current = true
      }
    })

    const handleTransaction = () => {
      localStorage.setItem(localStorageKey, 'true')
      localStorage.setItem(`last-offline-edit-${documentId}`,
        new Date().toISOString())
      hasUnsyncedChangesRef.current = true
    }

    persistence.on('afterTransaction', handleTransaction)
    doc.on('update', handleTransaction)

    return () => {
      persistence.destroy()
    }
  }, [documentId, doc])

  // 确保编辑器和服务器准备就绪
  useEffect(() => {

    if (!authToken || !documentId || !doc || !isEditorReady) return

    // 如果已经有连接且参数相同，不重复创建
    if (providerRef.current && providerRef.current.configuration.name ===
        documentId) {
      return
    }

    // 清理旧连接
    if (providerRef.current) {
      providerRef.current.destroy()
      providerRef.current = null
    }
    // 额外延迟，确保编辑器完全稳定后再建立WebSocket连接
    const connectionTimer = setTimeout(() => {
      const clearOfflineEdits = () => {
        hasUnsyncedChangesRef.current = false
        localStorage.removeItem(`offline-edits-${documentId}`)
      }
      const hocuspocusProvider = new HocuspocusProvider({
        url: ws_server_url, // TODO: 与后端 ws_port 保持一致
        name: documentId,
        document: doc,
        token: authToken,
        onConnect: () => {
          console.log('[Hocuspocus] connected')
          setConnectionStatus('syncing')
          //getDocumentContent()
        },
        onDisconnect: () => {
          console.log('[Hocuspocus] disconnected')
          setConnectionStatus('disconnected')
          setIsServerSynced(false)
        },
        onDestroy: () => {
          setConnectionStatus('disconnected')
          setIsServerSynced(false)
        },
        onAuthenticationFailed: (data) => {
          console.error('协作服务器认证失败:', data)
          setConnectionStatus('error')
        },
        onSynced: () => {
          setConnectionStatus('connected')
          setIsServerSynced(true)
          clearOfflineEdits()
        },
      })
      providerRef.current = hocuspocusProvider
      setProvider(hocuspocusProvider)
    }, 300) // 300ms延迟，确保编辑器完全稳定
    return () => {
      clearTimeout(connectionTimer)

      // 只在组件卸载时清理
      if (providerRef.current) {
        if (providerRef.current.awareness) {
          providerRef.current.awareness.setLocalStateField('user', null)
        }

        providerRef.current.destroy()
        providerRef.current = null
      }
    }
  }, [documentId, isEditorReady])

  // 设置用户awareness信息
  useEffect(() => {
    if (provider?.awareness && currentUser) {
      provider.awareness.setLocalStateField('user', currentUser)
    }
  }, [provider, currentUser])

  // 协作用户管理
  useEffect(() => {
    if (!provider?.awareness) return

    const handleAwarenessUpdate = () => {
      const states = provider.awareness!.getStates()
      const users: CollaborationUser[] = []

      states.forEach((state, clientId) => {
        if (state?.user) {
          const userData = state.user
          const userId = userData.id || clientId.toString()

          if (currentUser && userId !== currentUser.id) {
            users.push({
              id: userId,
              name: userData.name,
              color: getCursorColorByUserId(userId),
              avatar: userData.avatar,
            })
          }
        }
      })

      setConnectedUsers(users)
    }

    provider.awareness.on('update', handleAwarenessUpdate)

    return () => provider.awareness?.off('update', handleAwarenessUpdate)
  }, [provider, currentUser])

  // 设置编辑器准备就绪状态
  const editor = useEditor({
    autofocus: true,
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        autocomplete: 'on',
        autocorrect: 'on',
        autocapitalize: 'off',
        'aria-label': 'Main content area, start typing to enter text.',
        class: 'simple-editor',
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: { openOnClick: false, enableClickSelection: true },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image.configure({
        allowBase64: true,
      }),
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: 'image/*',
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error('上传出错：', error),
      }),
      // 新增：协同编辑扩展（在 provider 就绪时启用）
      ...(doc
        ? [Collaboration.configure({ document: doc, field: 'content' })]
        : []),
      ...(provider && currentUser && doc
        ? [CollaborationCaret.configure({ provider, user: currentUser })] : []),
    ],
    content: provider ? undefined : content,
    onSelectionUpdate: ({ editor }) => {
      // 延迟DOM操作，避免在渲染期间触发
      requestAnimationFrame(() => {
        const { from, to } = editor.state.selection
        const isAllSelected = from === 0 && to ===
                              editor.state.doc.content.size
        const editorElement = document.querySelector('.ProseMirror')

        if (editorElement) {
          editorElement.classList.toggle('is-all-selected', isAllSelected)
        }
      })
    },
    onCreate: () => {
      // 编辑器创建成功后延迟设置就绪状态
      setTimeout(() => {
        setIsEditorReady(true)
      }, 500) // 增加延迟，确保编辑器完全就绪
    },
    onUpdate: () => {
      // 防止在更新期间的意外状态变更
    },
  }, [provider, doc, currentUser]) // 依赖 provider 和 doc，确保协作扩展正确初始化

  useEffect(() => {
    if (editor) {
      setEditor(editor)
    }
  }, [editor])

  // 设置初始内容
  // useEffect(() => {
  //   if (!editor || !initialContent || !isLocalLoaded) return;
  //
  //   if (editor && !editor.isDestroyed) {
  //     // 使用 setTimeout 避免在渲染期间同步设置内容
  //     setTimeout(() => {
  //       if (editor && !editor.isDestroyed) {
  //         editor.commands.setContent(initialContent);
  //       }
  //     }, 0);
  //   }
  // }, [editor, initialContent, isLocalLoaded]);

  // 将“光标可见性”逻辑移动到仅在 editor 存在时才渲染的子组件，避免未挂载时报错
  const ToolbarWithCursor = useMemo(() => {
      if (!showToolbar) return null
      if (!editor) return null
      return (
        <Toolbar
          ref={toolbarRef}
          className="tiptap-toolbar"
          style={{
            ...(isMobile
              ? {
                bottom: `calc(100% - ${
                  height - (useCursorVisibility(
                    {
                      editor,
                      overlayHeight: toolbarRef.current?.getBoundingClientRect().height ??
                                     0,
                    }).y)
                }px)`,
              }
              : {}),
            width: '100%',
            overflowX: 'auto',
          }}
        >
        </Toolbar>
      )
    }, [showToolbar, editor, isMobile, height, toolbarRef],
  )
  console.log(provider, 'provider')
  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        {ToolbarWithCursor /* 仅在 editor 存在时渲染，内部才调用 useCursorVisibility */}

        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />
      </EditorContext.Provider>
    </div>
  )
}

