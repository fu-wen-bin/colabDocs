import { useEffect, useState } from 'react'
import { Editor } from '@tiptap/react'
import { Typography } from 'antd'

const { Title } = Typography

interface TocItem {
  id: string;
  level: number;
  text: string;
}

interface TableOfContentsProps {
  editor: Editor | null;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ editor }) => {
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  // 当编辑器内容变化时，更新目录
  useEffect(() => {
    if (!editor) return

    const updateToc = () => {
      const items: TocItem[] = []
      const headings = document.querySelectorAll(
        '.ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6')

      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName[1])
        const text = heading.textContent || ''
        const id = `heading-${index}`

        // 为每个标题添加 ID，以便点击目录可以跳转
        heading.id = id

        items.push({ id, level, text })
      })

      setTocItems(items)
    }

    // 初始更新
    setTimeout(updateToc, 100)

    // 监听编辑器内容变化
    editor.on('update', updateToc)

    // 监听滚动，高亮当前位置的目录项
    const handleScroll = () => {
      const headings = document.querySelectorAll(
        '.ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6')

      // 查找当前视窗中最靠上的标题
      for (const heading of headings) {
        const rect = heading.getBoundingClientRect()
        if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
          setActiveId(heading.id)
          break
        }
      }
    }

    document.addEventListener('scroll', handleScroll)

    return () => {
      editor.off('update', updateToc)
      document.removeEventListener('scroll', handleScroll)
    }
  }, [editor])

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setActiveId(id)
    }
  }

  return (
    <div className="table-of-contents p-4 h-full">
      <Title level={4} className="mb-4 text-slate-700 dark:text-slate-300">
        文档目录
      </Title>
      <ul className="space-y-2 toc-list">
        {tocItems.length > 0 ? (
          tocItems.map((item) => (
            <li
              key={item.id}
              className={`cursor-pointer transition-colors text-slate-600 dark:text-slate-400 toc-item ${
                activeId === item.id ? 'active-toc-item' : ''
              }`}
              style={{
                paddingLeft: `${(item.level - 1) * 12}px`,
                fontSize: `${16 - (item.level - 1) * 0.5}px`,
                borderLeft: activeId === item.id
                  ? '2px solid #1890ff'
                  : '2px solid transparent',
                paddingTop: '4px',
                paddingBottom: '4px',
              }}
              onClick={() => scrollToHeading(item.id)}
            >
              {item.text}
            </li>
          ))
        ) : (
          <li
            className="text-sm text-slate-500 dark:text-slate-400">没有找到标题</li>
        )}
      </ul>
    </div>
  )
}

export default TableOfContents
