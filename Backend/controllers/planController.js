const db = require("../config/db");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const validateDate = (date) => {
  return dateRegex.test(date);
};
const validateBothDate = (startDate, endDate) => {
  // endDate is not later than startDate
  if (new Date(endDate) <= new Date(startDate)) {
    return false; 
  }

  return true;
}


module.exports = {
  createPlan: async (req, res) => {
    const { mvp_name, startDate, endDate, app_acronym, colour } = req.body;
    let errors = {};

    if (!mvp_name) {
      errors.mvp_name = "Plan name is required";
    }

    if (!startDate) {
      errors.startDate = "Start date is required";
    } else if (!validateDate(startDate)) {
      errors.startDate = "Invalid date format. Please use YYYY-MM-DD.";
    } else if (!validateBothDate(startDate, endDate)) {
      errors.startDate = "Start date must be earlier than End date";
    }

    if (!endDate) {
      errors.endDate = "End date is required";
    } else if (!validateDate(endDate)) {
      errors.endDate = "Invalid date format. Please use YYYY-MM-DD.";
    } else if (!validateBothDate(startDate, endDate)) {
      errors.endDate = "End date must be later than Start date";
    }

    if (!app_acronym) {
      errors.app_acronym = "App Acronym is required";
    }

    if (!colour) {
      errors.colour = "Colour is required";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors,
        message: "Unable to create plan",
      });
    }

    try {
      // check if current plan mvp name exists within the app
      const [result] = await db.query(
        "SELECT plan_mvp_name FROM plan WHERE plan_mvp_name = ? AND plan_app_acronym = ?",
        [mvp_name, app_acronym]
      );

      if (result.length > 0) {
        return res.status(400).json({
          success: false,
          errors: {
            mvp_name: "Plan name already exists",
          },
          message: "Unable to create plan!",
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
    const { mvp_name, app_acronym, startDate, endDate, colour } = req.body;
    const errors = {};

    if (!mvp_name) {
      errors.mvp_name = "Plan name is required";
    }

    if (!app_acronym) {
      errors.app_acronym = "App Acronym is required";
    }

    if (!startDate) {
      errors.startDate = "Start date is required";
    } else if (!validateDate(startDate)) {
      errors.startDate = "Invalid date format. Please use YYYY-MM-DD.";
    } else if (!validateBothDate(startDate, endDate)) {
      errors.startDate = "Start date must be earlier than End date";
    }

    if (!endDate) {
      errors.endDate = "End date is required";
    } else if (!validateDate(endDate)) {
      errors.endDate = "Invalid date format. Please use YYYY-MM-DD.";
    } else if (!validateBothDate(startDate, endDate)) {
      errors.endDate = "End date must be later than Start date";
    }

    if (!colour) {
      errors.colour = "Colour is required";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors,
        message: "Unable to update plan",
      });
    }

    // if (!startDate && !endDate && !colour) {
    //   return res.status(200).json({
    //     success: true,
    //     message: "Plan updated successfully!",
    //   });
    // }

    try {
      // check if current plan mvp name exists within the app
      const [plan_exists] = await db.query(
        "SELECT plan_mvp_name FROM plan WHERE plan_mvp_name = ? AND plan_app_acronym = ?",
        [mvp_name, app_acronym]
      );

      if (plan_exists.length === 0) {
        return res.status(400).json({
          success: false,
          errors: {
            mvp_name: "Plan name does not exists",
          },
          message: "Unable to update plan!",
        });
      }

      const [result] = await db.query(
        `UPDATE plan SET plan_startDate = ?, plan_endDate = ?, plan_colour = ?
        WHERE plan_mvp_name = ? AND plan_app_acronym = ?
        `,
        [startDate, endDate, colour, mvp_name, app_acronym]
      );

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "MVP name not found" });
      }

      res.status(200).json({
        success: true,
        message: "Plan updated successfully!",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Unable to update plan",
      });
    }
  },

  getPlan: async (req, res) => {
    const { mvp_name, app_acronym } = req.body;

    if (!mvp_name || !app_acronym) {
      return res.status(400).json({
        success: false,
        message: "Both mvp name and app_cronym is required.",
      });
    }

    try {
      const [result] = await db.query(
        `
        SELECT * FROM plan WHERE plan_mvp_name = ? AND plan_app_acronym = ?
        `,
        [mvp_name, app_acronym]
      );

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "mvp name or app acronym not found",
        });
      }

      res.status(200).json({
        success: true,
        data: result[0],
        message: "Plan details loaded successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Unable to retrieve plan",
      });
    }
  },

  getAllPlans: async (req, res) => {
    const { app_acronym } = req.body;

    if (!app_acronym) {
      return res.status(400).json({
        success: false,
        message: "App acronym is required.",
      });
    }

    try {
      const [result] = await db.query(
        "SELECT plan_mvp_name FROM plan WHERE plan_app_acronym = ?",
        [app_acronym]
      );

      return res.status(200).json({
        success: true,
        data: result,
        message: "All plans loaded successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Unable to retrieve all plans",
      });
    }
  },
};
