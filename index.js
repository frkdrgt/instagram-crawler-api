var express = require("express");
const PORT = process.env.PORT || 5000

express()
  .get('/', (req, res) => res.end('Hello World!'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))