import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import RecaptchaPlugin from "puppeteer-extra-plugin-recaptcha";
import fs from "fs";
import chalk from "chalk";

import {
  randomInteger,
  saveLanguages,
  parseLanguages,
  parseCategories,
  saveCategories,
  getCurrentDateTime,
} from "./common";

puppeteer.use(StealthPlugin());
puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: "2captcha",
      token: "82cf1e89938d61a3818ef86965c8a312",
    },
    visualFeedback: false,
  })
);

export const LAUNCH_PUPPETEER_OPTS = {
  headless: true,
  ignoreHTTPSErrors: true,
};

export const PAGE_PUPPETEER_OPTS = {
  networkidle2Timeout: 5000,
  waitUntil: ["networkidle2", "load"],
};

export class PuppeteerHandler {
  constructor(url, userAgent, viewport, languages) {
    try {
      if (typeof url != "string") {
        throw "PuppeteerHandler -> url invalid";
      }

      if (typeof userAgent != "string") {
        throw "PuppeteerHandler -> user-agent invalid";
      }

      if (
        viewport instanceof Object &&
        typeof viewport.width != "number" &&
        typeof viewport.height != "number"
      ) {
        throw "PuppeteerHandler -> viewport invalid";
      }

      if (!(languages instanceof Array)) {
        throw "PuppeteerHandler -> languages invalid";
      }
    } catch (err) {
      throw err;
    }

    this.browser = null;
    this.houdiniMode = false;
    this.url = url;
    this.userAgent = userAgent;
    this.viewport = viewport;
    this.languages = languages;
  }
  async initBrowser() {
    this.browser = await puppeteer.launch(LAUNCH_PUPPETEER_OPTS);
  }
  closeBrowser() {
    this.browser.close();
  }

  async getScreenshot(page) {
    try {
      if (typeof page != "object") {
        throw "PuppeteerHandler -> getScreenshot -> argument page is not a object";
      }

      return await page.screenshot({
        encoding: "base64",
        fullPage: true,
      });
    } catch (err) {
      throw err;
    }
  }

  saveScreenshot(name, base64) {
    try {
      if (typeof name != "string") {
        throw "PuppeteerHandler -> saveScreenshot -> arg: name is not a string";
      }

      if (typeof base64 != "string") {
        throw "PuppeteerHandler -> saveScreenshot -> arg: base64 is not a string";
      }

      const base64Data = base64.replace(/^data:image\/png;base64,/, "");
      fs.writeFile(
        `./screenshots/${name}(${getCurrentDateTime()}).png`,
        base64Data,
        "base64",
        function (err) {
          if (err) {
            throw err;
          }
        }
      );
    } catch (err) {
      throw err;
    }
  }

  async checkHoudiniMode(page, timeout) {
    try {
      if (typeof page != "object") {
        throw "PuppeteerHandler -> udemyShowLangMenu -> page is not a object";
      }
    } catch (err) {
      throw err;
    }

    try {
      const selector = ".dropdown-toggle.btn.btn-sm.btn-quaternary";
      await page.waitForSelector(selector, {
        timeout,
      });
      console.log(chalk.cyan("houdiniMode: inactive"));
    } catch (err) {
      try {
        this.houdiniMode = true;
        const selector =
          ".udlite-select.udlite-select-with-icon.udlite-text-sm";
        await page.waitForSelector(selector, {
          timeout,
        });
        console.log(chalk.cyan("houdiniMode: active"));
      } catch (err) {
        throw err;
      }
    }
  }

  async getLanguages(page) {
    if (this.languages.length) {
      console.log(chalk.green("getLanguages: success"));
      return this.languages;
    } else {
      try {
        if (typeof page != "object") {
          throw "PuppeteerHandler -> udemyGetLangList -> page is not a object";
        }
      } catch (err) {
        throw err;
      }

      try {
        if (this.houdiniMode) {
          const selector =
            "footer select.udlite-select.udlite-select-with-icon.udlite-text-sm";

          await page.waitForSelector(selector);

          this.languages = parseLanguages(
            await page.$eval(selector, (e) => e.innerHTML),
            this.houdiniMode
          );
        } else {
          const selector = "footer ul.dropdown-menu";

          await page.waitForSelector(selector);

          this.languages = parseLanguages(
            await page.$eval(selector, (e) => e.innerHTML),
            this.houdiniMode
          );
        }
        saveLanguages(this.languages);
        console.log(chalk.green("getLanguages: success"));
      } catch (err) {
        throw err;
      }
    }
  }

  async solveCaptcha(page, showLog = true) {
    for (const frame of page.mainFrame().childFrames()) {
      await frame.solveRecaptchas();
    }
    showLog && console.log(chalk.green("Captcha: success"));
  }

  async getСategoriesTopics(page, lang, href) {
    const url = `https://www.udemy.com${href}?persist_locale=&locale=${lang}`;
    const topics = [];
    await page.goto(url, PAGE_PUPPETEER_OPTS);
    console.log(chalk.cyan("topic url: ", url));

    let selector;
    if (this.houdiniMode) {
      selector = 'a[class^="popular-topics-unit--link-tag-responsive--"]';
    } else {
      selector = 'a[class^="popular-topics-unit-desktop--topic-button--"]';
    }

    await page.waitForSelector(selector);
    const topicElelemnts = await page.$$(selector);
    for (let topicEl of topicElelemnts) {
      topics.push(
        await page.evaluate((el) => {
          return { text: el.innerText, href: el.href };
        }, topicEl)
      );
    }
    console.log(chalk.green("getСategoriesTopics: success"));
    return topics;
  }

  async getСategories(page) {
    for (let lang of this.languages) {
      const url = `${this.url}?persist_locale=&locale=${lang}`;
      console.log(chalk.yellow("index url: ", url));

      await page.goto(url, PAGE_PUPPETEER_OPTS);
      await this.solveCaptcha(page, false);

      const cats = parseCategories(await page.content());
      for (let cat of cats) {
        for (let subCat of cat.subCatList) {
          subCat.topics = await this.getСategoriesTopics(
            page,
            lang,
            subCat.href
          );
        }
      }
      saveCategories(cats, lang);
      await page.waitFor(randomInteger(1500, 2000));
    }
  }

  async start() {
    if (!this.browser) {
      await this.initBrowser();
    }

    try {
      const page = await this.browser.newPage();

      await page.setUserAgent(this.userAgent);
      await page.setViewport(this.viewport);
      await page.setDefaultTimeout(30000);
      await page.goto(this.url, PAGE_PUPPETEER_OPTS);
      await page.waitFor(5000);
      await this.solveCaptcha(page);
      await this.checkHoudiniMode(page, 5000);
      await this.getLanguages(page);
      await this.getСategories(page);
    } catch (err) {
      throw err;
    }
  }
}
