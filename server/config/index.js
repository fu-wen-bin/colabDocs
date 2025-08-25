const config = {
  db: {
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '123456',
    database: 'colabdocs',
  },
}

// 数据库相关操作
const mysql = require('mysql2/promise')

// 创建数据库连接池
const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
})

// 执行sql查询
const allServices = {
  async query (sql, values) {
    try {
      // 使用连接池执行查询
      const conn = await pool.getConnection()
      // 执行各种增删改查的sql语句操作
      const [rows] = await conn.query(sql, values) // rows是查询结果，fields是字段信息
      // 释放连接
      conn.release()  // 修改这里：使用conn.release()而不是pool.releaseConnection
      // 返回查询结果
      return Promise.resolve(rows)
    } catch (error) {
      // 发生错误时，返回错误信息
      return Promise.reject(error)
    }
  },

  // 添加获取连接的方法
  async getConnection() {
    return pool.getConnection();
  }
}

module.exports = {
  allServices,
}