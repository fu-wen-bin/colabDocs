const { allServices } = require('../../config')

// 登录接口要执行的函数
const userAccountLogin = (username, password) => {
  // 1. 构建查询语句
  const sql = 'SELECT * FROM users WHERE name = ? AND password = ?'
  // 2. 执行查询
  return allServices.query(sql, [username, password])
}

// 查找账户是否存在
const findUser = (data) => {
  if (data.hasOwnProperty('name')) {
    const sql = 'SELECT * FROM users WHERE name = ?'
    return allServices.query(sql, [data.name])
  }
  if (data.hasOwnProperty('id')) {
    const sql = 'SELECT * FROM users WHERE id = ?'
    return allServices.query(sql, [data.id])
  }
}

// 账户注册
const userAccountRegister = (data) => {
  // 1. 构建插入语句
  const sql = `INSERT INTO users (id, name, password, avatar_url)
               VALUES (?, ?, ?, ?);`
  // 2. 执行插入
  return allServices.query(sql,
    [data.id, data.name, data.password, data.avatar_url])
}

// GitHub验证账户注册
const userGithubRegister = (data) => {
  // 1. 构建插入语句
  const sql = `INSERT INTO users (id, name, github_id, avatar_url)
               VALUES (?, ?, ?, ?)`

  // 2. 执行插入
  return allServices.query(sql,
    [data.id, data.name, data.id, data.avatar_url])
}

// GitHub用户更新
const githubUserUpdate = (data) => {
  const sql = `UPDATE users
               SET name       = ?,
                   avatar_url = ?
               WHERE github_id = ?`
  return allServices.query(sql,
    [data.name, data.avatar_url, data.id])
}

module.exports = {
  findUser,
  userAccountLogin,
  userAccountRegister,
  userGithubRegister,
  githubUserUpdate,
}