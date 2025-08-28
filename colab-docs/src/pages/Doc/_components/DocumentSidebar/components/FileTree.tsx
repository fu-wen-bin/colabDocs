import React, { useRef } from 'react';

// 修复导入路径，指向正确的位置
import FileItemMenu from './FileItemMenu.tsx';

import { Icon } from '@/components/Icon.tsx';
import { cn } from '@/utils/utils.ts';
import { useNavigate } from 'react-router'
import { useEditorStore } from '@/stores/editorStore.ts';

interface FileTreeProps {
  files: FileItem[];
  isRenaming: string | null;
  newItemName: string;
  onFinishRenaming: (newName: string) => void;
  onFinishCreateNewItem: () => void;
  onCancelCreateNewItem: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSetNewItemName: (name: string) => void;
  onShare: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  onDuplicate: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  showNewItemInput: boolean; // 控制是否显示新建文件输入框
}

// 简化文件类型定义 - 只保留文件类型
export type FileItem = {
  id: string;
  name: string;
  type: 'file'; // 固定为文件类型
  is_starred?: boolean;
  created_at?: string;
  updated_at?: string;
};

const FileTree: React.FC<FileTreeProps> = ({
  files,
  isRenaming,
  newItemName,
  onFinishRenaming,
  onFinishCreateNewItem,
  onCancelCreateNewItem,
  onKeyDown,
  onSetNewItemName,
  onShare,
  onDelete,
  onRename,
  onDuplicate,
  onDownload,
  showNewItemInput,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // 使用统一的状态管理
  const fileId = useEditorStore((state) => state.fileId)
  const setFileId = useEditorStore((state) => state.setFileId)
  const navigate = useNavigate()

  // 渲染单个文件
  const renderFile = (file: FileItem): React.ReactNode => {
    // 修正：使用正确地选中状态判断
    const isSelected = fileId === file.id;
    const isItemRenaming = isRenaming === file.id;


    console.log(fileId);

    return (
      <div key={file.id}>
        <div
          className={cn(
            'flex items-center py-2 px-3 text-sm cursor-pointer relative group box-border',
            'transition-all duration-300 ease-out rounded-lg mx-2 my-0.5 ',
            // 选中状态样式
            isSelected && [
              'bg-blue-500/10 dark:bg-blue-400/15',
              'text-blue-700 dark:text-blue-300',
              'border-2 border-blue-500 dark:border-blue-400',
              'shadow-sm shadow-blue-500/20',
              'z-10'
            ],
            // 非选中状态样式
            !isSelected && [
              'hover:bg-gradient-to-r hover:from-blue-50/80 hover:via-blue-100/60 hover:to-blue-50/80',
              'dark:hover:from-blue-900/20 dark:hover:via-blue-800/30 dark:hover:to-blue-900/20',
              'hover:shadow-md hover:shadow-blue-200/40 dark:hover:shadow-blue-900/30',
              'hover:transform hover:scale-[1.01]',
              'text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300',
              'border-2 border-transparent',
            ],
          )}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
            setFileId(file.id)
            // 导航到文档编辑页面
            navigate(`/doc?fileId=${file.id}`)
          }}
        >
          {/* 文件图标 - 精美设计 */}
          <div className="w-6 h-6 mr-3 flex-shrink-0 flex items-center justify-center">
            <div
              className={cn(
                'w-5 h-5 rounded-md flex items-center justify-center',
                'bg-gradient-to-br from-blue-400 to-indigo-500',
                'shadow-md shadow-blue-500/30 transition-all duration-300 group-hover:scale-110',
              )}
            >
              <Icon name="FileText" className="h-3.5 w-3.5 text-white drop-shadow-sm" />
            </div>
          </div>

          {/* 文件名称/重命名输入框 */}
          <div className="flex-1 min-w-0 mr-3">
            {isItemRenaming ? (
              // 重命名输入框
              <input
                ref={inputRef}
                type="text"
                className={cn(
                  'w-full bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm',
                  'border-2 border-blue-400/70 dark:border-blue-500/70',
                  'focus:border-blue-500 dark:focus:border-blue-400',
                  'focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30',
                  'px-2 py-1 text-sm rounded-lg transition-all duration-300',
                  'text-slate-900 dark:text-slate-100',
                  'shadow-lg shadow-blue-200/30 dark:shadow-blue-800/20',
                )}
                defaultValue={file.name}
                onBlur={(e) => onFinishRenaming(e.target.value)}
                onKeyDown={onKeyDown}
                autoFocus
              />
            ) : (
              // 文件名显示
              <span
                className={cn(
                  'block truncate font-medium transition-all duration-300',
                  isSelected
                    ? 'text-blue-700 dark:text-blue-300 font-medium'
                    : 'text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-300',
                )}
              >
                {file.name}
              </span>
            )}
          </div>

          {/* 快捷操作按钮 - 三个点菜单 */}
          <div
            className={cn(
              'flex items-center space-x-1 opacity-0 group-hover:opacity-100',
              'transition-all duration-300 transform translate-x-2 group-hover:translate-x-0',
              'z-[100]', // 确保菜单显示在最上层
            )}
          >
            <div
              className={cn('transition-all duration-300 transform hover:scale-110')}
              onClick={(e) => {
                e.stopPropagation(); // 防止触发文件选择
              }}
            >
              <FileItemMenu
                file={file}
                onShare={onShare}
                onDelete={onDelete}
                onRename={onRename}
                onDuplicate={onDuplicate}
                onDownload={onDownload}
                className={cn(
                  'p-1.5 rounded-lg transition-all duration-300',
                  isSelected
                    ? 'hover:bg-blue-100/50 text-blue-600 hover:text-blue-700'
                    : 'hover:bg-blue-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400',
                )}
              />
            </div>
          </div>

          {/* 选中状态的光晕效果 */}
          {isSelected && (
            <div
              className={cn(
                'absolute inset-0 rounded-lg pointer-events-none',
                'bg-blue-500/5 dark:bg-blue-400/8',
              )}
            />
          )}
        </div>
      </div>
    );
  };

  // 渲染新建文件输入框
  const renderNewFileInput = () => {
    if (!showNewItemInput) return null;

    return (
      <div
        className={cn(
          'new-file-input', // 添加标识类名
          'flex items-center py-2 px-3 text-sm mx-2 my-0.5',
          'bg-gradient-to-r from-green-50 via-emerald-50/80 to-green-50',
          'dark:from-green-900/20 dark:via-emerald-900/20 dark:to-green-900/20',
          'border border-green-200/60 dark:border-green-700/50 rounded-lg',
          'shadow-md shadow-green-200/20 dark:shadow-green-800/20',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 文件图标 */}
        <div className="w-6 h-6 mr-3 flex-shrink-0 flex items-center justify-center">
          <div
            className={cn(
              'w-5 h-5 rounded-md flex items-center justify-center',
              'bg-gradient-to-br from-emerald-400 to-green-500',
              'shadow-md shadow-emerald-500/30',
            )}
          >
            <Icon name="FileText" className="h-3.5 w-3.5 text-white drop-shadow-sm" />
          </div>
        </div>

        {/* 输入框和操作按钮 */}
        <div className="flex-1 flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            className={cn(
              'flex-1 w-5 bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm',
              'border-2 border-green-400/70 dark:border-green-500/70',
              'focus:border-green-500 dark:focus:border-green-400',
              'focus:ring-2 focus:ring-green-500/30 dark:focus:ring-green-400/30',
              'px-3 py-2 text-sm rounded-lg transition-all duration-300',
              'text-slate-900 dark:text-slate-100',
              'shadow-lg shadow-green-200/30 dark:shadow-green-800/20',
            )}
            value={newItemName}
            onChange={(e) => onSetNewItemName(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus
            placeholder="文件名称"
          />

          {/* 确认和取消按钮 */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button
              className={cn(
                'p-2 rounded-xl transition-all duration-300 transform hover:scale-110',
                'bg-gradient-to-br from-green-500 to-emerald-600',
                'text-white shadow-lg shadow-green-500/30',
                'hover:from-green-600 hover:to-emerald-700',
              )}
              onClick={onFinishCreateNewItem}
              title="确认"
            >
              <Icon name="Check" className="h-3.5 w-3.5" />
            </button>
            <button
              className={cn(
                'p-2 rounded-xl transition-all duration-300 transform hover:scale-110',
                'bg-gradient-to-br from-red-500 to-pink-600',
                'text-white shadow-lg shadow-red-500/30',
                'hover:from-red-600 hover:to-pink-700',
              )}
              onClick={onCancelCreateNewItem}
              title="取消"
            >
              <Icon name="X" className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="py-2 relative">
      {/* 渲染新建文件输入框（如果显示） */}
      {renderNewFileInput()}
      {/* 渲染文件列表 */}
      {files.map((file) => renderFile(file))}
    </div>
  );
};

export default FileTree;
