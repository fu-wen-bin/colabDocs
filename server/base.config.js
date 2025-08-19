// node 服务器 基础配置
const { logger } = require("./utils/logger.js"); // 修改路径

// 业务端口
const server_port = 8888;

// ws 统一端口
const ws_port = 9999;

// mysql
const sql_config = {
  port: 3306,
  host: "127.0.0.1",
  database: "mpoe",
  user: "root",
  password: "123456",
};

// JWT 加密字符串
const JSON_WEB_TOKEN_SECRET =
  "17c13348-9dbd5d-407e682-2890d69-47f8606-8a668f-3caaa9bb-a6eac08d-dfbeb1d";

// 方法监听函数
const initServeListen = (http) => {
  http.listen(server_port, () => {
    logger.success(`Node Serve is running at http://localhost:${server_port}.`);
  });
};

module.exports = {
  server_port,
  ws_port,
  sql_config,
  JSON_WEB_TOKEN_SECRET,
  initServeListen,
};
