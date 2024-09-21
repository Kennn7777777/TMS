const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const dateRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(\d{4})$/;
const validateDate = (date) => {
  return dateRegex.test(date);
};

module.exports = {
  createPlan: async (req, res) => {
    const { mvp_name, startDate, endDate, app_acronym, colour } = req.body;
    let errors = {};

    if (!mvp_name) {
      errors.mvp_name = "MVP name is required";
    }

    if (!startDate) {
      errors.startDate = "Start date is required";
    } else if (!validateDate(startDate)) {
      errors.startDate = "Invalid date format. Please use dd-mm-yyyy.";
    }

    if (!endDate) {
      errors.endDate = "End date is required";
    } else if (!validateDate(endDate)) {
      errors.endDate = "Invalid date format. Please use dd-mm-yyyy.";
    }

    if (!app_acronym) {
      errors.app_acronym = "app_acronym is required";
    }

    if (!colour) {
      errors.colour = "colour is required";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors,
        message: "Unable to create plan",
      });
    }

    try {
      const [result] = await db.query(
        "SELECT plan_mvp_name FROM plan WHERE plan_mvp_name = ?",
        [mvp_name]
      );

      if (result.length > 0) {
        return res.status(400).json({
          success: false,
          errors: {
            mvp_name: "Plan name taken",
          },
          message: "Plan name already exists",
        });
      }

      await db.query(
        `
         INSERT INTO plan (plan_mvp_name, plan_startDate, plan_endDate, plan_app_acronym, plan_colour) 
          VALUES (?, ?, ?, ?, ?)
        `,
        [mvp_name, startDate, endDate, app_acronym, colour]
      );

      res.status(201).json({
        success: true,
        message: "Plan created successfully!",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Unable to create plan!",
      });
    }
  },

  updatePlan: async (req, res) => {
    // const { mvp_name, startDate, endDate, colour } = req.body;
    // const errors = {};
    // if (!mvp_name) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "mvp name is required",
    //   });
    // }
    // if (!startDate && !endDate && !colour) {
    //   return res.status(400).json({
    //     success: true,
    //     message: "Application updated successfully!",
    //   });
    // }
  },

  getPlan: async (req, res) => {
    const { mvp_name } = req.body;

    if (!mvp_name) {
      return res
        .status(400)
        .json({ success: false, message: "mvp name is required." });
    }

    try {
      const [result] = db.query(
        `
        SELECT * FROM plan WHERE plan_mvp_name = ?
        `,
        [mvp_name]
      );

      if (result.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "mvp name not found" });
      }

      res.status(200).json({
        success: true,
        data: result[0],
        message: "Plan details loaded successfully",
      });
    } catch (error) {}
  },

  getAllPlans: async (req, res) => {
    try {
      const [result] = await db.query("SELECT * FROM plan");

      return res.status(200).json({
        success: true,
        data: result,
        message: "All plans loaded successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Something went wrong...",
      });
    }
  },
};
