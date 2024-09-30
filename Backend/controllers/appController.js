const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const appRegex = /^[\w]+$/;

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

const validateAcronym = (app) => {
  return appRegex.test(app);
};

module.exports = {
  createApp: async (req, res) => {
    const {
      acronym, 
      description,
      rnumber, 
      startDate, 
      endDate, 
      permit_create, 
      permit_open, 
      permit_todolist, 
      permit_doing, 
      permit_done,
    } = req.body;

    const errors = {};

    if (!acronym) {
      errors.acronym = "App Acronym is required";
    }

    if (!validateAcronym(acronym)) {
      return res.status(400).json({
        success: false,
        errors: {
          acronym: "Invalid app acronym. It can only consist of alphanumeric characters and underscores.",
        },
        message: "Unable to create application!",
      });
    }

    if (!rnumber && rnumber !== 0) {
      errors.rnumber = "R number is required";
    } else {
      if (rnumber <= 0) {
        errors.rnumber = "R number must be a positive number";
      } else if (typeof rnumber !== "number") {
        errors.rnumber = "R number should be a number";
      }
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

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors,
        message: "Unable to create application!",
      });
    }

    try {
      // check if acronym exists
      const [app_name] = await db.query(
        "SELECT app_acronym FROM application WHERE app_acronym = ?",
        [acronym]
      );

      if (app_name.length > 0) {
        return res.status(400).json({
          success: false,
          errors: {
            acronym: "Acronym name already exists",
          },
          message: "Unable to create application!",
        });
      }

      await db.query(
        `
            INSERT INTO application 
            (app_acronym, app_description, app_rnumber, app_startDate, app_endDate, 
            app_permit_create, app_permit_open, app_permit_todoList, app_permit_doing, app_permit_done) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          acronym,
          description || null,
          rnumber,
          startDate,
          endDate,
          permit_create || null,
          permit_open || null,
          permit_todolist || null,
          permit_doing || null,
          permit_done || null,
        ]
      );

      res.status(201).json({
        success: true,
        message: "Application created successfully!",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Unable to create application!",
      });
    }
  },

  updateApp: async (req, res) => {
    const {
      app_acronym,
      description, 
      permit_create, 
      permit_open, 
      permit_todolist, 
      permit_doing, 
      permit_done,
    } = req.body;

    if (!app_acronym) {
      return res.status(400).json({
        success: false,
        message: "app_acronym is required",
      });
    }

    try {
      const [result] = await db.query(
        `UPDATE application SET 
        app_description = ?, app_permit_create = ?, 
        app_permit_open = ?, app_permit_todolist = ?, 
        app_permit_doing = ?, app_permit_done = ?
        WHERE app_acronym = ?
        `,
        [
          description || null,
          permit_create || null,
          permit_open || null,
          permit_todolist || null,
          permit_doing || null,
          permit_done || null,
          app_acronym,
        ]
      );

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Acronym name not found" });
      }

      res.status(200).json({
        success: true,
        message: "Application updated successfully!",
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  getApp: async (req, res) => {
    const { acronym } = req.body;

    if (!acronym) {
      return res
        .status(400)
        .json({ success: false, message: "Acronym is required." });
    }

    try {
      const [result] = await db.query(
        `
        SELECT * FROM application WHERE app_acronym = ?
        `,
        [acronym]
      );

      if (result.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Acronym not found" });
      }

      res.status(200).json({
        success: true,
        data: result[0],
        message: "Application details retrieved successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Unable to retrieve application!",
      });
    }
  },

  getAllApps: async (req, res) => {
    try {
      const [result] = await db.query("SELECT * FROM application");

      return res.status(200).json({
        success: true,
        data: result,
        message: "All applications retrieved successfully!",
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },
};
