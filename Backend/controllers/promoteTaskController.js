const db = require("../config/db");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const code = {
  auth01: "A001", // invalid username/password
  auth02: "A002", // deactivated
  auth03: "A003", // insufficient group permission
  payload01: "P001", // missing mandatory keys
  payload02: "P002", // invalid values
  payload03: "P003", // value out of range
  payload04: "P004", // invalid task state
  url01: "U001", // url dont match
  success01: "S001", // success
  error01: "E001", // general error
};

const state = {
  open: "open",
  todo: "todoList",
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
    const [existing_notes] = await db.query(
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
    await db.query(`UPDATE task SET task_notes = ? WHERE task_id = ?`, [
      updated_notes,
      task_id,
    ]);
  } catch (error) {
    throw error;
  }
};

// username: string
// groupname: array of group []
const checkgroup = async (username, groupname) => {
  try {
    const [result] = await db.query(
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

// email to notify the Project lead
const emailPL = async (task_id) => {
  try {
    // retrieve task name and user email
    const [result] = await db.query(
      `SELECT t.task_name, u.email FROM task t JOIN user u ON t.task_creator = u.username  
        WHERE task_id = ?`,
      [task_id]
    );

    // setup email data
    const recipients = result[0]?.email || "tmstest@example.com";
    const task_name = result[0]?.task_name;
    const subject = "Task Completion Notification for Approval";
    const message = `This is to inform you that the task "${task_name}" has been completed. It is now ready for your review and approval.`;

    transport
      .sendMail({
        from: "no-reply@example.com",
        to: recipients,
        subject: subject,
        text: message,
        html: message,
      })
      .then((info) => {
        console.log("email sent");
      })
      .catch((error) => {
        console.log("email sent error");
        throw error;
      });
  } catch (error) {
    throw error;
  }
};

// update the owner of the task if user performs an action
const updateTaskOwner = async (username, task_id) => {
  try {
    await db.query(`UPDATE task SET task_owner = ? WHERE task_id = ?`, [
      username,
      task_id,
    ]);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  promoteTask2Done: async (req, res) => {
    const { username, password, task_id } = req.body;

    if (!username || !password || !task_id) {
      return res.status(400).json({ code: code.payload01 });
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
          code: code.auth01, // invalid username/password
        });
      }

      // check if user is active
      if (user[0].active === 0) {
        return res.status(400).json({
          code: code.auth02, // deactivated
        });
      }

      // check if task_id exists
      const [task] = await db.query(
        `SELECT task_state, task_app_acronym FROM task WHERE task_id = ?`,
        [task_id]
      );

      if (task.length === 0) {
        console.log("INVALID TASK ID");
        return res.status(400).json({
          code: code.payload02, // invalid values
        });
      }

      const app_acronym = task[0].task_app_acronym;

      // check if user is permitted to perform actions on a task within an app
      const [group_name] = await db.query(
        `SELECT app_permit_doing FROM application WHERE app_acronym = ?`,
        [app_acronym]
      );
      
      const permit_group = group_name[0].app_permit_doing;
      console.log(permit_group);

      if (permit_group) {
        // check if user is permitted to perform the actions
        if (!(await checkgroup(username, [permit_group]))) {
          return res.status(401).json({
            code: code.auth03,
          });
        }
      } else {
        // do not let user perform any actions
        return res.status(401).json({
          code: code.auth03,
        });
      }

      // check if current state is in the "doing" state
      const task_state = task[0].task_state;
      if (task_state !== state.doing) {
        return res.status(400).json({
          code: code.payload04,
        });
      }

      await db.query(`START TRANSACTION;`);

      await db.query(
        `UPDATE task SET task_state = ? WHERE task_id = ? AND task_state = ?`,
        [state.done, task_id, state.doing]
      );

      await updateTaskOwner(username, task_id);

      await auditLog(
        actions.promoted,
        username,
        task_id,
        null,
        state.doing,
        state.done
      );

      // send email to notify Project Lead (creator)
      await emailPL(task_id);

      await db.query(`COMMIT;`);

      res.status(200).json({
        code: code.success01,
      });
    } catch (error) {
      await db.query(`ROLLBACK;`);
      console.log(error);

      return res.status(500).json({
        code: code.error01,
      });
    }
  },
};
