const express = require("express");
const appController = require("../controllers/appController");

const router = express.Router();

router.post("/createApp", appController.createApp);
router.patch("/updateApp", appController.updateApp);
router.post("/getApp", appController.getApp);
router.get("/getAllapps", appController.getAllApps);

// default export
module.exports = router;
