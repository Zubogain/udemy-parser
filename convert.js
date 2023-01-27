import fs from "fs";
import { DIR_CATS } from "./common";
import chalk from "chalk";
const DIR_CONVERTED = __dirname + "/scraped-data-converted";
import XLSX from "xlsx";

function parseCatUrl(str = "") {
  const splited = str.split("/");
  return splited[splited.length - 2];
}

function initConvertedDir() {
  try {
    if (!fs.existsSync(DIR_CONVERTED)) {
      fs.mkdirSync(DIR_CONVERTED);
      console.log(chalk.blue("ℹ"), "initConvertedDir: dir is created");
    } else {
      console.log(
        chalk.blue("ℹ"),
        "initConvertedDir: don't need to create a dir"
      );
    }
  } catch (err) {
    throw err;
  }
}

export function toXLSX() {
  const wb = XLSX.utils.book_new();
  wb.Props = {
    Title: "converted data",
    Subject: "Test",
    Author: "Edvola",
    CreatedDate: new Date(),
  };

  const fileNames = fs.readdirSync(DIR_CATS);
  console.log(chalk.yellow("⚠"), "convertation to xlsx started...");
  initConvertedDir();
  let subCatsOffset = [];
  let topicsOffset = [];
  for (let i = 0; i < 1; i++) {
    subCatsOffset.push("");
  }
  for (let i = 0; i < 2; i++) {
    topicsOffset.push("");
  }

  fileNames.forEach((fileName) => {
    const file = JSON.parse(fs.readFileSync(`${DIR_CATS}/${fileName}`));
    const lang = fileName.split(".")[0];
    wb.SheetNames.push(lang);
    const catsContent = [];

    console.log(chalk.blue("ℹ"), `convertation to xlsx ${lang}`);

    if (file) {
      file.forEach((cat) => {
        const subCats = [];

        cat.subCatList.forEach((item) => {
          const subcatName = parseCatUrl(item.href);
          subCats.push([
            ...subCatsOffset,
            `${subcatName} - ${item.text}`,
            "тема:",
          ]);

          item.topics.forEach((topic) => {
            const topicName = parseCatUrl(topic.href);
            subCats.push([...topicsOffset, `${topicName} - ${topic.text}`]);
          });
        });

        catsContent.push(...subCats);
      });

      wb.Sheets[lang] = XLSX.utils.aoa_to_sheet([...catsContent]);
    }

    XLSX.writeFile(wb, `${DIR_CONVERTED}/converted.xlsx`, {
      bookType: "xlsx",
      type: "binary",
    });
  });
  console.log(chalk.green("✔"), "convertation to xlsx finished!");
}

process.env.hasOwnProperty("main") && toXLSX();
