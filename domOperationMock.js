/**
 * 这里面都是模拟dom的操作
 */
const { Builder, By, until, WebElement } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const { randomDelay, getRandomUserAgent } = require("./utils");

// 全局 WebDriver 实例
let driver;

// 获取 WebDriver 实例
function getDriver() {
  return driver;
}

/**
 * 模拟真人鼠标移动并点击(先hover再点击)
 */
async function humanClick(driver, element) {
  try {
    const actions = driver.actions({ async: true });
    // 先移动到元素上(hover)
    const { x, y, width, height } = await element.getRect();
    const hoverX = x + width / 2;
    const hoverY = y + height / 2;

    // 随机偏移,模拟不精准
    const offsetX = (Math.random() - 0.5) * 10;
    const offsetY = (Math.random() - 0.5) * 10;

    await actions.move({ x: hoverX + offsetX, y: hoverY + offsetY, origin: "viewport" }).perform();
    await randomDelay(100, 300); // hover后短暂停顿

    // 再点击
    await actions.click(element).perform();
    await randomDelay(200, 500); // 点击后停顿
  } catch (error) {
    console.error("模拟点击失败:", error);
    throw error;
  }
}

/**
 * 模拟真人打字输入(带打字间隔和退格修正)
 */
async function humanType(driver, element, text) {
  try {
    await element.clear();
    await randomDelay(200, 500);

    let typedText = "";
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      typedText += char;

      await element.sendKeys(char);

      // 打字间隔
      await randomDelay(50, 150);

      // 5-10%概率退格修正(删除最后1-2个字符重新输入)
      if (typedText.length > 3 && Math.random() < 0.07) {
        const backspaceCount = Math.floor(Math.random() * 2) + 1;
        for (let j = 0; j < backspaceCount && typedText.length > 0; j++) {
          await element.sendKeys(Key.BACK_SPACE);
          typedText = typedText.slice(0, -1);
          await randomDelay(80, 150);
        }
        // 重新输入
        for (let j = 0; j < backspaceCount && i < text.length; j++) {
          const reChar = text[i - backspaceCount + j + 1];
          if (reChar) {
            await element.sendKeys(reChar);
            typedText += reChar;
            await randomDelay(50, 150);
          }
        }
      }

      // 偶尔长时间停顿(思考)
      if (Math.random() < 0.05) {
        await randomDelay(500, 1000);
      }
    }
  } catch (error) {
    console.error("模拟打字失败:", error);
    throw error;
  }
}

/**
 * 使用指定的选项打开浏览器(优化版本)
 */
async function openBrowserWithOptions(url, browser) {
  const options = new chrome.Options();

  // 指定Chrome可执行文件路径
  options.setChromeBinaryPath("F:\\AI Career Companion\\WebDriver\\chrome-win64\\chrome.exe");

  // 防止Selenium被检测
  options.addArguments("--disable-blink-features=AutomationControlled");
  options.addArguments("--disable-dev-shm-usage");
  options.addArguments("--no-sandbox");
  options.addArguments("--disable-infobars");
  options.addArguments("--disable-extensions");
  options.addArguments("--disable-gpu");

  // 设置自定义User-Agent
  options.addArguments(`--user-agent=${getRandomUserAgent()}`);

  // 窗口设置为1920x1080(真人常用分辨率)
  options.addArguments("--window-size=1920,1080");

  // 注入JS修改navigator.webdriver
  options.addArguments(`--disable-extensions-except=`);
  options.addArguments("--disable-web-security");

  // 通过excludeSwitches去掉自动化标识
  options.excludeSwitches = ["enable-automation"];
  options.setUserPreferences({
    "credentials_enable_service": false,
    "profile.password_manager_enabled": false
  });

  // 配置ChromeDriver服务
  const { ServiceBuilder } = chrome;
  const service = new ServiceBuilder(
    "F:\\AI Career Companion\\WebDriver\\chromedriver-win64\\chromedriver.exe"
  );

  if (browser === "chrome") {
    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .setChromeService(service)
      .build();

    await randomDelay(1000, 2000);

    // 注入JS隐藏webdriver特征
    try {
      await driver.executeScript(`
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined
        });
      `);

      // 注入更多反检测脚本
      await driver.executeScript(`
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5]
        });
        Object.defineProperty(navigator, 'languages', {
          get: () => ['zh-CN', 'zh', 'en']
        });
      `);
    } catch (error) {
      console.log("反检测脚本注入失败(可能浏览器未完全初始化):", error.message);
    }

    await randomDelay(1000, 2000);
  } else {
    throw new Error("不支持的浏览器类型");
  }

  await driver.get(url);
  await randomDelay(1000, 2000);

  // 等待直到页面包含登录按钮dom(使用CSS选择器减少XPath使用)
  try {
    const cssLocator = By.css("#header div:first-child div:nth-child(3) div > a");
    await driver.wait(until.elementLocated(cssLocator), 15000);
  } catch (error) {
    // 如果CSS定位失败,降级到XPath(但降低使用频率)
    const xpathLocator = By.xpath("//*[@id='header']/div[1]/div[3]/div/a");
    await driver.wait(until.elementLocated(xpathLocator), 15000);
  }
}

