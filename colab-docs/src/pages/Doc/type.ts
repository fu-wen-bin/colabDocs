// 文件类型
import React from 'react'

export type FileItem = {
  id: string;
  name: string;
  type: 'file';
  created_at?: string;
  updated_at?: string;
};

export interface CollaborationUser {
  id: string
  name: string
  color: string
  avatar: string
}

export interface FileTreeProps {
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