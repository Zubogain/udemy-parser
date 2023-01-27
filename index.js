import chalk from "chalk";
import sleep from "sleep";
import { userAgents, viewports } from "./browser-settings";
import { PuppeteerHandler } from "./helpers";
import { readLanguages, initCatsDir, getSavedCats } from "./common";
import { toXLSX } from "./convert";
const SITE = "https://www.udemy.com/";

(async function main() {
  initCatsDir();

  const p = new PuppeteerHandler(
    SITE,
    userAgents[0],
    viewports[0],
    readLanguages(getSavedCats())
  );
  try {
    await p.start();
    console.log(chalk.white.underline("Data scraping finished!"));
    p.closeBrowser();
    toXLSX();
  } catch (err) {
    console.log(chalk.red("An error has occured:", chalk.yellow(err)));
    console.log(chalk.white.bgBlack("Parser is restarting..."));
    p.closeBrowser();
    sleep.msleep(10000);
    main();
  }
})();
