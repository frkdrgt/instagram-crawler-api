const express = require("express");
const puppeteer = require("puppeteer");
const CrawlerInstagram = require("./crawler.js");

const PORT = process.env.PORT || 5000;
const app = express();
app.get("/", async (req, res) => {
    res.setHeader("Content-Type", "application/json");

    const crawler = new CrawlerInstagram();

    const data = await crawler.start("#userName_parameter#", 50).catch(error => console.error(error));
    res.json(data.posts);
  });
  const server = app.listen(PORT, '127.0.0.1', () => {
    const { address, port } = server.address();
    console.log("Example app listening at http://%s:%s", address, port);
    server.setTimeout(500000);
});
  //.listen(PORT, () => console.log(`Listening on ${PORT}`));
