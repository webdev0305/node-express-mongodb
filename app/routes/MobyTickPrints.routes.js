module.exports = app => {
  const MobyTickPrints = require("../controllers/MobyTickPrints.controller.js");

  var router = require("express").Router();

  // Retrieve all Tutorials
  router.get("/latest_prints", MobyTickPrints.LatestPrints);
  router.post("/prints", MobyTickPrints.Prints);
  app.use("/api/mobyTickPrints", router);
};
