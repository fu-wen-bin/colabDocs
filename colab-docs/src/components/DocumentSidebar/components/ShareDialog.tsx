'use client';

import { useState} from 'react';
import { toast } from 'sonner';

import type { FileItem } from '@/pages/Doc/type.ts';

import { Icon } from '@/components/Icon.tsx';
import { cn } from '@/utils/utils.ts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import DocumentApi from '@/services/document';

interface ShareDialogProps {
  file: FileItem;
  isOpen: boolean;
  onClose: () => void;
}

const ShareDialog = ({ file, isOpen, onClose }: ShareDialogProps) => {
  const [shareUrl, setShareUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);



  const onSubmit = async () => {
    setIsLoading(true);

    try {

      const response = await DocumentApi.CreateShareLink(parseInt(file.id));

      if (response?.data?.code === 201 && response?.data?.data) {
        // 根据实际返回的数据结构构建分享链接
        const shareId = response.data.data.id;
        let shareUrl = `${window.location.origin}/share/${shareId}`;

        setShareUrl(shareUrl);

        // 复制到剪贴板
        await navigator.clipboard.writeText(shareUrl);

        toast.success('分享链接已创建并复制到剪贴板！', {
          duration: 4000,
        });
      } else {
        toast.error('创建分享链接失败', {
          description: '请检查网络连接或稍后重试',
        });
      }
    } catch (error) {
      console.error('创建分享链接失败:', error);
      toast.error('创建分享链接失败', {
        description: '请检查网络连接或稍后重试',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('链接已复制到剪贴板！');
      } catch (error) {
        console.error('复制失败:', error);
        toast.error('复制失败，请手动复制链接');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>分享文档</DialogTitle>
          <DialogDescription>创建分享链接，让其他人可以访问您的文档</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* 文件信息 */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Icon
              name='FileText'
              className={cn(
                'h-8 w-8', 'text-blue-500',
              )}
            />
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">文档</p>
            </div>
          </div>

          {/* 分享链接显示 */}
          {shareUrl && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-3">
                  <p className="text-sm font-medium text-green-800 mb-1">分享链接已生成</p>
                  <p className="text-xs text-green-600 break-all font-mono bg-green-100 p-2 rounded">
                    {shareUrl}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center"
                >
                  <Icon name="Copy" className="h-3 w-3 mr-1" />
                  复制
                </button>
              </div>
            </div>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
            >
              {isLoading && <Icon name="Loader" className="h-4 w-4 mr-2 animate-spin" />}
              {shareUrl ? '重新生成链接' : '创建分享链接'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
