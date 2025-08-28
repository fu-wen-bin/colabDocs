import {
  Document,
  handleImageUpload,
  Highlight,
  HorizontalRule,
  Image,
  ImageUploadNode,
  MAX_FILE_SIZE,
  Paragraph,
  Selection,
  StarterKit,
  Subscript,
  Superscript,
  TaskItem,
  TaskList,
  Text,
  TextAlign,
  Typography,
} from '.'


export const ExtensionKit = () => [
  Document,
  Paragraph,
  Text,
  StarterKit.configure({
    horizontalRule: false,
    link: { openOnClick: false, enableClickSelection: true },
  }),
  HorizontalRule,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Highlight.configure({ multicolor: true }),
  Image.configure({
    allowBase64: true,
  }),
  Typography,
  Superscript,
  Subscript,
  Selection,
  ImageUploadNode.configure({
    accept: 'image/*',
    maxSize: MAX_FILE_SIZE,
    limit: 3,
    upload: handleImageUpload,
    onError: (error) => console.error('上传出错：', error),
  }),
]

export default ExtensionKit
