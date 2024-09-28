const express = require("express");
const appController = require("../controllers/appController");
const {
  default: verifyTokenAndAuthorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/createApp",
  verifyTokenAndAuthorize(["PL"]),
  appController.createApp
);

router.patch(
  "/updateApp",
  verifyTokenAndAuthorize(["PL"]),
  appController.updateApp
);

router.post("/getApp", verifyTokenAndAuthorize(), appController.getApp);
router.get("/getAllapps", verifyTokenAndAuthorize(), appController.getAllApps);

// default export
module.exports = router;
