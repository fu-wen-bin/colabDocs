'use client'

import React, { useEffect, useRef, useState } from 'react'
import type { FileItem } from './FileTree.tsx'
import { Icon } from '@/components/Icon.tsx'
import { cn } from '@/utils/utils.ts'

interface FileItemMenuProps {
  file: FileItem;
  onShare?: (file: FileItem) => void;
  onDelete?: (file: FileItem) => void;
  onRename?: (file: FileItem) => void;
  onDuplicate?: (file: FileItem) => void;
  onDownload?: (file: FileItem) => void;
  className?: string;
  contextMenuPosition?: { x: number; y: number } | null; // 右键菜单位置
  onClose?: () => void; // 关闭菜单的回调
  onCloseContextMenu?: () => void; // 关闭右键菜单的回调
}

const FileItemMenu = ({
  file,
  onShare,
  onDelete,
  onRename,
  onDuplicate,
  onDownload,
  className,
  contextMenuPosition,
  onClose,
}: FileItemMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // 如果是右键菜单模式
  const isContextMenu = !!contextMenuPosition

  // 处理点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        if (isContextMenu) {
          onClose?.()
        } else {
          setIsOpen(false)
        }
      }
    }

    if ((isContextMenu || isOpen)) {
      // 使用 setTimeout 避免立即触发
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 0)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, isContextMenu, onClose])

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(!isOpen) // 防止触发文件选择
    if (!isContextMenu) {
      onClose?.()
    }

  }

  const handleMenuItemClick = (action: () => void) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    action()
    if (isContextMenu) {
      onClose?.()
    } else {
      setIsOpen(false)
    }
  }

  const menuItems = [
    {
      icon: 'Share2',
      label: '分享',
      action: () => onShare?.(file),
      show: !!onShare,
      className: 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    },
    {
      icon: 'Download',
      label: '下载',
      action: () => onDownload?.(file),
      show: !!onDownload && file.type === 'file',
      className: 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20',
    },
    {
      icon: 'Copy',
      label: '复制',
      action: () => onDuplicate?.(file),
      show: !!onDuplicate,
      className: 'text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800',
    },
    {
      icon: 'Pencil',
      label: '重命名',
      action: () => onRename?.(file),
      show: !!onRename,
      className: 'text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800',
    },
    {
      icon: 'Trash',
      label: '删除',
      action: () => onDelete?.(file),
      show: !!onDelete,
      className: 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
      divider: true,
    },
  ].filter((item) => item.show)

  // 渲染菜单内容
  const renderMenu = () => (
    <div
      ref={menuRef}
      className="bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-gray-200 dark:border-slate-700 py-1 min-w-[140px] z-[9999]"
      style={
        isContextMenu
          ? {
              position: 'fixed',
              left: `${contextMenuPosition.x}px`,
              top: `${contextMenuPosition.y}px`,
            }
          : {
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '4px',
            }
      }
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, index) => (
        <div key={item.label}>
          {item.divider && index > 0 && (
            <div className="border-t border-gray-200 dark:border-slate-700 my-1" />
          )}
          <button
            className={cn(
              'w-full text-left px-3 py-2 text-sm flex items-center transition-colors',
              'dark:text-slate-300 dark:hover:text-white',
              item.className,
            )}
            onClick={handleMenuItemClick(item.action)}
          >
            <Icon name={item.icon as any} className="h-4 w-4 mr-2" />
            {item.label}
          </button>
        </div>
      ))}
    </div>
  )

  // 如果是右键菜单模式，直接渲染菜单
  if (isContextMenu) {
    return renderMenu()
  }

  // 否则渲染带按钮的菜单
  return (
    <div className={cn('relative', className)}>
      <button
        ref={buttonRef}
        className="p-1 cursor-pointer bg-none rounded-full dark:hover:bg-slate-700 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors opacity-0 group-hover:opacity-100"
        onClick={handleMenuClick}
        title="更多操作"
      >
        <Icon name="EllipsisVertical" className="h-4 w-4" />
      </button>

      {isOpen && renderMenu()}
    </div>
  )
}

export default FileItemMenu
