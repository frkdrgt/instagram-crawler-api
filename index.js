const express = require("express");
const CrawlerInstagram = require("./crawler.js");

const PORT = process.env.PORT || 5000;
const app = express();
app
  .get("/user/:user", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    let userName = req.params.user;
    const crawler = new CrawlerInstagram();

    const data = await crawler
      .start(`${userName}`, 10)
      .catch(error => console.error("Hata " + error));

    res.json(data.posts);
  });
  const server = app.listen(PORT, () => {	
    console.log(`Listening on ${PORT}`);	
    server.setTimeout(5000000); //Added for heroku
  });