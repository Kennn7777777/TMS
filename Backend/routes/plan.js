const express = require("express");
const planController = require("../controllers/planController");

const router = express.Router();

router.post("/createPlan", planController.createPlan);
router.patch("/updatePlan", planController.updatePlan);
router.get("/getAllPlans", planController.getAllPlans);

// default export
module.exports = router;
