const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const dateRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(\d{4})$/;
const validateDate = (date) => {
  return dateRegex.test(date);
};

module.exports = {
  createApp: async (req, res) => {
    const {
      acronym, // m string
      description, //o string
      rnumber, //m int
      startDate, //m string
      endDate, //m string
      permit_create, //o string "pl, pm"
      permit_open, //o string "pl, pm"
      permit_todolist, //o string "pl, pm"
      permit_doing, //o string "pl, pm"
      permit_done, //o string "pl, pm"
    } = req.body;

    const errors = {};

    if (!acronym) {
      errors.acronym = "Acronym is required";
    }

    if (!rnumber) {
      errors.rnumber = "Rnumber is required";
    } else if (rnumber <= 0) {
      errors.rnumber = "Rnumber must be a positive number";
    }

    if (typeof rnumber !== "number") {
      errors.rnumber = "Rnumber should be a number";
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

    if (permit_create) {
      const create_groups = permit_create.split(",");
      if (!Array.isArray(create_groups)) {
        errors.permit_create = "Invalid permit_create format";
      }
    }

    if (permit_open) {
      const open_groups = permit_open.split(",");
      if (!Array.isArray(open_groups)) {
        errors.permit_open = "Invalid permit_open format";
      }
    }

    if (permit_todolist) {
      const todolist_groups = permit_todolist.split(",");
      if (!Array.isArray(todolist_groups)) {
        errors.permit_todolist = "Invalid permit_todolist format";
      }
    }

    if (permit_doing) {
      const doing_groups = permit_doing.split(",");
      if (!Array.isArray(doing_groups)) {
        errors.permit_doing = "Invalid permit_doing format";
      }
    }

    if (permit_done) {
      const done_groups = permit_done.split(",");
      if (!Array.isArray(done_groups)) {
        errors.permit_done = "Invalid permit_done format";
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors,
        message: "Unable to create application",
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
            username: "Acronym name already exists",
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
      description, //o string
      permit_create, //o string "pl, pm"
      permit_open, //o string "pl, pm"
      permit_todolist, //o string "pl, pm"
      permit_doing, //o string "pl, pm"
      permit_done, //o string "pl, pm"
    } = req.body;

    if (!app_acronym) {
      return res.status(400).json({
        success: false,
        message: "app_acronym is required",
      });
    }

    if (
      !description &&
      !permit_create &&
      !permit_open &&
      !permit_todolist &&
      !permit_doing &&
      !permit_done
    ) {
      return res.status(200).json({
        success: true,
        message: "Application updated successfully!",
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
        message: "Application details loaded successfully",
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  getAllApps: async (req, res) => {
    try {
      const [result] = await db.query("SELECT * FROM application");

      return res.status(200).json({
        success: true,
        data: result,
        message: "All apps loaded successfully",
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },
};
