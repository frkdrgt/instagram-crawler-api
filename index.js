const express = require("express");
const puppeteer = require("puppeteer");

const PORT = process.env.PORT || 5000;

express()
  .get("/user/:user/:count", (req, res) => {
    (async () => {
      const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox']});
      const page = await browser.newPage();

      await page.setExtraHTTPHeaders({
        "Accept-Language": "en-US"
      });

      let userName = req.params.user;
      console.log(userName);

      //Set username
      await page.goto(`https://instagram.com/${userName}`, {
        waitUntil: `networkidle2`
      });

      if (await page.$(`.dialog-404`)) {
        process.exit();
      }
    
      const textContent = await page.evaluate(() => document.querySelector('span.g47SY').textContent);
      //const innerText = await page.evaluate(() => document.querySelector('span.g47SY').innerText);  Another way to get post count
      
      let postCount = parseInt(textContent.split(',').join(""));

      let maxItemsSize = req.params.count;

      let previousHeight;
      var media = new Set();
      let nodes = null;
      var urlDetails = []; //will change
      
      await page.waitFor(1000);

      if(postCount < maxItemsSize){
        res.end("You can get "+ postCount +" pictures maximum");
        browser.close();
      }
      else {
        while (maxItemsSize == null || media.size < maxItemsSize) {
          try 
          {
            
            //Scroll page
            previousHeight = await page.evaluate("document.body.scrollHeight");
            await page.evaluate(`window.scrollTo(0, ${previousHeight})`);
            //await page.waitForFunction(`document.body.scrollHeight  > ${previousHeight}`);
            await page.waitFor(1000);


            nodes = await page.evaluate(() => {
              const images = document.querySelectorAll(
                `a > div > div.KL4Bh > img`
              );
              return [].map.call(images, img => img.src);
            });

            //BEGIN TEST SECTION.
            //
            //
            //This code will change after.

            let urls = await page.evaluate(() => {
              const images = document.querySelectorAll(
                `div.v1Nh3 > a`
              );
              return [].map.call(images, img => img.href);
            });


            for(const imgUrl of urls){
              console.log(imgUrl);
              const page = await browser.newPage();
              await page.setExtraHTTPHeaders({
                "Accept-Language": "en-US"
              });
              await page.goto(imgUrl, {
                waitUntil: 'networkidle0'
              });

              const data  = await page.evaluate(() => {
                  return {
                    post:{
                      image: document.querySelector("div.KL4Bh img").getAttribute('src'),
                      description: document.querySelector("div.C4VMK span").textContent,
                      likeNumber : document.querySelector("div.Nm9Fw").textContent,
                      multipleImage: !!document.querySelector("div.coreSpriteRightChevron")
                    }
                  }
              });
              
              urlDetails.push(data);
            }
            //END TEST SECTION.
  

            nodes.forEach(element => {
              if (media.size < maxItemsSize) {
                media.add(element);
              }
            });
          } catch (error) {
            console.error(error);
            break;
          }
        }

        browser.close();
        let items = media;
  
        var tmp = [];
        items.forEach(url => {
          tmp.push({
            thumbnail_src: url,
            accessibility_caption: "",
            posts: urlDetails // for test
          });
        });
        res.send(JSON.stringify(tmp));
      }
    })();
  })
  .get("/",(req,res) => {
    res.end("Homepage");
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`));