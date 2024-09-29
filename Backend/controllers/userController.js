const db = require("../config/db");
const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");

const saltRounds = 10;
// ^              - asserts start of string
// (?=.*[a-zA-Z]) - 1 alphabetic character is present
// (?=.*\d)       - 1 digit is present
// (?=.*[\W_])    - 1 special character is present
// .{8,10}        - match character between 8 to 10
// $              - asserts end of string

const regex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{8,10}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const userRegex = /^[a-zA-Z0-9]+$/;

const validatePassword = (password) => {
  return regex.test(password);
};

const validateEmail = (email) => {
  return emailRegex.test(email);
};

const validateUsername = (username) => {
  return userRegex.test(username);
};

module.exports = {
  // Create a single user [Admin]
  createUser: async (req, res) => {
    const { username, password, email, active, groups } = req.body; // groups = "1, 2, 3"
    let errors = {};

    if (!username) {
      errors.username = "Username is required";
    } else if (!validateUsername(username)) {
      errors.username = "Invalid Username format";
    }

    // check for password length >= 8 & <=10, alphanumeric
    if (!password) {
      errors.password = "Password is required";
    } else if (!validatePassword(password)) {
      errors.password = "Password does not meet the required criteria.";
    }

    if (email && !validateEmail(email)) {
      errors.email = "Invalid email format";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors,
        message: "Unable to create user!",
      });
    }

    if (active) {
      if (typeof active !== "number" || active < 0 || active > 1) {
        return res.status(400).json({
          success: false,
          message: "Active should be numeric and be 0 or 1.",
        });
      }
    }

    let assignedGroup;
    if (groups) {
      assignedGroup = groups.split(", ").map(Number);
      if (!Array.isArray(assignedGroup)) {
        return res.status(400).json({
          success: false,
          message: "Invalid group format",
        });
      }
    }

    try {
      // check if username exists
      const [result] = await db.query(
        "SELECT username FROM user WHERE username = ?",
        [username]
      );

      if (result.length > 0) {
        return res.status(400).json({
          success: false,
          errors: {
            username: "Username taken",
          },
          message: "Username already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(password, saltRounds);

      await db.query(
        "INSERT INTO user (username, password, email, active) VALUES (?, ?, ?, ?)",
        [
          username,
          hashedPassword,
          email || null,
          active === undefined ? 1 : active,
        ]
      );

      if (assignedGroup && assignedGroup.length > 0) {
        const groupsToInsert = assignedGroup.map((id) => [username, id]);
        await db.query("INSERT INTO user_group (username, group_id) VALUES ?", [
          groupsToInsert,
        ]);
      }
      return res
        .status(201)
        .json({ success: true, message: "New user created successfully." });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // Retrieve all users information (username, email, active, group_names) [Admin]
  getAllUsers: async (req, res) => {
    try {
      const [result] = await db.query(`
        SELECT u.username, u.email, u.active,
        GROUP_CONCAT(gl.group_id ORDER BY gl.group_id ASC SEPARATOR ', ') AS group_ids,
        GROUP_CONCAT(gl.group_name ORDER BY gl.group_id ASC SEPARATOR ', ') AS group_names
        FROM user u
        LEFT JOIN 
        user_group ug ON u.username = ug.username
        LEFT JOIN 
        group_list gl ON ug.group_id = gl.group_id
        GROUP BY 
        u.username, u.email, u.active;
        `);

      res.status(200).json({
        success: true,
        data: result,
        message: "Users retrieved successfully!",
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Retrieve existing user information
  getUser: async (req, res) => {
    // const { username } = req.body;
    username = req.username;

    if (!username) {
      return res.status(400).json({ message: "Username is required." });
    }

    try {
      const [result] = await db.query(
        `
        SELECT u.username, u.email, u.active,
        GROUP_CONCAT(gl.group_name ORDER BY gl.group_id ASC SEPARATOR ', ') AS group_names
        FROM user u LEFT JOIN user_group ug ON 
        u.username = ug.username  
        LEFT JOIN group_list gl ON ug.group_id = gl.group_id
        WHERE u.username = ?
        GROUP BY u.username;
        `,
        [username]
      );

      if (result.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // check if user is an admin, PL, PM
      const { group_names, ...userData } = result[0];
      let isAdmin = false;
      let isPL = false;
      let isPM = false;

      if (group_names) {
        const group_arr = group_names.split(", ");
        const lowercase_group_arr = group_arr.map((str) => str.toLowerCase());
        isAdmin = lowercase_group_arr.includes("admin");
        isPL = lowercase_group_arr.includes("pl");
        isPM = lowercase_group_arr.includes("pm");
      }

      // construct data without returning the user groups
      const data = {
        ...userData,
        isAdmin: isAdmin,
        isPL: isPL,
        isPM: isPM,
      };

      res.status(200).json({
        success: true,
        data: data,
        message: "User details loaded successfully!",
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  updatePassword: async (req, res) => {
    const { username, password } = req.body;
    const errors = {};

    if (!username) {
      return res
        .status(400)
        .json({ success: false, message: "Username is required" });
    }

    if (!password) {
      errors.password = "Password is required";
      return res.status(400).json({
        success: false,
        errors,
        message: "Unable to change password!",
      });
    }

    if (!validatePassword(password)) {
      errors.password = "Password does not meet the required criteria.";
      return res.status(400).json({
        success: false,
        errors,
        message: "Unable to change password!",
      });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const [result] = await db.query(
        `UPDATE user SET password = ? WHERE username = ?`,
        [hashedPassword, username]
      );

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      res
        .status(200)
        .json({ success: true, message: "Password updated successfully!" });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  updateEmail: async (req, res) => {
    const { username, email } = req.body;
    const errors = {};

    if (!username) {
      return res
        .status(400)
        .json({ success: false, message: "Username is required" });
    }

    if (email && !validateEmail(email)) {
      errors.email = "Invalid email format";
      return res.status(400).json({
        success: false,
        errors,
        message: "Unable to update email!",
      });
    }

    try {
      const [result] = await db.query(
        `UPDATE user SET email = ? WHERE username = ?`,
        [email || null, username]
      );

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      res
        .status(200)
        .json({ success: true, message: "Email updated successfully!" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  updateActive: async (req, res) => {
    const { username, active } = req.body;
    const activeInt = parseInt(active);

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    if (!Number.isInteger(activeInt) || activeInt < 0 || activeInt > 1) {
      return res
        .status(400)
        .json({ message: "Active should be numeric and be 0 or 1" });
    }

    try {
      const [result] = await db.execute(
        "UPDATE user SET active = ? WHERE username = ?",
        [active, username]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found." });
      }

      res
        .status(200)
        .json({ message: "User active status updated successfully!" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  updateAll: async (req, res) => {
    const { username, password, email, active, groups } = req.body;
    const errors = {};

    if (!username) {
      return res
        .status(400)
        .json({ success: false, message: "Username is required" });
    }

    if (password && !validatePassword(password)) {
      errors.password = "Password does not meet the required criteria.";
    }

    if (email && !validateEmail(email)) {
      errors.email = "Invalid email format";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors,
        message: "Unable to create user!",
      });
    }

    if (active) {
      if (typeof active !== "number" || active < 0 || active > 1) {
        return res.status(400).json({
          success: false,
          message: "Active should be numeric and be 0 or 1.",
        });
      }
    }

    // checked groups is able to convert string into array of int
    let assignedGroup;
    if (groups) {
      assignedGroup = groups.split(", ").map(Number);
      if (!Array.isArray(assignedGroup)) {
        return res.status(400).json({
          success: false,
          message: "Invalid group format",
        });
      }
    }

    try {
      // check if username exists
      const [user] = await db.query(
        "SELECT username FROM user WHERE username = ?",
        [username]
      );

      if (user.length === 0) {
        return res.status(400).json({
          success: false,
          errors: {
            username: "Username is not valid",
          },
          message: "User not found",
        });
      }

      // update password (if filled), email and active
      let query = "UPDATE user SET ";
      let arr = [email || null, active === undefined ? 1 : active, username];

      // only update password param if not empty
      if (password) {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        query += "password = ?, ";
        arr = [
          hashedPassword,
          email || null,
          active === undefined ? 1 : active,
          username,
        ];
      }

      const [result] = await db.query(
        `${query} email = ?, active = ? WHERE username = ?`,
        arr
      );

      if (assignedGroup && assignedGroup.length > 0) {
        // get list of group ids the current user has (Array of Objects)
        const [grpIds] = await db.query(
          `SELECT gl.group_id FROM group_list gl JOIN user_group ug
        ON gl.group_id = ug.group_id WHERE ug.username = ? `,
          [username]
        );
        // convert into an array of group ids (int)
        const groupIds = grpIds.map((group) => group.group_id);

        // group ids that are assigned to user
        const toInsert = assignedGroup.filter((x) => !groupIds.includes(x));
        if (toInsert.length > 0) {
          const groupsToInsert = toInsert.map((id) => [username, id]);
          await db.query(
            "INSERT INTO user_group (username, group_id) VALUES ?",
            [groupsToInsert]
          );
        }

        // group ids that are remove from user (array of int)
        const toDelete = groupIds.filter((x) => !assignedGroup.includes(x));
        if (toDelete.length > 0) {
          await db.query(
            "DELETE FROM user_group WHERE username = ? AND group_id IN (?)",
            [username, toDelete]
          );
        }
      } else if (!groups) {
        await db.query("DELETE FROM user_group WHERE username = ?", [username]);
      }

      res.status(200).json({
        success: true,
        message: "User updated successfully!",
        data: groups,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
