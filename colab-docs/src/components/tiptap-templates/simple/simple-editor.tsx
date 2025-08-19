import * as React from 'react'
import { Editor, EditorContent, EditorContext, useEditor } from '@tiptap/react'

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
import { Button } from '@/components/tiptap-ui-primitive/button'
import { Spacer } from '@/components/tiptap-ui-primitive/spacer'
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from '@/components/tiptap-ui-primitive/toolbar'

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

// --- Tiptap UI ---
import {
  HeadingDropdownMenu,
} from '@/components/tiptap-ui/heading-dropdown-menu'
import { ImageUploadButton } from '@/components/tiptap-ui/image-upload-button'
import { ListDropdownMenu } from '@/components/tiptap-ui/list-dropdown-menu'
import { BlockquoteButton } from '@/components/tiptap-ui/blockquote-button'
import { CodeBlockButton } from '@/components/tiptap-ui/code-block-button'
import {
  ColorHighlightPopover,
  ColorHighlightPopoverButton,
  ColorHighlightPopoverContent,
} from '@/components/tiptap-ui/color-highlight-popover'
import {
  LinkButton,
  LinkContent,
  LinkPopover,
} from '@/components/tiptap-ui/link-popover'
import { MarkButton } from '@/components/tiptap-ui/mark-button'
import { TextAlignButton } from '@/components/tiptap-ui/text-align-button'
import { UndoRedoButton } from '@/components/tiptap-ui/undo-redo-button'

// --- Icons ---
import { ArrowLeftIcon } from '@/components/tiptap-icons/arrow-left-icon'
import { HighlighterIcon } from '@/components/tiptap-icons/highlighter-icon'
import { LinkIcon } from '@/components/tiptap-icons/link-icon'

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

const MainToolbarContent = ({
                              onHighlighterClick,
                              onLinkClick,
                              isMobile,
                            }: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
}) => {
  return (
    <>
      <Spacer/>

      <ToolbarGroup>
        <UndoRedoButton action="undo"/>
        <UndoRedoButton action="redo"/>
      </ToolbarGroup>

      <ToolbarSeparator/>

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile}/>
        <ListDropdownMenu
          types={['bulletList', 'orderedList', 'taskList']}
          portal={isMobile}
        />
        <BlockquoteButton/>
        <CodeBlockButton/>
      </ToolbarGroup>

      <ToolbarSeparator/>

      <ToolbarGroup>
        <MarkButton type="bold"/>
        <MarkButton type="italic"/>
        <MarkButton type="strike"/>
        <MarkButton type="code"/>
        <MarkButton type="underline"/>
        {!isMobile ? (
          <ColorHighlightPopover/>
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick}/>
        )}
        {!isMobile ? <LinkPopover/> : <LinkButton onClick={onLinkClick}/>}
      </ToolbarGroup>

      <ToolbarSeparator/>

      <ToolbarGroup>
        <MarkButton type="superscript"/>
        <MarkButton type="subscript"/>
      </ToolbarGroup>

      <ToolbarSeparator/>

      <ToolbarGroup>
        <TextAlignButton align="left"/>
        <TextAlignButton align="center"/>
        <TextAlignButton align="right"/>
        <TextAlignButton align="justify"/>
      </ToolbarGroup>

      <ToolbarSeparator/>

      <ToolbarGroup>
        <ImageUploadButton text="Add"/>
      </ToolbarGroup>

      <Spacer/>

      {isMobile && <ToolbarSeparator/>}

    </>
  )
}

const MobileToolbarContent = ({
                                type,
                                onBack,
                              }: {
  type: 'highlighter' | 'link'
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon"/>
        {type === 'highlighter' ? (
          <HighlighterIcon className="tiptap-button-icon"/>
        ) : (
          <LinkIcon className="tiptap-button-icon"/>
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator/>

    {type === 'highlighter' ? (
      <ColorHighlightPopoverContent/>
    ) : (
      <LinkContent/>
    )}
  </>
)

// 修改接口定义，添加 documentId 属性
interface SimpleEditorProps {
  onEditorReady?: (editor: Editor) => void;
  showToolbar?: boolean;
  documentId?: string; // 新增：协作文档ID
}

export function SimpleEditor ({
  onEditorReady,
  showToolbar = true,
  documentId = 'default-doc', // 新增：默认文档ID
}: SimpleEditorProps) {
  const isMobile = useIsMobile()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = React.useState<
    'main' | 'highlighter' | 'link'
  >('main')
  const toolbarRef = React.useRef<HTMLDivElement>(null)

  // Hocuspocus Provider
  const [provider, setProvider] = React.useState<HocuspocusProvider | null>(null)
  React.useEffect(() => {
    const p = new HocuspocusProvider({
      url: 'ws://localhost:9999', // TODO: 与后端 ws_port 保持一致
      name: documentId,
      onOpen: () => console.log('[Hocuspocus] connected'),
      onClose: () => console.log('[Hocuspocus] disconnected'),
      onError: (e) => console.error('[Hocuspocus] error', e),
    })
    setProvider(p)
    return () => p.destroy()
  }, [documentId])

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        autocomplete: 'off',
        autocorrect: 'off',
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
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: 'image/*',
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error('Upload failed:', error),
      }),
      // 新增：协同编辑扩展（在 provider 就绪时启用）
      ...(provider ? [
        Collaboration.configure({
          document: provider.document,
        }),
        CollaborationCaret.configure({
          provider,
          user: {
            name: localStorage.getItem('username') || '用户',
            color: getRandomColor(),
          },
        }),
      ] : []),
    ],
    content: provider ? undefined : content,
  }, [provider])

  React.useEffect(() => {
    if (editor && onEditorReady) onEditorReady(editor)
  }, [editor, onEditorReady])

  // 将“光标可见性”逻辑移动到仅在 editor 存在时才渲染的子组件，避免未挂载时报错
  const ToolbarWithCursor = React.useMemo(() => {
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
                height - (useCursorVisibility({
                  editor,
                  overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
                }).y)
              }px)`,
            }
            : {}),
          width: '100%',
          overflowX: 'auto',
        }}
      >
        {mobileView === 'main' ? (
          <MainToolbarContent
            onHighlighterClick={() => setMobileView('highlighter')}
            onLinkClick={() => setMobileView('link')}
            isMobile={isMobile}
          />
        ) : (
          <MobileToolbarContent
            type={mobileView === 'highlighter' ? 'highlighter' : 'link'}
            onBack={() => setMobileView('main')}
          />
        )}
      </Toolbar>
    )
  }, [
    showToolbar,
    editor,
    isMobile,
    height,
    mobileView,
    toolbarRef,
    setMobileView])

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

// 新增：为协同光标提供随机颜色
function getRandomColor () {
  const colors = ['#958DF1','#F98181','#FBBC88','#FAF594','#70CFF8','#94FADB','#B9F18D']
  return colors[Math.floor(Math.random() * colors.length)]
}
