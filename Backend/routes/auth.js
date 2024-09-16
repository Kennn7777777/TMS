const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/login", authController.login);
router.get("/logout", authController.logout);

// default export
module.exports = router;
