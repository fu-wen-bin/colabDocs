import * as React from 'react'
import { cva } from 'class-variance-authority'

export const toolbarStyles = cva(
  // 原有样式类
  'tiptap-toolbar flex flex-nowrap items-center px-1 py-1 overflow-x-auto overflow-y-hidden border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950',
)

export const Toolbar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`${toolbarStyles()} ${className || ''}`}
      {...props}
    />
  )
})
Toolbar.displayName = 'Toolbar'

// 添加缺失的 ToolbarGroup 组件
export const ToolbarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      // 子项不收缩，优先产生横向滚动
      className={`flex items-center gap-1 shrink-0 ${className || ''}`}
      {...props}
    />
  )
})
ToolbarGroup.displayName = 'ToolbarGroup'

// 添加缺失的 ToolbarSeparator 组件
export const ToolbarSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2 shrink-0 ${className ||
                                                                          ''}`}
      {...props}
    />
  )
})
ToolbarSeparator.displayName = 'ToolbarSeparator'
