import cheerio from "cheerio";
import fs from "fs";
import chalk from "chalk";

export const DIR_CATS = __dirname + "/scraped-data";

export function randomInteger(min, max) {
  let rand = min + Math.random() * (max + 1 - min);
  return Math.floor(rand);
}

export function parseLanguages(content, houdiniMode) {
  try {
    if (typeof content !== "string") {
      throw TypeError("content is not a String");
    }
    if (typeof houdiniMode !== "boolean") {
      throw TypeError("houdiniMode is not a Boolean");
    }

    const $ = cheerio.load(content);
    const languages = [];

    if (houdiniMode) {
      $("option").each((i, el) => {
        languages.push(el.attribs["value"]);
      });
    } else {
      $("a").each((i, el) => {
        languages.push(el.attribs["data-purpose"]);
      });
    }
    console.log(chalk.cyan("parseLanguages: success"));
    return languages;
  } catch (err) {
    throw err;
  }
}

export function saveLanguages(languages) {
  try {
    if (!(languages instanceof Array)) {
      throw TypeError("languages is not a Array");
    }

    fs.writeFile("./languages.json", JSON.stringify(languages), function (
      err,
      data
    ) {
      if (err) throw err;
    });
    console.log(chalk.cyan("saveLanguages: success"));
  } catch (err) {
    throw err;
  }
}

export function readLanguages(savedCats) {
  try {
    const fileExists = fs.existsSync("./languages.json");
    if (fileExists) {
      let languages = JSON.parse(fs.readFileSync("./languages.json", "utf8"));
      if (!(languages instanceof Array)) {
        throw TypeError("languages is not a Array");
      }
      console.log(chalk.cyan("readLanguages: success"));
      languages = languages.filter(
        (lang) => !savedCats.find((item) => item == lang)
      );
      return languages;
    } else {
      return [];
    }
  } catch (err) {
    throw err;
  }
}

export function getCurrentDateTime() {
  const currentdate = new Date();
  return (
    currentdate.getHours() +
    ":" +
    currentdate.getMinutes() +
    ":" +
    currentdate.getSeconds()
  );
}

export function parseCategories(content, houdiniMode) {
  const $ = cheerio.load(content);
  const navCatColection = $("a[class=js-side-nav-cat]");

  const parsedCatList = [];
  for (let i = 0; i < navCatColection.length; i++) {
    const cat = navCatColection[i],
      parsedCat = {
        text: cat.firstChild.data,
        href: cat.attribs["href"],
        subCatList: [],
      };

    const divCollection = cat.nextSibling.nextSibling.children;
    const subCatList = [];
    for (let j = 0; j < divCollection.length; j++) {
      if (
        divCollection[j].attribs &&
        divCollection[j].attribs.class == "js-side-nav-cat js-subcat"
      ) {
        subCatList.push({
          text: divCollection[j].firstChild.data,
          href: divCollection[j].attribs["href"],
        });
      }
    }
    parsedCat.subCatList = subCatList;
    parsedCatList.push(parsedCat);
  }
  return parsedCatList;
}

export function saveCategories(data, lang) {
  try {
    // if (!(data instanceof Object)) {
    //   throw TypeError("saveCategories: data is not a Object");
    // }

    const files = fs.readdirSync(DIR_CATS);
    const fileExists = files.find((file) => file.includes(lang));

    if (fileExists) {
      console.log(chalk.cyan(`saveCategories: ${lang}.json is exists`));
    } else {
      fs.writeFile(
        `${DIR_CATS}/${lang}.json`,
        JSON.stringify(data),
        (err, data) => {
          if (err) throw err;
          console.log(chalk.cyan(`saveCategories: ${lang}.json is saved`));
        }
      );
    }
  } catch (err) {
    throw err;
  }
}

export function readCategoires() {
  try {
    const fileExists = fs.existsSync("./categories.json");
    if (fileExists) {
      const categories = JSON.parse(
        fs.readFileSync("./categories.json", "utf8")
      );
      if (!(categories instanceof Object)) {
        throw TypeError("categories is not a Object");
      }
      console.log(chalk.cyan("readCategoires: success"));
      return categories;
    } else {
      return {};
    }
  } catch (err) {
    throw err;
  }
}

export function initCatsDir() {
  try {
    if (!fs.existsSync(DIR_CATS)) {
      fs.mkdirSync(DIR_CATS);
      console.log(chalk.cyan("initCatsDir: dir is created"));
    } else {
      console.log(chalk.cyan("initCatsDir: don't need to create a dir"));
    }
  } catch (err) {
    throw err;
  }
}

export function getSavedCats() {
  const files = fs.readdirSync(DIR_CATS);
  return files.map((file) => file.split(".").shift());
}
