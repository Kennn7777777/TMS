const express = require("express");

const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const groupController = require("../controllers/groupController");
const appController = require("../controllers/appController");
const planController = require("../controllers/planController");
const taskController = require("../controllers/taskController");

const {
  default: verifyTokenAndAuthorize,
  permitTaskAction
} = require("../middleware/authMiddleware");

const router = express.Router();

/*---------------------------------------------------------------*/
// Authentication route
/*---------------------------------------------------------------*/
router.post("/auth/login", authController.login);
router.get("/auth/logout", authController.logout);


/*---------------------------------------------------------------*/
// User route
/*---------------------------------------------------------------*/
// create a single user [admin]
router.post("/users/createUser", verifyTokenAndAuthorize(["admin"]), userController.createUser);
// retrieve all the users [admin]
router.get("/users/getAllUsers",verifyTokenAndAuthorize(["admin"]), userController.getAllUsers);
// retrieve user information
router.get("/users/getUser", verifyTokenAndAuthorize(), userController.getUser);
// update a password
router.patch("/users/updatePassword", verifyTokenAndAuthorize(), userController.updatePassword);
// update email
router.patch("/users/updateEmail", verifyTokenAndAuthorize(), userController.updateEmail);
// update active status (deprecated)
router.patch("/users/updateActive", verifyTokenAndAuthorize(), userController.updateActive);
// update all fields [admin]
router.patch("/users/updateAll", verifyTokenAndAuthorize(["admin"]), userController.updateAll);


/*---------------------------------------------------------------*/
// Group route
/*---------------------------------------------------------------*/
// creating a group [admin]
router.post("/group/createGroup", verifyTokenAndAuthorize(["admin"]), groupController.createGroup);
// retrieve all existing groups (for dropdown)
router.get("/group/getAllGroups", verifyTokenAndAuthorize(), groupController.getAllGroups);


/*---------------------------------------------------------------*/
// Application route
/*---------------------------------------------------------------*/
router.post("/app/createApp", verifyTokenAndAuthorize(["PL", "admin"]), appController.createApp);
router.patch("/app/updateApp", verifyTokenAndAuthorize(["PL", "admin"]), appController.updateApp);
router.post("/app/getApp", verifyTokenAndAuthorize(), appController.getApp);
router.get("/app/getAllapps", verifyTokenAndAuthorize(), appController.getAllApps);


/*---------------------------------------------------------------*/
// Plan route
/*---------------------------------------------------------------*/
router.post("/plan/createPlan", verifyTokenAndAuthorize(["PM", "admin"]), planController.createPlan);
router.patch("/plan/updatePlan", verifyTokenAndAuthorize(["PM", "admin"]), planController.updatePlan);
router.post("/plan/getPlan", verifyTokenAndAuthorize(), planController.getPlan);
router.post("/plan/getAllPlans", verifyTokenAndAuthorize(), planController.getAllPlans);


/*---------------------------------------------------------------*/
// Task route
/*---------------------------------------------------------------*/
// create task [PL] open state by default
router.post("/task/createTask", verifyTokenAndAuthorize(), permitTaskAction("create"), taskController.createTask);
// retrieve all tasks in a particular state
router.post("/task/getTasksByState", verifyTokenAndAuthorize(), taskController.getTasksByState);
// retrieve all tasks under a particular application (deprecated)
router.post("/task/getAllTasks", verifyTokenAndAuthorize(), taskController.getAllTasks);
// retreive a particular task details by id
router.post("/task/getTaskDetail", verifyTokenAndAuthorize(), taskController.getTaskDetail);
// update task notes
router.patch("/task/updateTaskNotes", verifyTokenAndAuthorize(), permitTaskAction(), taskController.updateTaskNotes);
// update task plan
router.patch("/task/updateTaskPlan", verifyTokenAndAuthorize(), permitTaskAction(), taskController.updateTaskPlan);
// promote task from open to todolist state [PM] (release task)
router.patch("/task/promoteTask2TodoList", verifyTokenAndAuthorize(), permitTaskAction(), taskController.promoteTask2TodoList);
// promote task from todolist state to doing state [Dev] (Take on)
router.patch("/task/promoteTask2Doing", verifyTokenAndAuthorize(), permitTaskAction(), taskController.promoteTask2Doing);
// promote task from doing to done state [Dev] (request approval from PL)
router.patch("/task/promoteTask2Done", verifyTokenAndAuthorize(), permitTaskAction(), taskController.promoteTask2Done);
// demote task from doing to todo [Dev] (Give up task)
router.patch("/task/demoteTask2TodoList", verifyTokenAndAuthorize(), permitTaskAction(), taskController.demoteTask2TodoList);
// promote task from done to close [PL] (Approve task)
router.patch("/task/promoteTask2Close", verifyTokenAndAuthorize(), permitTaskAction(), taskController.promoteTask2Close);
// demote task from done to doing [PL] (Revert task state)
router.patch("/task/demoteTask2Doing", verifyTokenAndAuthorize(), permitTaskAction(), taskController.demoteTask2Doing);
// retrieve app_permit_create
router.post("/task/getAppPermitCreate", verifyTokenAndAuthorize(), taskController.getAppPermitCreate);

// default export
module.exports = router;
