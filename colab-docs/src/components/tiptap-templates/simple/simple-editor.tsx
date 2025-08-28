import { useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, EditorContext, useEditor } from '@tiptap/react'
import { IndexeddbPersistence } from 'y-indexeddb'

// --- UI Primitives ---
import { Toolbar } from '@/components/tiptap-ui-primitive/toolbar'

// --- Tiptap Node ---
import '@/components/tiptap-node/blockquote-node/blockquote-node.scss'
import '@/components/tiptap-node/code-block-node/code-block-node.scss'
import '@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss'
import '@/components/tiptap-node/list-node/list-node.scss'
import '@/components/tiptap-node/image-node/image-node.scss'
import '@/components/tiptap-node/heading-node/heading-node.scss'
import '@/components/tiptap-node/paragraph-node/paragraph-node.scss'

// --- Styles ---
import '@/components/tiptap-templates/simple/simple-editor.scss'

// 协同编辑相关
import { HocuspocusProvider } from '@hocuspocus/provider'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCaret from '@tiptap/extension-collaboration-caret'
import { ws_server_url } from '@/utils/defaultConfig.ts'
import * as Y from 'yjs'
import { authUtils } from '@/api'
import { getCursorColorByUserId } from '@/utils/cursor_color.ts'
import { useEditorStore } from '@/stores/editorStore'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router'
import ExtensionKit from '@/extensions/extension-kit';

// 定义工具栏是否展示参数
interface SimpleEditorProps {
  showToolbar?: boolean;
}

