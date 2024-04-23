module.exports = app => {
  const ActiveStockTickers = require("../controllers/ActiveStockTickers.controller.js");

  var router = require("express").Router();

  // Retrieve all Tutorials
  router.post("/upcoming_earnings", ActiveStockTickers.UpcomingEarnings);
  router.post("/upcoming_ex_dividen", ActiveStockTickers.UpcomingExDividend);

  app.use("/api/activeStockTickers", router);
};
