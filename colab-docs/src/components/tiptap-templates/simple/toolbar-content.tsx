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

// 导入zustand状态仓库
import { useTocVisible, useToggleToc, useConnectedUsers, useCurrentUser, useConnectionStatus } from '@/stores/editorStore.ts'
import { UserAvatar, type CollaborationUser } from '@/components/CollaborationUsers/UserAvatar'
export const MainToolbarContent = () => {

  // 获取编辑器实例和目录可见性状态
  const isTocVisible = useTocVisible()
  const onToggleToc = useToggleToc()


  const connectedUsers = useConnectedUsers()
  const currentUser = useCurrentUser()
  const connectionStatus = useConnectionStatus()



  // 合并所有用户（当前用户 + 连接用户）
  const allUsers = [
    ...connectedUsers,
    ...(currentUser && !connectedUsers.find((u: CollaborationUser) => u.id === currentUser.id) ? [currentUser] : []),
  ];

  return (
    <>
      {/* 添加目录按钮 */}
      <ToolbarGroup className="mr-2">
        <Button
          data-active={isTocVisible}
          onClick={()=>onToggleToc()}
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

      {/* 添加用户协作头像 */}
      {allUsers.length > 0 && (
        <>
          <Spacer/>
          <ToolbarSeparator/>
          <ToolbarGroup className="flex items-center space-x-2">
            {/* 连接状态指示器 */}
            <div className="flex items-center space-x-2 mr-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-green-500'
                    : connectionStatus === 'error'
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                }`}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400 hidden sm:inline">
                {allUsers.length}人在线
              </span>
            </div>


            <div className="flex items-center -space-x-1">
              {allUsers.slice(0, 5).map((user, index) => (
                <UserAvatar
                  key={user.id}
                  user={user}
                  currentUser={currentUser}
                  index={index}
                  total={allUsers.length}
                />
              ))}


              {allUsers.length > 5 && (
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300 shadow-sm ml-1">
                  +{allUsers.length - 5}
                </div>
              )}
            </div>
          </ToolbarGroup>
        </>
      )}

      <Spacer/>
    </>
  )
}
