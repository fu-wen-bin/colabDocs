import { Editor } from '@tiptap/react'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'

// --- UI Primitives ---
import { Button } from '@/components/tiptap-ui-primitive/button'
import { Spacer } from '@/components/tiptap-ui-primitive/spacer'
import {
  ToolbarGroup,
  ToolbarSeparator,
} from '@/components/tiptap-ui-primitive/toolbar'

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
} from '@/components/tiptap-ui/color-highlight-popover'
import {  LinkPopover } from '@/components/tiptap-ui/link-popover'
import { MarkButton } from '@/components/tiptap-ui/mark-button'
import { TextAlignButton } from '@/components/tiptap-ui/text-align-button'
import { UndoRedoButton } from '@/components/tiptap-ui/undo-redo-button'

interface ToolbarContentProps {
  editor: Editor | null;
  isTocVisible?: boolean; // 添加目录可见性状态
  onToggleToc?: () => void; // 添加切换目录的回调函数
}

export const MainToolbarContent = ({
                                     editor,
                                     isTocVisible = false, // 默认目录不可见
                                     onToggleToc = () => {}, // 默认空函数
                                   }: ToolbarContentProps) => {
  if (!editor) return null

  return (
    <>
      {/* 添加目录按钮 */}
      <ToolbarGroup className="mr-2">
        <Button
          data-active={isTocVisible}
          onClick={onToggleToc}
        >
          {isTocVisible ? <MenuFoldOutlined/> : <MenuUnfoldOutlined/>}
        </Button>
      </ToolbarGroup>

      <ToolbarSeparator/>

      <Spacer/>

      <ToolbarGroup>
        <UndoRedoButton action="undo"/>
        <UndoRedoButton action="redo"/>
      </ToolbarGroup>

      <ToolbarSeparator/>

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]}/>
        <ListDropdownMenu
          types={['bulletList', 'orderedList', 'taskList']}
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
        <ColorHighlightPopover/>
        <LinkPopover/>
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
    </>
  )
}


