const express = require("express");
const userController = require("../controllers/userController");
const verifyTokenAndAuthorize = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/createUser",
  verifyTokenAndAuthorize(["admin"]),
  userController.createUser
);

router.get(
  "/getAllUsers",
  verifyTokenAndAuthorize(["admin"]),
  userController.getAllUsers
);

// get user information based on username in token cookie
router.get("/getUser", verifyTokenAndAuthorize(), userController.getUser);

// update a password
router.patch(
  "/updatePassword",
  verifyTokenAndAuthorize(),
  userController.updatePassword
);

// DONE
router.patch(
  "/updateEmail",
  verifyTokenAndAuthorize(),
  userController.updateEmail
);

// NOT USED YET
router.patch(
  "/updateActive",
  verifyTokenAndAuthorize(),
  userController.updateActive
);

router.patch(
  "/updateAll",
  verifyTokenAndAuthorize(["admin"]),
  userController.updateAll
);

// default export
module.exports = router;
