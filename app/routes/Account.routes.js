module.exports = app => {
  const Account = require("../controllers/Account.controller.js");

  var router = require("express").Router();

  // Retrieve all Tutorials
  router.post("/register", Account.Register);
  router.post("/verify_token", Account.VerifyToken);
  router.post("/login", Account.Login);

  app.use("/api/auth", router);
};
