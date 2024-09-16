const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const saltRounds = 10;
// ^              - asserts start of string
// (?=.*[a-zA-Z]) - 1 alphabetic character is present
// (?=.*\d)       - 1 digit is present
// (?=.*[\W_])    - 1 special character is present
// .{8,10}        - match character between 8 to 10
// $              - asserts end of string

const regex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{8,10}$/;
const validatePassword = (password) => {
  return regex.test(password);
};

module.exports = {
  createUser: async (req, res) => {
    const { username, password, email, active, groups } = req.body; // groups = "1, 2, 3"
    let errors = {};
    // checked groups convert string into array of int
    let assignedGroup;

    if (!username) {
      errors.username = "Username is required";
    }

    if (!password) {
      errors.password = "Password is required";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors,
      });
    }

    // check for password length >= 8 & <=10, alphanumeric
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        errors: {
          password: "Password does not meet the required criteria.",
        },
      });
    }

    if (active) {
      const activeInt = parseInt(active);

      if (!Number.isInteger(activeInt) || activeInt < 0 || activeInt > 1) {
        return res.status(400).json({
          success: false,
          message: "Active should be numeric and be 0 or 1.",
        });
      }
    }

    if (groups) {
      assignedGroup = groups.split(", ").map(Number);
      if (!Array.isArray(assignedGroup)) {
        return res.status(400).json({
          success: false,
          message: "Invalid group field",
        });
      }
    }

    try {
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      await db.execute(
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
      if (error.code === "ER_DUP_ENTRY") {
        return res
          .status(409)
          .json({ success: false, message: "Username already exist." });
      }

      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // Retrieve all user information (username, email, active, group_names)
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

  getUser: async (req, res) => {
    // const { username } = req.body;

    username = req.username;

    if (!username) {
      return res.status(400).json({ message: "Username is required." });
    }

    try {
      // const [result] = await db.execute(
      //   "SELECT username, email, active FROM user WHERE username = ?",
      //   [username]
      // );

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

      res.status(200).json({
        success: true,
        data: result[0],
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
      return res.status(400).json({ success: false, errors });
    }

    if (!validatePassword(password)) {
      errors.password = "Password does not meet the required criteria.";
      return res.status(400).json({ success: false, errors });
    }

    // if (Object.keys(errors).length > 0) {
    //   return res.status(400).json({ success: false, errors });
    // }

    try {
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const [result] = await db.execute(
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
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  updateEmail: async (req, res) => {
    const { username, email } = req.body;

    if (!username) {
      return res
        .status(400)
        .json({ success: false, message: "Username is required" });
    }

    try {
      const [result] = await db.execute(
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
    // checked groups convert string into array of int
    let assignedGroup;

    if (!username) {
      return res
        .status(400)
        .json({ success: false, message: "Username is required" });
    }

    if (password && !validatePassword(password)) {
      errors.password = "Password does not meet the required criteria.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    if (active !== undefined) {
      const activeInt = parseInt(active);
      if (!Number.isInteger(activeInt) || activeInt < 0 || activeInt > 1) {
        return res.status(400).json({
          success: false,
          message: "Active should be numeric and be 0 or 1",
        });
      }
    }

    if (groups) {
      assignedGroup = groups.split(", ").map(Number);

      if (!Array.isArray(assignedGroup)) {
        return res.status(400).json({
          success: false,
          message: "Invalid group field",
        });
      }
    }

    try {
      //TODO: begin transcation here
      let query = "UPDATE user SET ";
      let arr = [email || null, active === undefined ? 1 : active, username];
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

      if (result.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      if (assignedGroup && assignedGroup.length > 0) {
        // get list of group ids the current user has (Array of Objects)
        const [grpIds] = await db.execute(
          `SELECT gl.group_id FROM group_list gl JOIN user_group ug
        ON gl.group_id = ug.group_id WHERE ug.username = ? `,
          [username]
        );
        // convert into an array of group ids (int)
        const groupIds = grpIds.map((group) => group.group_id);
        // console.log(groupIds);

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
          // const groupsToDelete = toDelete.join(", ");
          await db.query(
            "DELETE FROM user_group WHERE username = ? AND group_id IN (?)",
            [username, toDelete]
          );
        }
      }

      res.status(200).json({
        success: true,
        message: "All fields updated successfully!",
        data: groups,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  check: async (req, res) => {
    const username = "test";
    const groupname = ["group4", "group1"];

    try {
      const [result] = await db.query(
        `SELECT group_name FROM group_list gl JOIN user_group ug ON 
          gl.group_id = ug.group_id WHERE ug.username = ? 
          AND gl.group_name IN (?)`,
        [username, groupname]
      );

      if (result.length === 0) {
        // return false;
        return res.status(200).json("false");
      }

      res.status(200).json("true");
      // return true;
    } catch (error) {
      // return false;
      return res.status(200).json("false");
    }
  },
};
