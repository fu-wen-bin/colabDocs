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
import toast from 'react-hot-toast'

// 定义工具栏是否展示参数
interface SimpleEditorProps {
  showToolbar?: boolean;
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
  // @ts-ignore
  const [connectedUsers, setConnectedUsers] = useState<CollaborationUser[]>([])
  // @ts-ignore
  const [isClientReady, setIsClientReady] = useState(false)
  // @ts-ignore
  const [isServerSynced, setIsServerSynced] = useState(false)
  const hasUnsyncedChangesRef = useRef(false)
  // @ts-ignore
  const [isLocalLoaded, setIsLocalLoaded] = useState(false)
  // @ts-ignore
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    'connecting')
  // @ts-ignore
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams()
  const setEditor = useEditorStore((state) => state.setEditor)
  const  fileId  = useEditorStore((state) => state.fileId)
  const  setFileId  = useEditorStore((state) => state.setFileId)
  const  initialContent  = useEditorStore((state) => state.initialContent)
  const  setInitialContent  = useEditorStore((state) => state.setInitialContent)


  setFileId(searchParams.get('fileId'))
  console.log('fileId', fileId)
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
    try {
      setLoading(true);
      const result = await axios.post('/doc/getContent', {fileId})
      console.log('获取到的文档内容:', result.data) // 调试日志
      if(result.data.code === '1' && result.data.content){  // 修改：检查 code 而不是 success
        // 将字符串内容解析为 JSON
        const content = typeof result.data.content === 'string'
          ? JSON.parse(result.data.content)
          : result.data.content;
        console.log('解析后的内容:', content) // 调试日志
        setInitialContent(content);

        // 如果编辑器已经准备好，立即设置内容
        if (editor && !editor.isDestroyed) {
          editor.commands.setContent(content);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('获取文档内容失败:', error)
      toast.error('获取文档内容失败')
      setLoading(false);
    }
  }

  // 从localStorage获取当前用户信息
  useEffect(() => {
    if (!authToken || !fileId || fileId === '') return

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

  // 本地持久化 - IndexedDB 只在浏览器中可用
  useEffect(() => {
    if (!fileId || !doc || typeof window === 'undefined') return

    const persistence = new IndexeddbPersistence(
      `tiptap-collaborative-${fileId}`, doc)
    const localStorageKey = `offline-edits-${fileId}`

    persistence.on('synced', () => {
      setIsLocalLoaded(true)

      if (localStorage.getItem(localStorageKey) === 'true') {
        hasUnsyncedChangesRef.current = true
      }
    })

    const handleTransaction = () => {
      localStorage.setItem(localStorageKey, 'true')
      localStorage.setItem(`last-offline-edit-${fileId}`,
        new Date().toISOString())
      hasUnsyncedChangesRef.current = true
    }

    persistence.on('afterTransaction', handleTransaction)
    doc.on('update', handleTransaction)

    return () => {
      persistence.destroy()
    }
  }, [fileId, doc])

  // 修改：当 fileId 变化时立即获取内容
  useEffect(() => {
    if (fileId && authToken) {
      getDocumentContent();
    }
  }, [fileId, authToken]);

  // 确保编辑器和服务器准备就绪
  useEffect(() => {
    if (!authToken || !fileId || !doc || !isEditorReady) return

    // 如果已经有连接且参数相同，不重复创建
    if (providerRef.current && providerRef.current.configuration.name ===
        fileId) {
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
        localStorage.removeItem(`offline-edits-${fileId}`)
      }
      const hocuspocusProvider = new HocuspocusProvider({
        url: ws_server_url, // TODO: 与后端 ws_port 保持一致
        name: fileId,
        document: doc,
        token: authToken,

        onConnect: () => {
          console.log('[Hocuspocus] connected')
          setConnectionStatus('syncing')
          // 移除这里的 getDocumentContent() 调用，避免重复获取
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
    }, 300)
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
  }, [fileId, isEditorReady, authToken, doc]) // 添加必要的依赖

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

  console.log(initialContent, 'initialContent')
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
    content: '', // 初始内容为空
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
  }, [provider, doc, currentUser]) //

  // 将 editor 实例存入全局状态
  useEffect(() => {
    if (editor) {
      setEditor(editor)
    }
  }, [editor])

  // 修改内容设置逻辑
  useEffect(() => {
    if (editor && !editor.isDestroyed && initialContent && initialContent.content) {
      // 使用 requestAnimationFrame 确保在下一帧设置内容
      requestAnimationFrame(() => {
        if (editor && !editor.isDestroyed) {
          console.log('设置编辑器内容:', initialContent)
          editor.commands.setContent(initialContent);
        }
      });
    }
  }, [editor, initialContent]); // 移除 isLocalLoaded 依赖

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
