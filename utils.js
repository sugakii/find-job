/**
 * 工具函数
 */
const fs = require("fs");
const path = require("path");

// 模拟真人等待 - 快-慢-停的节奏
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 随机延迟:真人操作节奏(快-慢-停)
function randomDelay(min, max) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return sleep(delay);
}

// 模拟真人打字速度差异
function typeDelay() {
  // 大部分字符正常速度(50-150ms),偶尔停顿(300-500ms),偶尔快速(20-50ms)
  const rand = Math.random();
  if (rand < 0.1) {
    return sleep(Math.random() * 200 + 300); // 10%概率停顿
  } else if (rand < 0.3) {
    return sleep(Math.random() * 30 + 20); // 20%概率快速
  } else {
    return sleep(Math.random() * 100 + 50); // 70%概率正常
  }
}

// 模拟真人退格修正(概率5-15%)
function shouldBackspace() {
  return Math.random() < 0.1;
}

// 获取随机User-Agent
function getRandomUserAgent() {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36"
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// 读取简历信息(同步版本)
function getResumeInfo() {
  try {
    const filePath = path.join(__dirname, "简历基本信息.txt");
    return fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error("读取文件时出错:", err);
    return "";
  }
}

// 混淆GPT返回的消息,降低相似度
function randomizeMessage(message) {
  const variations = [
    // 尝试替换一些常见词汇
    msg => msg.replace(/您好/g, "你好").replace(/招聘负责人/g, "HR"),
    msg => msg.replace(/你好/g, "您好").replace(/HR/g, "招聘负责人"),
    msg => msg.replace(/希望能/g, "希望").replace(/非常期待/g, "期待"),
    msg => msg,
  ];
  const randomVariation = variations[Math.floor(Math.random() * variations.length)];
  return randomVariation(message);
}

module.exports = {
  getResumeInfo,
  sleep,
  randomDelay,
  typeDelay,
  shouldBackspace,
  getRandomUserAgent,
  randomizeMessage,
};
