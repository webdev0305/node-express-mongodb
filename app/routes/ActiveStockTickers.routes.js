module.exports = app => {
  const ActiveStockTickers = require("../controllers/ActiveStockTickers.controller.js");

  var router = require("express").Router();

  // Retrieve all Tutorials
  router.post("/upcoming_earnings", ActiveStockTickers.UpcomingEarnings);
  router.post("/upcoming_ex_dividen", ActiveStockTickers.UpcomingExDividend);
  router.post("/economicCalendar", ActiveStockTickers.EconomicCalendar);
  router.post("/getEtfsAndStocks", ActiveStockTickers.FindEtfsAndStocks);
  router.post("/getEtfHoldings", ActiveStockTickers.getEtfHoldings);
  app.use("/api/activeStockTickers", router);
};
