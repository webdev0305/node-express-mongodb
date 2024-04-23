module.exports = app => {
  const ActiveStockTickers = require("../controllers/ActiveStockTickers.controller.js");

  var router = require("express").Router();

  // Retrieve all Tutorials
  router.get("/", ActiveStockTickers.findAll);
  router.get("/:id", ActiveStockTickers.findOne);

  app.use("/api/tickers", router);
};
