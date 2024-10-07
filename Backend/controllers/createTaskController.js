const db = require("../config/db");
const bcrypt = require("bcryptjs");

// username: string
// groupname: array of group []
const checkgroup = async (username, groupname, conn) => {
  try {
    const [result] = await conn.query(
      `SELECT group_name FROM group_list gl JOIN user_group ug ON 
          gl.group_id = ug.group_id WHERE ug.username = ? 
          AND gl.group_name IN (?)`,
      [username, groupname]
    );

    if (result.length === 0) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
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

const state = {
  open: "open",
  todo: "todo",
  doing: "doing",
  done: "done",
  close: "close",
};

const actions = {
  create: "create",
  promoted: "promoted",
  demoted: "demoted",
  notes: "notes",
  plan: "plan",
};

// get current date in the format of DD-MM-YYYY
const getCurrDate = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0"); // get day and pad with zero
  const month = String(today.getMonth() + 1).padStart(2, "0"); // get month and pad with zero
  const year = today.getFullYear();

  return `${day}-${month}-${year}`; // format as DD-MM-YYYY
};

// get current datetime in format as DD-MM-YYYY HH:MM:SS
const getCurrDateTime = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0"); // get day and pad with zero
  const month = String(today.getMonth() + 1).padStart(2, "0"); // get month and pad with zero
  const year = today.getFullYear();

  const hours = String(today.getHours()).padStart(2, "0");
  const mins = String(today.getMinutes()).padStart(2, "0");
  const secs = String(today.getSeconds()).padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${mins}:${secs}`;
};

// audit trail will log username, current state, date & timestamp, notes and plan
const auditLog = async (
  conn,
  action,
  username,
  task_id,
  notes,
  prev_state,
  curr_state,
  prev_plan,
  curr_plan
) => {
  let actionStr = `User "${username}" `;
  let stateStr = `Current state: `;
  let noteStr = undefined;

  // create task action
  if (action === actions.create) {
    actionStr += `created a new task.<br/>`;
    if (notes) {
      noteStr = `Notes:<br/>${notes}`;
    }
  }

  // promote task action
  if (action === actions.promoted) {
    actionStr += `has promoted task from "${prev_state}" state to "${curr_state}" state.<br/>`;
  }

  // demote task action
  if (action === actions.demoted) {
    actionStr += `has demoted task from "${prev_state}" state to "${curr_state}" state.<br/>`;
  }

  // update notes action
  if (action === actions.notes) {
    actionStr += `has updated task notes.<br/>`;
    if (notes) {
      noteStr = `Notes:<br/>${notes}`;
    }
  }

  // update plan action
  if (action === actions.plan) {
    if (prev_plan && curr_plan) {
      actionStr += `has change task plan from "${prev_plan}" to "${curr_plan}".<br/>`;
    } else {
      if (!prev_plan) {
        actionStr += `has updated task plan to "${curr_plan}".<br/>`;
      }

      if (!curr_plan) {
        actionStr += `has remove plan from task.<br/>`;
      }
    }
  }

  stateStr += `${curr_state}<br/>`;

  // generate date and time
  const dateTime = `<b>${getCurrDateTime()}:</b><br/>`;

  // format audit log
  const logStr = `${dateTime}${actionStr}${stateStr}${(noteStr ??= "")}`;

  try {
    // retrieve existing notes
    const [existing_notes] = await conn.query(
      `SELECT task_notes FROM task WHERE task_id = ?`,
      [task_id]
    );

    let updated_notes;

    // append delimiter and current notes to existing notes
    if (existing_notes[0].task_notes) {
      updated_notes = `${existing_notes[0].task_notes}§${logStr}`;
    } else {
      updated_notes = logStr;
    }

    // update db with the updated notes
    await conn.query(`UPDATE task SET task_notes = ? WHERE task_id = ?`, [
      updated_notes,
      task_id,
    ]);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createTask: async (req, res) => {
    if (req.originalUrl !== "/api/task/createTask") {
      return res.status(400).json({ code: code.url01 });
    }

    const {
      username,
      password,
      task_name,
      task_description,
      task_notes,
      task_plan,
      task_appAcronym,
    } = req.body;

    // mandatory fields
    if (!username || !password || !task_name || !task_appAcronym) {
      return res.status(400).json({ code: code.payload01 }); // missing mandatory keys
    }

    if (password.length > 10) {
      return res.status(400).json({ code: code.auth01 });
    }

    if (task_name && task_name.length > 64) {
      return res.status(400).json({ code: code.trans02 }); // out of range
    }

    if (task_description && task_description.length > 255) {
      return res.status(400).json({ code: code.trans02 }); // out of range
    }

    if (task_notes && task_notes.length > 65536) {
      return res.status(400).json({ code: code.trans02 }); // out of range
    }

    const conn = await db.getConnection();

    try {
      const [user] = await conn.execute(
        "SELECT * FROM user WHERE username = ?",
        [username]
      );

      if (
        !user ||
        user.length === 0 ||
        !(await bcrypt.compare(password, user[0].password))
      ) {
        return res.status(400).json({
          code: code.auth01, // invalid username/password
        });
      }

      // check if user is active
      if (user[0].active === 0) {
        return res.status(400).json({
          code: code.auth02, // deactivated
        });
      }

      // check if app_acronym exists
      const [acronym] = await conn.execute(
        `SELECT app_acronym FROM application WHERE app_acronym = ?`,
        [task_appAcronym]
      );

      if (acronym.length === 0) {
        return res.status(400).json({
          code: code.trans01, // invalid values
        });
      }

      // check if user is permitted to perform actions on a task within an app
      const [group_name] = await conn.query(
        `SELECT app_permit_create FROM application WHERE app_acronym = ?`,
        [task_appAcronym]
      );

      const permit_group = group_name[0].app_permit_create;

      if (permit_group) {
        // check if user is permitted to perform the actions
        if (!(await checkgroup(username, [permit_group], conn))) {
          return res.status(400).json({
            code: code.auth03,
          });
        }
      } else {
        // do not let user perform any actions
        return res.status(400).json({
          code: code.auth03,
        });
      }

      // check if plan exists
      if (task_plan) {
        const [plan_exist] = await conn.execute(
          "SELECT plan_mvp_name FROM plan WHERE plan_mvp_name = ? AND plan_app_acronym = ?",
          [task_plan, task_appAcronym]
        );

        if (plan_exist.length === 0) {
          return res.status(400).json({
            code: code.trans01,
          });
        }
      }
      // generate task id
      // fetch r number from application
      const [app_rnumber] = await conn.query(
        `SELECT app_rnumber FROM application WHERE app_acronym = ?`,
        [task_appAcronym]
      );

      // increment r_number by 1
      const rnumber = app_rnumber[0].app_rnumber + 1;

      // generate task_id <app_acronym>_<app_rnumber>
      const task_id = `${task_appAcronym}_${rnumber}`;

      await conn.beginTransaction();

      // update app_rnumber
      await conn.query(
        `UPDATE application SET app_rnumber = ? WHERE app_acronym = ?`,
        [rnumber, task_appAcronym]
      );

      const createdDate = getCurrDate();

      // create a new task using the newly generated task_id
      await conn.query(
        `INSERT INTO task
            (task_id, task_name, task_description, task_plan, 
            task_app_acronym, task_creator, task_owner, task_createdDate) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
        [
          task_id,
          task_name,
          task_description || null,
          task_plan || null,
          task_appAcronym,
          username,
          username,
          createdDate,
        ]
      );

      await auditLog(
        conn,
        actions.create,
        username,
        task_id,
        task_notes,
        null,
        state.open
      );

      await conn.commit();

      res.status(201).json({
        task_id: task_id,
        code: code.success01,
      });
    } catch (error) {
      await conn.rollback();

      if (error.code === "ERR_DUP_ENTRY") {
        return res.status(400).json({
          code: code.trans04,
        });
      }

      return res.status(500).json({
        code: code.error01,
      });
    } finally {
      conn.release();
    }
  },
};
