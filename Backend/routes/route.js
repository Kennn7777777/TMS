// const express = require("express");
// const userController = require("../controllers/userController");
// const verifyTokenAndAuthorize = require("../middleware/authMiddleware");

// const router = express.Router();

// // User
// // Create a single user [admin]
// router.post(
//   "/createUser",
//   verifyTokenAndAuthorize(["admin"]),
//   userController.createUser
// );

// // Retrieve all the users [admin]
// router.get(
//   "/getAllUsers",
//   verifyTokenAndAuthorize(["admin"]),
//   userController.getAllUsers
// );

// // get user information
// router.get("/getUser", verifyTokenAndAuthorize(), userController.getUser);

// // update a password
// router.patch(
//   "/updatePassword",
//   verifyTokenAndAuthorize(),
//   userController.updatePassword
// );

// // update email
// router.patch(
//   "/updateEmail",
//   verifyTokenAndAuthorize(),
//   userController.updateEmail
// );

// // NOT USED YET
// router.patch(
//   "/updateActive",
//   verifyTokenAndAuthorize(),
//   userController.updateActive
// );

// // update all fields [admin]
// router.patch(
//   "/updateAll",
//   verifyTokenAndAuthorize(["admin"]),
//   userController.updateAll
// );

// // Group
// // creating a group [admin]
// router.post(
//     "/createGroup",
//     verifyTokenAndAuthorize(["admin"]),
//     groupController.createGroup
//   );

//   // retrieve all existing groups (for dropdown)
//   router.get(
//     "/getAllGroups",
//     verifyTokenAndAuthorize(),
//     groupController.getAllGroups
//   );

// // default export
// module.exports = router;
