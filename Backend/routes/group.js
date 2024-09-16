const express = require("express");
const groupController = require("../controllers/groupController");
const verifyTokenAndAuthorize = require("../middleware/authMiddleware");

const router = express.Router();

// DONE
router.post(
  "/createGroup",
  verifyTokenAndAuthorize(["admin"]),
  groupController.createGroup
);

// DONE
// retrieve all existing groups (for dropdown)
router.get(
  "/getAllGroups",
  verifyTokenAndAuthorize(),
  groupController.getAllGroups
);

// default export
module.exports = router;
