const express = require("express");
const taskController = require("../controllers/taskController");

const router = express.Router();

router.post("/createTask", taskController.createTask);

// default export
module.exports = router;
