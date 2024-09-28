const express = require("express");
const planController = require("../controllers/planController");
const {
  default: verifyTokenAndAuthorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/createPlan",
  verifyTokenAndAuthorize(["PM"]),
  planController.createPlan
);
router.patch(
  "/updatePlan",
  verifyTokenAndAuthorize(["PM"]),
  planController.updatePlan
);
router.post("/getPlan", verifyTokenAndAuthorize(), planController.getPlan);
router.post(
  "/getAllPlans",
  verifyTokenAndAuthorize(),
  planController.getAllPlans
);

// default export
module.exports = router;
