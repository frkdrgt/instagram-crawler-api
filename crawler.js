#!/usr/bin/env node
const { promisify } = require("util");
const fs = require("fs");
const puppeteer = require("puppeteer");

const dom = require("./dom.json");

const writeFileAsync = promisify(fs.writeFile);

const CrawlerInstagram = class {
  constructor() {}

  async start(userName, postLimit) {
    this.browser = await puppeteer.launch({
      args: [
        "--lang=en-US",
        "--disk-cache-size=0",
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setExtraHTTPHeaders({
      "Accept-Language": "en-US"
    });

    await this.page.goto(`https://instagram.com/${userName}`, {
      waitUntil: "networkidle0"
    });

    if (await this.page.$(dom.notExist)) {
      process.exit();
    }

    try {
      this.dataProfile = {
        urlProfile: this.page.url(),
        ...(await this.getInfoProfile()),
        posts: await this.getDataPostProfile(postLimit)
      };
      await this.writeProfile(userName);
    } catch (error) {
      console.error(error);
      process.exit();
    }
    await this.browser.close();

    return this.dataProfile;
  }

  // Get info in profil
  async getInfoProfile() {
    return this.page.evaluate(dom => {
      return {
        numberPosts: document.querySelector(dom.numberPosts)
          ? document.querySelector(dom.numberPosts).innerText
          : null
      };
    }, dom);
  }

  // Get data for each post
  async getDataPostProfile(postLimit) {
    let numberPosts = await this.page.evaluate(dom => {
      return document.querySelector(dom.numberPosts).innerText;
    }, dom);

    const convertedNumber = parseInt(numberPosts.split(",").join(""));
    if (postLimit > convertedNumber) {
      postLimit = convertedNumber;
    }

    const listPostUrl = new Set();

    while (listPostUrl.size < Number(postLimit)) {
      const listUrl = await this.page.$$eval(dom.listPost, list =>
        list.map(n => n.getAttribute("href"))
      );

      listUrl.forEach(url => {
        if (!postLimit || (postLimit && listPostUrl.size < postLimit)) {
          listPostUrl.add(url);
        }
      });

      await this.page.evaluate(() => {
        window.scrollTo(0, 1000000);
      });
    }

    await this.page.close();

    const listPost = [];

    for (const url of listPostUrl) {
      console.log("Url => " + url);
      const page = await this.browser.newPage();

      await page.goto(`https://instagram.com${url}`, {
        waitUntil: "networkidle0"
      });

      const data = await page.evaluate(dom => {
        return {
          urlImage: document.querySelector(dom.urlImage)
            ? document.querySelector(dom.urlImage).getAttribute("src")
            : null,

          video: document.querySelector(dom.video)
            ? document.querySelector(dom.video).getAttribute("src")
            : null,

          description: document.querySelector(dom.description)
            ? document.querySelector(dom.description).textContent
            : null,

          likeNumber: document.querySelector(dom.likeNumber)
            ? document.querySelector(dom.likeNumber).textContent
            : null,

          videoViewsNumber: document.querySelector(dom.viewNumber)
            ? document.querySelector(dom.viewNumber).textContent
            : null
        };
      }, dom);

      await page.close();
      listPost.push(data);
    }
    return listPost;
  }

  async writeProfile(userName) {
    let write = writeFileAsync(
      `${userName}.json`,
      JSON.stringify(this.dataProfile, null, 2)
    );
    return write.then(x => {
      console.log("File created.");
    });
  }
};
module.exports = CrawlerInstagram;
