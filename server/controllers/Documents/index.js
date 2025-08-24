const { allServices } = require('../../config')

// 根据文件Id查找文件内容
const findContent = (data) => {
  // 1. 构建查询语句
  const sql = 'SELECT json_content FROM documents_content WHERE document_id = ?'
  // 2. 执行查询
  return allServices.query(sql,[data.fileId])
}

module.exports={
  findContent,
}