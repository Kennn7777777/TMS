const express = require("express");
const groupController = require("../controllers/groupController");
const {
  default: verifyTokenAndAuthorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// creating a group [admin]
router.post(
  "/createGroup",
  verifyTokenAndAuthorize(["admin"]),
  groupController.createGroup
);

// retrieve all existing groups (for dropdown)
router.get(
  "/getAllGroups",
  verifyTokenAndAuthorize(),
  groupController.getAllGroups
);

// default export
module.exports = router;