// 点击登录按钮，并等待登录成功(优化版本)
async function logIn() {
  // 模拟真人操作节奏
  await randomDelay(500, 1500);

  // 点击登录 - 使用CSS选择器
  try {
    const loginButton = await driver.findElement(By.css("#header > div:nth-child(1) > div:nth-child(3) > div > a"));
    await humanClick(driver, loginButton);
  } catch (error) {
    // CSS失败则降级到XPath
    const loginButton = await driver.findElement(By.xpath("//*[@id='header']/div[1]/div[3]/div/a"));
    await humanClick(driver, loginButton);
  }

  await randomDelay(800, 2000);

  // 等待微信登录按钮出现
  try {
    const wechatButton = await driver.findElement(By.css("#wrap > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(4) > a"));
    await humanClick(driver, wechatButton);
  } catch (error) {
    // CSS失败则降级到XPath
    const wechatButton = await driver.findElement(By.xpath("//*[@id='wrap']/div/div[2]/div[2]/div[2]/div[1]/div[4]/a"));
    await humanClick(driver, wechatButton);
  }

  await randomDelay(1000, 3000);

  // 等待微信二维码显示
  const xpathLocatorWechatLogo =
    "//*[@id='wrap']/div/div[2]/div[2]/div[1]/div[2]/div[1]/img";
  await driver.wait(
    until.elementLocated(By.xpath(xpathLocatorWechatLogo)),
    15000
  );

  await randomDelay(2000, 4000);

  // 登录成功 - 使用CSS选择器
  try {
    const loginSuccessLocator = By.css("#header > div:nth-child(1) > div:nth-child(3) > ul > li:nth-child(2) > a");
    await driver.wait(
      until.elementLocated(loginSuccessLocator),
      90000
    );
  } catch (error) {
    // CSS失败则降级到XPath
    const xpathLocatorLoginSuccess = "//*[@id='header']/div[1]/div[3]/ul/li[2]/a";
    await driver.wait(
      until.elementLocated(By.xpath(xpathLocatorLoginSuccess)),
      90000
    );
  }

  await randomDelay(2000, 4000);
}

// 根据索引获取职位描述(优化版本)
async function getJobDescriptionByIndex(index) {
  try {
    // 模拟真人浏览节奏 - 快-慢-停
    await randomDelay(500, 1000);

    // 优先使用CSS选择器(减少XPath使用频率)
    let jobElement;
    try {
      jobElement = await driver.findElement(
        By.css(`#wrap > div:nth-child(2) > div:nth-child(2) > div > div > div:nth-child(1) > ul > li:nth-child(${index})`)
      );
    } catch (error) {
      // CSS失败则降级到XPath
      const jobSelector = `//*[@id='wrap']/div[2]/div[2]/div/div/div[1]/ul/li[${index}]`;
      jobElement = await driver.findElement(By.xpath(jobSelector));
    }

    // 点击招聘信息列表中的项(使用humanClick)
    await humanClick(driver, jobElement);

    // 模拟真人阅读停顿
    await randomDelay(1000, 2000);

    // 找到描述信息节点并获取文字
    let jobDescriptionElement;
    try {
      const descriptionSelector = By.css("#wrap > div:nth-child(2) > div:nth-child(2) > div > div > div:nth-child(2) > div > div:nth-child(2) > p");
      await driver.wait(until.elementLocated(descriptionSelector), 15000);
      jobDescriptionElement = await driver.findElement(descriptionSelector);
    } catch (error) {
      // CSS失败则降级到XPath
      const descriptionSelector =
        By.xpath("//*[@id='wrap']/div[2]/div[2]/div/div/div[2]/div/div[2]/p");
      await driver.wait(until.elementLocated(descriptionSelector), 15000);
      jobDescriptionElement = await driver.findElement(descriptionSelector);
    }

    const jobDescription = await jobDescriptionElement.getText();

    // 模拟真人阅读完整描述后的思考时间
    await randomDelay(800, 1500);

    return jobDescription;
  } catch (error) {
    console.log(`在索引 ${index} 处找不到工作。`);
    return null;
  }
}

module.exports = {
  getDriver,
  openBrowserWithOptions,
  logIn,
  getJobDescriptionByIndex,
  humanClick,
  humanType,
};
