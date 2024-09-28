const express = require("express");
const taskController = require("../controllers/taskController");
const {
  default: verifyTokenAndAuthorize,
  permitTaskAction,
} = require("../middleware/authMiddleware");

const router = express.Router();

// create task [PL] open state by default
router.post(
  "/createTask",
  verifyTokenAndAuthorize(),
  permitTaskAction("create"),
  taskController.createTask
);

// retrieve all tasks in a particular state
router.post(
  "/getTasksByState",
  verifyTokenAndAuthorize(),
  taskController.getTasksByState
);

// retrieve all tasks under a particular application
router.post(
  "/getAllTasks",
  verifyTokenAndAuthorize(),
  taskController.getAllTasks
);

// retreive a particular task details by id
router.post(
  "/getTaskDetail",
  verifyTokenAndAuthorize(),
  taskController.getTaskDetail
);

// update task notes
router.patch(
  "/updateTaskNotes",
  verifyTokenAndAuthorize(),
  permitTaskAction(),
  taskController.updateTaskNotes
);

// update task plan
router.patch(
  "/updateTaskPlan",
  verifyTokenAndAuthorize(),
  permitTaskAction(),
  taskController.updateTaskPlan
);

// promote task from open to todolist state [PM] (release task)
router.patch(
  "/promoteTask2TodoList",
  verifyTokenAndAuthorize(),
  permitTaskAction(),
  taskController.promoteTask2TodoList
);

// promote task from todolist state to doing state [Dev] (Take on)
router.patch(
  "/promoteTask2Doing",
  verifyTokenAndAuthorize(),
  permitTaskAction(),
  taskController.promoteTask2Doing
);

// promote task from doing to done state [Dev] (request approval from PL)
router.patch(
  "/promoteTask2Done",
  verifyTokenAndAuthorize(),
  permitTaskAction(),
  taskController.promoteTask2Done
);

// demote task from doing to todo [Dev] (Give up task)
router.patch(
  "/demoteTask2TodoList",
  verifyTokenAndAuthorize(),
  permitTaskAction(),
  taskController.demoteTask2TodoList
);

// promote task from done to close [PL] (Approve task)
router.patch(
  "/promoteTask2Close",
  verifyTokenAndAuthorize(),
  permitTaskAction(),
  taskController.promoteTask2Close
);

// demote task from done to doing [PL] (Revert task state)
router.patch(
  "/demoteTask2Doing",
  verifyTokenAndAuthorize(),
  permitTaskAction(),
  taskController.demoteTask2Doing
);

// default export
module.exports = router;
