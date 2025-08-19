'use client';

import { useEffect, useState, useRef } from 'react';

// 导入各个tab组件
//import Folder from './folder';

import { useSidebar } from '@/stores/sidebarStore';
//import { Surface } from '@/components/ui/Surface';
import { Card } from 'antd';

function DocumentSidebar() {
  const { isOpen} = useSidebar();
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // 拖拽调整宽度
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = Math.max(280, Math.min(500, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={sidebarRef}
      className="flex h-full relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800/90 dark:to-slate-900 shadow-2xl shadow-slate-200/30 dark:shadow-slate-900/50 backdrop-blur-xl"
      style={{ width: `${sidebarWidth}px` }}
    >

      {/* 右侧内容区域 */}
      <div className="flex-1 h-full overflow-hidden relative bg-gradient-to-br from-white/95 via-slate-50/60 to-white/95 dark:from-slate-800/95 dark:via-slate-800/70 dark:to-slate-800/95 backdrop-blur-lg before:absolute before:left-0 before:top-0 before:bottom-0 before:w-4 before:bg-gradient-to-r before:from-slate-900/5 before:to-transparent dark:before:from-slate-900/20 before:pointer-events-none">
        <Card
          className="h-full overflow-hidden rounded-2xl"
        >
          1313213
        </Card>
      </div>

      {/* 右侧拖拽调整条 */}
      <div
        className="absolute -right-1 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500/20 transition-colors"
        onMouseDown={() => setIsResizing(true)}
      />

      {/* 整体右侧柔和阴影 */}
      <div className="absolute -right-4 top-0 bottom-0 w-4 pointer-events-none bg-gradient-to-r from-slate-900/10 to-transparent dark:from-slate-900/30" />
    </div>
  );
}

export default DocumentSidebar;
