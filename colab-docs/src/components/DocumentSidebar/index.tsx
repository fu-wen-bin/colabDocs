'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/utils/utils.ts'
import { Icon } from '@/components/Icon.tsx'
import { useNavigate } from 'react-router'
import FileTree from '@/components/DocumentSidebar/components/FileTree.tsx'
import { useFileOperations } from '@/components/DocumentSidebar/hooks/useFileOperations.ts'
import type { FileItem } from '@/pages/Doc/type.ts'
import axios from '@/api'
import SharedDocuments from './components/SharedDocuments'
//import SharedDocuments from '@/components/DocumentSidebar/components/SharedDocuments.tsx'



function DocumentSidebar() {
  const navigate = useNavigate()
  const [files, setFiles] = useState<FileItem[]>([])
  const [sharedFiles, setSharedFiles] = useState<FileItem[]>([])
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [showNewItemInput, setShowNewItemInput] = useState(false) // 是否显示新建文件输入框
  const [newItemName, setNewItemName] = useState<string>('')
  const [isRenaming, setIsRenaming] = useState<string | null>(null)

  // 获取文件列表
  const fetchOwnFiles = useCallback(async () => {
    try {
      const response = await axios.post('/doc/getList')
      if (response.data?.code === '1') {
        // 将后端返回的数据转换为前端需要的格式
        const ownFileList = response.data.data.map((doc: any) => ({
          id: doc.id,
          name: doc.doc_name,
          type: 'file' as const,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
        }))
        setFiles(ownFileList)
        const sharedFileList = response.data.dataS.map((doc: any) => ({
          id: doc.id,
          name: doc.doc_name,
          type: 'file' as const,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
        }))
        setSharedFiles(sharedFileList)
      }
    } catch (error) {
      console.error('获取文件列表失败:', error)
    }
  }, [])

  // 初始化时加载文件列表
  useEffect(() => {
    fetchOwnFiles()
  }, [fetchOwnFiles])

  // 文件操作钩子
  const fileOperations = useFileOperations(fetchOwnFiles)

  // 返回首页
  const backHome = () => {
    navigate('/')
  }

  // 刷新文件列表
  const refreshFiles = () => {
    fetchOwnFiles()
  }

  // 开始创建新文件
  const startCreateNewFile = useCallback(() => {
    setShowNewItemInput(true)
    setNewItemName('新文件')
  }, [])

  // 完成创建新文件
  const finishCreateNewItem = useCallback(async () => {
    if (newItemName.trim()) {
      const success = await fileOperations.handleCreate(newItemName)
      if (success) {
        setShowNewItemInput(false)
        setNewItemName('')
      }
    }
  }, [newItemName, fileOperations])

  // 取消创建新文件
  const cancelCreateNewItem = useCallback(() => {
    setShowNewItemInput(false)
    setNewItemName('')
  }, [])

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (showNewItemInput) {
          finishCreateNewItem()
        } else if (isRenaming) {
          // 重命名确认在 onBlur 中处理
        }
      } else if (e.key === 'Escape') {
        if (showNewItemInput) {
          cancelCreateNewItem()
        } else if (isRenaming) {
          setIsRenaming(null)
        }
      }
    },
    [showNewItemInput, isRenaming, finishCreateNewItem, cancelCreateNewItem],
  )

  // 处理分享
  const handleShare = useCallback((file: FileItem) => {
    fileOperations.handleShare(file)
  }, [fileOperations])

  // 处理重命名
  const handleRename = useCallback((file: FileItem) => {
    setIsRenaming(file.id)
  }, [])

  // 完成重命名
  const finishRenaming = useCallback(
    async (newName: string) => {
      if (isRenaming && newName.trim()) {
        await fileOperations.handleRename(isRenaming, newName)
      }
      setIsRenaming(null)
    },
    [isRenaming, fileOperations],
  )

  return (
    <div
      ref={sidebarRef}
      className="transition-all duration-300 rounded-r-2xl flex h-full relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800/90 dark:to-slate-900 shadow-2xl shadow-slate-200/30 dark:shadow-slate-900/50 backdrop-blur-xl z-10"
      style={{ width: '280px' }}
    >
      <div
        style={{ width: '280px' }}
        className="transition-all duration-300 border-r-1 rounded-r-2xl flex-1 h-full overflow-hidden relative bg-gradient-to-br from-white/95 via-slate-50/60 to-white/95 dark:from-slate-800/95 dark:via-slate-800/70 dark:to-slate-800/95 backdrop-blur-lg before:absolute before:left-0 before:top-0 before:bottom-0 before:w-4 before:bg-gradient-to-r before:from-slate-900/5 before:to-transparent dark:before:from-slate-900/20 before:pointer-events-none"
      >
        {/* 工具栏按钮 */}
        <div
          className={cn(
            'bg-gradient-to-r from-white/90 via-slate-50/70 to-white/90',
            'dark:from-slate-800/90 dark:via-slate-700/70 dark:to-slate-800/90',
            'border-b border-slate-200/60 dark:border-slate-700/60',
            'backdrop-blur-xl transition-all duration-300',
          )}
        >
          <div className="flex items-center p-1 transition-all duration-300">
            <div className="flex w-full justify-evenly transition-all duration-300">
              {[
                {
                  icon: 'LogOut',
                  tooltip: '返回首页',
                  action: () => backHome(),
                  color: 'red',
                  flip: true, // 水平镜像反转
                },
                {
                  icon: 'FilePlus',
                  action: () => startCreateNewFile(),
                  tooltip: '新建文件',
                  color: 'blue',
                },
                {
                  icon: 'FolderPlus',
                  tooltip: '新建文件夹',
                  color: 'yellow',
                  // 仅作为展示，不绑定事件
                },
                {
                  icon: 'RefreshCw',
                  action: refreshFiles,
                  tooltip: '刷新',
                  color: 'green',
                },
                {
                  icon: 'FolderMinus',
                  tooltip: '折叠所有',
                  color: 'slate',
                  // 仅作为展示，不绑定事件
                },
              ].map((item, index) => (
                <div key={item.icon} className="relative group">
                  <button
                    className={cn(
                      'p-2 rounded-xl transition-all duration-300 transform hover:scale-110 group/btn',
                      'bg-white/80 dark:bg-slate-700/80 backdrop-blur-md',
                      item.flip && 'transition-all duration-300 transform scale-x-[-1] hover:scale-x-[-1]', // 应用水平翻转
                      'hover:shadow-lg border border-slate-200/50 dark:border-slate-600/50',
                      'cursor-pointer',
                      // 根据颜色设置不同的悬停效果
                      item.color === 'red' &&
                        'hover:bg-gradient-to-br hover:from-red-50 hover:to-indigo-50 hover:text-red-600 hover:border-red-300/50',
                      item.color === 'blue' &&
                        'hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600 hover:border-blue-300/50',
                      item.color === 'yellow' &&
                        'hover:bg-gradient-to-br hover:from-yellow-50 hover:to-amber-50 hover:text-amber-600 hover:border-amber-300/50',
                      item.color === 'green' &&
                        'hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 hover:text-green-600 hover:border-green-300/50',
                      item.color === 'slate' &&
                        'hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100 hover:text-slate-700 hover:border-slate-300/50',
                      'dark:hover:from-slate-600/80 dark:hover:to-slate-700/80 dark:hover:text-slate-200',
                      'text-slate-600 dark:text-slate-400',
                      // 如果有action则显示光标为pointer，否则为default
                    )}
                    onClick={item.action}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Icon
                      name={item.icon as any}
                      className={cn(
                        'h-4 w-4 transition-transform duration-200 group-hover/btn:scale-110',
                      )}
                    />
                  </button>

                  {/* 精美的提示框 */}
                  <div
                    className={cn(
                      'absolute top-full mt-2 left-1/2 transform -translate-x-1/2',
                      'px-2 py-1 rounded-lg text-xs font-medium',
                      'bg-slate-800 dark:bg-slate-700 text-white',
                      'shadow-lg shadow-slate-900/20',
                      'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100',
                      'transition-all duration-200 pointer-events-none',
                      'whitespace-nowrap z-50',
                      item.flip && 'transform scale-x-[-1]', // 应用水平翻转
                      // 始终置于最顶层，防止文件选择框遮挡
                      'z-50',
                    )}
                  >
                    {item.tooltip}
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-800 dark:bg-slate-700 rotate-45" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 文件列表区域 */}
        <div
          className="flex-1 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent"
          onClick={(e) => {
            // 检查点击的目标元素是否是输入框或其子元素
            const isClickOnInput = e.target instanceof Node &&
              sidebarRef.current?.querySelector('.new-file-input')?.contains(e.target);

            // 如果不是点击在输入框上，才关闭相关状态
            if (!isClickOnInput) {

              // 重命名状态可以直接关闭
              if (isRenaming) setIsRenaming(null);

              // 新建文件状态只在点击空白区域时关闭，不包括点击在输入框上
              if (showNewItemInput && !isClickOnInput) {
                setShowNewItemInput(false);
                setNewItemName('');
              }
            }
          }}
        >
          <FileTree
            files={files}
            isRenaming={isRenaming}
            newItemName={newItemName}
            showNewItemInput={showNewItemInput}
            onFinishRenaming={finishRenaming}
            onFinishCreateNewItem={finishCreateNewItem}
            onCancelCreateNewItem={cancelCreateNewItem}
            onKeyDown={handleKeyDown}
            onSetNewItemName={setNewItemName}
            onShare={handleShare}
            onDelete={fileOperations.handleDelete}
            onRename={handleRename}
            onDuplicate={fileOperations.handleDuplicate}
            onDownload={fileOperations.handleDownload}
          />
        </div>
        {/* 分享文档栏目 */}
        <SharedDocuments sharedFiles={sharedFiles}/>

      </div>
    </div>
  )
}

export default DocumentSidebar