// 协作用户类型
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
                              }: SimpleEditorProps) {
  const toolbarRef = useRef<HTMLDivElement>(null)
  // Hocuspocus Provider
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null)
  // 修改：为每个文档创建独立的 Y.Doc
  const [doc, setDoc] = useState<Y.Doc | null>(null)
  const providerRef = useRef<HocuspocusProvider | null>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [authToken] = useState<string>(authUtils.getAccessToken() as string)
  const [currentUser, setCurrentUser] = useState<CollaborationUser | null>(null)
  // @ts-ignore
  const [connectedUsers, setConnectedUsers] = useState<CollaborationUser[]>([])
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const [loading, setLoading] = useState(true)
  const setEditor = useEditorStore((state) => state.setEditor)
  const fileId = useEditorStore((state) => state.fileId)
  const navigate = useNavigate()
  const persistenceRef = useRef<IndexeddbPersistence | null>(null)
  const initRef = useRef(false)
  const hasUnsyncedChangesRef = useRef(false);
  // 记录上一个 fileId
  const lastFileIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!fileId || !doc || typeof window === 'undefined') return;

    const persistence = new IndexeddbPersistence(`tiptap-collaborative-${fileId}`, doc);
    const localStorageKey = `offline-edits-${fileId}`;

    persistence.on('synced', () => {

      if (localStorage.getItem(localStorageKey) === 'true') {
        hasUnsyncedChangesRef.current = true;
      }
    });

    const handleTransaction = () => {
      localStorage.setItem(localStorageKey, 'true');
      localStorage.setItem(`last-offline-edit-${fileId}`, new Date().toISOString());
      hasUnsyncedChangesRef.current = true;
    };

    persistence.on('afterTransaction', handleTransaction);
    doc.on('update', handleTransaction);

    return () => {
      persistence.destroy();
    };
  }, [fileId, doc]);

  // 从localStorage获取当前用户信息
  useEffect(() => {
    if (!authToken || !fileId) return

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
  }, [authToken, fileId])

  // 当 fileId 改变时，创建新的 Y.Doc
  useEffect(() => {
    if (!fileId || fileId === lastFileIdRef.current) return

    // 清理旧的文档和连接
    if (providerRef.current) {
      providerRef.current.destroy()
      providerRef.current = null
    }
    if (persistenceRef.current) {
      persistenceRef.current.destroy()
      persistenceRef.current = null
    }

    // 创建新的 Y.Doc
    const newDoc = new Y.Doc()
    setDoc(newDoc)
    lastFileIdRef.current = fileId
    initRef.current = false
    setLoading(true)
    setConnectionStatus('connecting')

    return () => {
      // 清理
      newDoc.destroy()
    }
  }, [fileId,doc])


  // 创建 HocuspocusProvider - 这是核心连接
  useEffect(() => {
    if (!authToken || !fileId || !doc || initRef.current) return

    // 标记已初始化
    initRef.current = true

    // 清理旧连接
    if (providerRef.current) {
      providerRef.current.destroy()
      providerRef.current = null
    }

    const hocuspocusProvider = new HocuspocusProvider({
      url: ws_server_url,
      name: fileId,
      document: doc,
      token: authToken,
      forceSyncInterval: 30000,

      onConnect: () => {
        console.log('WebSocket连接建立')
        setConnectionStatus('connecting')
      },

      onAuthenticated() {
        console.log('身份验证成功')
        setConnectionStatus('connected')
      },

      onAuthenticationFailed: () => {
        toast.error('身份验证失败，请重新登录')
        navigate('/')
        setConnectionStatus('error')
      },

      onSynced: ({ state }) => {
        console.log('文档同步完成', state)
        setConnectionStatus('connected')
        setLoading(false)

        toast.success('文档加载完成')
      },

      onDisconnect: () => {
        toast('与服务器断开连接', { icon: '⚠️' })
        setConnectionStatus('disconnected')
      },

      onDestroy: () => {
        console.log('Provider销毁')
        setConnectionStatus('disconnected')
      },
    })

    providerRef.current = hocuspocusProvider
    setProvider(hocuspocusProvider)

    return () => {
      initRef.current = false
      if (providerRef.current) {
        providerRef.current.destroy()
        providerRef.current = null
      }
    }
  }, [fileId,doc, authToken])

  // 用户感知信息
  useEffect(() => {
    if (provider?.awareness && currentUser) {
      provider.awareness.setLocalStateField('user', currentUser)
    }
  }, [provider, currentUser])

  // 协作用户管理
  useEffect(() => {
    if (!provider?.awareness) return
    console.log('协作用户管理')
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
    handleAwarenessUpdate() // 初始调用

    return () => {
      provider.awareness!.off('update', handleAwarenessUpdate)
    }
  }, [provider, currentUser])

  // 创建编辑器实例
  const editor = useEditor({
    editorProps: {
      attributes: {
        autocomplete: 'on',
        autocorrect: 'on',
        autocapitalize: 'off',
        'aria-label': 'Main content area, start typing to enter text.',
        class: 'simple-editor',
      },
    },
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    extensions: [
      ...ExtensionKit(),
      // 协同编辑扩展
      ...(doc ? [
        Collaboration.configure({
          document: doc,
          field: 'content'
        })
      ] : []),
      // 协同光标
      ...(provider && currentUser ? [
        CollaborationCaret.configure({
          provider,
          user: currentUser
        })
      ] : []),
    ],
    content: '', // 初始内容为空，由 Y.Doc 同步

    onCreate: ({ editor }) => {
      setIsEditorReady(true)
      // 聚焦编辑器
      setTimeout(() => {
        if (!editor.isDestroyed) {
          editor.commands.focus('end')
        }
      }, 100)
    },

    onSelectionUpdate: ({ editor }) => {
      // 延迟DOM操作，避免在渲染期间触发
      requestAnimationFrame(() => {
        const { from, to } = editor.state.selection
        const isAllSelected = from === 0 && to === editor.state.doc.content.size
        const editorElement = document.querySelector('.ProseMirror')

        if (editorElement) {
          editorElement.classList.toggle('is-all-selected', isAllSelected)
        }
      })
    },
  }) // 添加依赖

  // 将 editor 实例存入全局状态
  useEffect(() => {
    if (editor && isEditorReady) {
      setEditor(editor)
    }
  }, [editor, isEditorReady, setEditor])

  // 工具栏组件
  const ToolbarWithCursor = useMemo(() => {
    if (!showToolbar || !editor) return null

    return (
      <Toolbar
        ref={toolbarRef}
        className="tiptap-toolbar"
        style={{
          width: '100%',
          overflowX: 'auto',
        }}
      />
    )
  }, [showToolbar, editor])

  // 加载状态
  if (loading || connectionStatus === 'connecting') {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {connectionStatus === 'connecting' ? '正在连接服务器...' : '正在加载文档...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        {ToolbarWithCursor}

        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />
      </EditorContext.Provider>
    </div>
  )
}
