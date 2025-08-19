/**
 * 手动实现 logger4js 日志记录功能
 */
const dayjs = require("dayjs");
const fs = require("fs");
const { join } = require("path");

const loggerConfig = {
  filepath: join("", "logs"),
  filename: `mpoe.${dayjs().format("YYYY-MM-DD")}.log`,
};

class Logger {
  info() {
    let message = getArguments(arguments);
    let time = getTime();
    console.log("\x1b[94m %s \x1b[0m %s", `[${time}] [INFO] - `, message);
    writeLogger(time, message, "INFO");
  }
  error() {
    let message = getArguments(arguments);
    let time = getTime();
    console.log("\x1b[31m %s \x1b[0m %s", `[${time}] [ERROR] - `, message);
    writeLogger(time, message, "ERROR");
  }
  warn() {
    let message = getArguments(arguments);
    let time = getTime();
    console.log("\x1b[93m %s \x1b[0m %s", `[${time}] [WARN] - `, message);
    writeLogger(time, message, "WARN");
  }
  debug() {
    let message = getArguments(arguments);
    let time = getTime();
    console.log("\x1b[90m %s \x1b[0m %s", `[${time}] [DEBUG] - `, message);
    writeLogger(time, message, "DEBUG");
  }

  success() {
    let message = getArguments(arguments);
    let time = getTime();
    console.log("\x1b[92m %s \x1b[0m %s", `[${time}] [SUCCESS] - `, message);
    writeLogger(time, message, "SUCCESS");
  }
}

const logger = new Logger();

// 解析 arguments
const getArguments = (arguments) => {
  let message = "";
  for (let i = 0; i < arguments.length; i++) {
    message += arguments[i] + " ";
  }

  return message;
};

// 获取时间戳
const getTime = () => dayjs().format("YYYY-MM-DD hh:mm:ss Z[Z]");

// 写入日志文件
const writeLogger = (time, message, type) => {
  let filePath = loggerConfig.filepath;

  let filename = loggerConfig.filename;

  // 保存日志文件的信息，还可以进行拓展，包括执行当前日志的用户信息等
  let data = `[${time}] [${type}] - ${message}\n`;

  // 尝试查找目录、目录不存在，则自动创建目录
  if (!fs.existsSync(filePath)) fs.mkdirSync(filePath);

  try {
    fs.appendFileSync(filePath + "/" + filename, data);
  } catch (error) {
    fs.writeFile(filePath + "/" + filename, data, (err) => {
      logger.error(err);
    });
  }
};

module.exports = { logger };
