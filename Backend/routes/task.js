const express = require("express");
const taskController = require("../controllers/taskController");

const router = express.Router();

// create task [PL] open state by default
router.post("/createTask", taskController.createTask);
// retrieve all tasks in a particular state
router.post("/getTasksByState", taskController.getTasksByState);
// retrieve all tasks under a particular application
router.post("/getAllTasks", taskController.getAllTasks);
// retreive a particular task details by id
router.post("/getTaskDetail", taskController.getTaskDetail);
// update task notes
router.patch("/updateTaskNotes", taskController.updateTaskNotes);

// promote task from open to todolist state [PM] (release task)
router.patch("/promoteTask2TodoList", taskController.promoteTask2TodoList);
// // promote task from todolist state to doing state [Dev] (Take on)
// router.patch("/promoteTask2Doing", taskController.promoteTask2Doing);
// // promote task from doing to done state [Dev] (request approval from PL)
// router.patch("/promoteTask2Done", taskController.promoteTask2Done);
// // promote task from doing to todo [Dev] (Give up task)
// router.patch("/promoteTask2TodoList", taskController.promoteTask2TodoList);
// // promote task from done to close [PL] (Approve task)
// router.patch("/promoteTask2Close", taskController.promoteTask2Close);
// // promote task from done to doing [PL] (Revert task state)
// router.patch("/promoteTask2DoingPL", taskController.promoteTask2DoingPL);

// default export
module.exports = router;
