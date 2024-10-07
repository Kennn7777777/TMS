const db = require("../config/db");
const bcrypt = require("bcryptjs");

const state = {
  open: "open",
  todo: "todo",
  doing: "doing",
  done: "done",
  close: "close",
};

const code = {
  url01: "U001",     // url dont match
  auth01: "A001",    // invalid username/password
  auth02: "A002",    // deactivated
  auth03: "A003",    // insufficient group permission
  payload01: "P001", // missing mandatory keys
  trans01: "T001",   // invalid values
  trans02: "T002",   // value out of range
  trans03: "T003",   // task state error
  trans04: "T004",   // other transaction errors 
  success01:"S001",  // success
  error01: "E001"    // internal server error  
}

module.exports = {
  getTasksByState: async (req, res) => {
    
    if (req.originalUrl !== "/api/task/getTaskByState" ) {
      return res.status(400).json({ code: code.url01 });
    }

    const { username, password, task_state, task_appAcronym } = req.body;

    // mandatory fields
    if (!username || !password || !task_state || !task_appAcronym) {
      return res.status(400).json({ code: code.payload01 }); 
    }

    if (password.length > 10) {
      return res.status(400).json({ code: code.auth01 });
    }

    // invalid task state value
    if (!Object.values(state).includes(task_state)) {
      return res.status(400).json({ code: code.trans01 }); 
    }

    try {
      const [user] = await db.execute("SELECT * FROM user WHERE username = ?", [
        username,
      ]);

      if (
        !user ||
        user.length === 0 ||
        !(await bcrypt.compare(password, user[0].password))
      ) {
        return res.status(400).json({
          code: code.auth01, 
        });
      }

      // check if user is active
      if (user[0].active === 0) {
        return res.status(400).json({
          code: code.auth02, 
        });
      }

      const [acronym] = await db.execute(
        `SELECT app_acronym FROM application WHERE app_acronym = ?`,
        [task_appAcronym]
      );

      if (acronym.length === 0) {
        return res.status(400).json({
          code: code.trans01, 
        });
      }

      const [result] = await db.execute(
        `SELECT t.task_id, t.task_name, t.task_description, t.task_owner, p.plan_colour
            FROM task t
            LEFT JOIN plan p ON t.task_plan = p.plan_mvp_name AND t.task_app_acronym = p.plan_app_acronym
            WHERE t.task_state = ? AND t.task_app_acronym = ?
            `,
        [task_state, task_appAcronym]
      );

      res.status(200).json({
        data: result,
        code: code.success01,
      });
    } catch (error) {
      return res.status(500).json({
        code: code.error01,
      });
    }
  },
};
