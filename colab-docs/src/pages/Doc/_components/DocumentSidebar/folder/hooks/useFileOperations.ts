import { useCallback } from 'react';
import { toast } from 'sonner';
import axios from '@/api';

import type { FileItem } from '../components/FileTree'

interface UseFileOperationsReturn {
  handleShare: (file: FileItem) => void;
  handleDownload: (file: FileItem) => Promise<void>;
  handleDuplicate: (file: FileItem) => Promise<void>;
  handleDelete: (file: FileItem) => Promise<void>;
  handleRename: (fileId: string, newName: string) => Promise<void>;
  handleCreate: (name: string) => Promise<boolean>;
}

export const useFileOperations = (refreshFiles: () => Promise<void>): UseFileOperationsReturn => {
  // 处理文件分享
  const handleShare = useCallback((file: FileItem) => {
    // TODO: 实现分享功能
    console.log('Share file:', file);
    toast.info('分享功能开发中...');
  }, []);

  // 处理文件下载
  const handleDownload = useCallback(async (file: FileItem) => {
    try {
      // 调用后端下载接口
      const response = await axios.post('/doc/download', {
        fileId: file.id,
      }, {
        responseType: 'blob', // 重要：设置响应类型为 blob
      });

      if (response.data) {
        // 创建下载链接
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success(`文件 "${file.name}" 下载成功`);
      }
    } catch (error) {
      console.error('下载文件失败:', error);
      toast.error('下载文件失败，请重试');
    }
  }, []);

  // 处理文件复制
  const handleDuplicate = useCallback(
    async (file: FileItem) => {
      try {
        // 调用后端复制接口
        const response = await axios.post('/doc/duplicate', {
          fileId: file.id,
          newName: `${file.name} - 副本`,
        });

        if (response.data?.code === '1') {
          // 刷新文件列表
          await refreshFiles();
          toast.success(`文件 "${file.name}" 已复制`);
        } else {
          throw new Error(response.data?.message || '复制失败');
        }
      } catch (error: any) {
        console.error('复制文件失败:', error);
        toast.error(error.response?.data?.message || '复制文件失败，请重试');
      }
    },
    [refreshFiles],
  );

  // 处理文件删除
  const handleDelete = useCallback(
    async (file: FileItem) => {
      if (confirm(`确定要删除 "${file.name}" 吗？`)) {
        try {
          // 调用后端删除接口
          const response = await axios.post('/doc/delete', {
            fileId: file.id,
          });

          if (response.data?.code === '1') {
            // 刷新文件列表
            await refreshFiles();
            toast.success(`文件 "${file.name}" 已删除`);
          } else {
            throw new Error(response.data?.message || '删除失败');
          }
        } catch (error: any) {
          console.error('删除文件失败:', error);
          toast.error(error.response?.data?.message || '删除文件失败，请重试');
        }
      }
    },
    [refreshFiles],
  );

  // 处理文件重命名
  const handleRename = useCallback(
    async (fileId: string, newName: string) => {
      try {
        // 调用后端重命名接口
        const response = await axios.post('/doc/rename', {
          fileId: fileId,
          newName: newName.trim(),
        });

        if (response.data?.code === '1') {
          // 刷新文件列表
          await refreshFiles();
          toast.success(`重命名成功`);
        } else {
          throw new Error(response.data?.message || '重命名失败');
        }
      } catch (error: any) {
        console.error('重命名失败:', error);
        toast.error(error.response?.data?.message || '重命名失败，请重试');
      }
    },
    [refreshFiles],
  );

  // 处理文件创建
  const handleCreate = useCallback(
    async (name: string) => {
      try {
        // 调用后端创建文件接口
        const response = await axios.post('/doc/create', {
          name: name.trim(),
        });

        if (response.data?.code === '1') {
          // 刷新文件列表
          await refreshFiles();
          toast.success(`文件 "${name}" 已创建`);
          return true;
        } else {
          throw new Error(response.data?.message || '创建失败');
        }
      } catch (error: any) {
        console.error('创建失败:', error);
        toast.error(error.response?.data?.message || '创建文件失败，请重试');
        return false;
      }
    },
    [refreshFiles],
  );

  return {
    handleShare,
    handleDownload,
    handleDuplicate,
    handleDelete,
    handleRename,
    handleCreate,
  };
};
