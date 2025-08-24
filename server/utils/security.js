// 防止sql注入
function escape (str) {
  return str.replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim()
}

module.exports = {
  escape,
}