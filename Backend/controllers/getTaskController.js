const db = require("../config/db");
const bcrypt = require("bcryptjs");

const state = {
  open: "open",
  todo: "todoList",
  doing: "doing",
  done: "done",
  close: "close",
};

const code = {
    auth01: "A001",    // invalid username/password
    auth02: "A002",    // deactivated
    auth03: "A003",    // insufficient group permission
    payload01: "P001", // missing mandatory keys
    payload02: "P002", // invalid values
    payload03: "P003", // value out of range
    payload04: "P004", // task state error 
    url01: "U001",     // url dont match
    success01:"S001",  // success
    error01: "E001"    // general error  
}

module.exports = {
  getTasksByState: async (req, res) => {
    if (req.originalUrl !== "/api/task/getTasksByState" ) {
      return res.status(400).json({ code: code.url01 });
    }

    const { username, password, task_state, task_appAcronym } = req.body;

    // mandatory fields
    if (!username || !password || !task_state || !task_appAcronym) {
      return res.status(400).json({ code: code.payload01 }); 
    }

    // invalid task state value
    if (!Object.values(state).includes(task_state)) {
      return res.status(400).json({ code: code.payload02 }); 
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
          code: code.payload02, 
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
