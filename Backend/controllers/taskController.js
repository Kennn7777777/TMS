const db = require("../config/db");
const { checkgroup } = require("../middleware/authMiddleware");
const nodemailer = require("nodemailer");

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

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
    const recipients = result[0]?.email || "tmstest@mailinator.com";
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
const auditLog = async (action, username, task_id, notes, prev_state, curr_state, prev_plan, curr_plan) => {
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

    if (existing_notes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Task id not found",
      });
    }

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
  createTask: async (req, res) => {
    const { name, description, notes, plan, app_acronym, creator, owner } =
      req.body;

    const errors = {};

    if (!name) {
      errors.name = "Name is required";
    }

    if (!app_acronym) {
      errors.acronym = "Application acroynm is required";
    }

    if (!creator) {
      errors.creator = "Creator is required";
    }

    if (!owner) {
      errors.owner = "Owner is required";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors,
        message: "Unable to create task",
      });
    }

    try {
      await db.query(`START TRANSACTION;`);

      // check if app_acronym exists
      const [app_name] = await db.query(
        "SELECT app_acronym FROM application WHERE app_acronym = ?",
        [app_acronym]
      );

      if (app_name.length === 0) {
        return res.status(400).json({
          success: false,
          errors: {
            acronym: "Application acronym does not exists",
          },
          message: "Unable to create task!",
        });
      }

      // check if task name already exists within application
      const [task_name] = await db.query(
        `SELECT task_name FROM task WHERE task_app_acronym = ? AND task_name = ?`,
        [app_acronym, name]
      );

      if (task_name.length > 0) {
        return res.status(400).json({
          success: false,
          errors: {
            name: "Task name already exists",
          },
          message: "Unable to create task!",
        });
      }

      // generate task id
      // fetch r number from application
      const [app_rnumber] = await db.query(
        `SELECT app_rnumber FROM application WHERE app_acronym = ?`,
        [app_acronym]
      );

      if (app_rnumber.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Application acronym not found" });
      }

      // increment r_number by 1
      const rnumber = app_rnumber[0].app_rnumber + 1;

      // generate task_id <app_acronym>_<app_rnumber>
      const task_id = `${app_acronym}_${rnumber}`;

      // update app_rnumber
      await db.query(
        `UPDATE application SET app_rnumber = ? WHERE app_acronym = ?`,
        [rnumber, app_acronym]
      );

      const createdDate = getCurrDate();

      // create a new task using the newly generated task_id
      await db.query(
        `INSERT INTO task
        (task_id, task_name, task_description, task_plan, 
        task_app_acronym, task_creator, task_owner, task_createdDate) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          task_id,
          name,
          description || null,
          plan || null,
          app_acronym,
          creator,
          owner,
          createdDate,
        ]
      );

      await auditLog(
        actions.create,
        req.username,
        task_id,
        notes,
        null,
        state.open
      );
      await db.query(`COMMIT;`);

      res.status(201).json({
        success: true,
        data: rnumber,
        message: "Task created successfully!",
      });
    } catch (error) {
      await db.query(`ROLLBACK;`);
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Unable to create task!",
      });
    }
  },

  getTasksByState: async (req, res) => {
    const { state, app_acronym } = req.body;

    if (!state || !app_acronym) {
      return res.status(400).json({
        success: false,
        message: "Both task state and app acronym is required",
      });
    }

    try {
      const [result] = await db.query(
        `SELECT t.task_id, t.task_name, t.task_description, t.task_owner, p.plan_colour
        FROM task t
        LEFT JOIN plan p ON t.task_plan = p.plan_mvp_name AND t.task_app_acronym = p.plan_app_acronym
        WHERE t.task_state = ? AND t.task_app_acronym = ?
        `,
        [state, app_acronym]
      );

      if (result.length === 0) {
        return res.status(200).json({
          success: true,
          data: result,
          message: "No tasks retrieved...",
        });
      }

      res.status(200).json({
        success: true,
        data: result,
        message: "All tasks retrieved successfully!",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Unable to retrieve tasks!",
      });
    }
  },

  getAllTasks: async (req, res) => {
    const { app_acronym } = req.body;

    if (!app_acronym) {
      return res.status(400).json({
        success: false,
        message: "App acronym is required",
      });
    }

    try {
      const [result] = await db.query(
        `SELECT t.task_state, 
        GROUP_CONCAT(t.task_id SEPARATOR ', ') AS task_ids, 
        GROUP_CONCAT(t.task_name SEPARATOR ', ') AS task_names, 
        GROUP_CONCAT(IFNULL(t.task_description, '') SEPARATOR ', ') AS task_descriptions, 
        GROUP_CONCAT(t.task_owner SEPARATOR ', ') AS task_owners, 
        GROUP_CONCAT(IFNULL(p.plan_colour, "") SEPARATOR ', ') AS plan_colours 
        FROM task t 
        LEFT JOIN plan p ON t.task_plan = p.plan_mvp_name AND t.task_app_acronym = p.plan_app_acronym 
        WHERE t.task_app_acronym = ? 
        GROUP BY t.task_state
        `,
        [app_acronym]
      );

      if (result.length === 0) {
        res.status(200).json({
          success: true,
          data: result,
          message: "No tasks retrieved...",
        });
      }

      res.status(200).json({
        success: true,
        data: result,
        message: "All tasks retrieved successfully!",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Unable to retrieve tasks!",
      });
    }
  },

  getTaskDetail: async (req, res) => {
    const { task_id } = req.body;

    if (!task_id) {
      return res.status(400).json({
        success: false,
        message: "Task id is required",
      });
    }

    try {
      const [result] = await db.query(`SELECT * FROM task WHERE task_id = ?`, [
        task_id,
      ]);

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Task id not found",
        });
      }

      // get current task state
      const task_state = result[0].task_state;
      const allowActions = [];

      if (task_state !== state.close) {
        const app_acronym = result[0].task_app_acronym;
        const app_permit_state = `app_permit_${task_state}`;

        // get permitted group for this current state
        const [group_name] = await db.query(
          `SELECT ${app_permit_state} FROM application WHERE app_acronym = ?`,
          [app_acronym]
        );

        const permit_group = group_name[0][app_permit_state];

        if (permit_group) {
          // user is permitted to perform the actions
          if (await checkgroup(req.username, [permit_group])) {
            if (task_state === state.open) {
              allowActions.push(actions.promoted, actions.plan, actions.notes);
            } else if (task_state === state.todo) {
              allowActions.push(actions.promoted, actions.notes);
            } else if (task_state === state.doing) {
              allowActions.push(
                actions.demoted,
                actions.promoted,
                actions.notes
              );
            } else if (task_state === state.done) {
              allowActions.push(
                actions.demoted,
                actions.promoted,
                actions.plan,
                actions.notes
              );
            }
          }
        }
      }

      res.status(200).json({
        success: true,
        data: result[0],
        allowActions: allowActions,
        message: "Task details retrieved successfully!",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Unable to retrieve task details!",
      });
    }
  },

  updateTaskNotes: async (req, res) => {
    const { task_id, notes, curr_state } = req.body;

    if (!task_id) {
      return res.status(400).json({
        success: false,
        message: "Task id is required",
      });
    }

    try {
      await updateTaskOwner(req.username, task_id);

      await auditLog(
        actions.notes,
        req.username,
        task_id,
        notes,
        null,
        curr_state
      );

      res.status(200).json({
        success: true,
        message: "Task notes updated successfully!",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Unable to retrieve task details!",
      });
    }
  },

  updateTaskPlan: async (req, res) => {
    const { task_id, prev_plan, plan, curr_state } = req.body;

    if (!task_id) {
      return res.status(400).json({
        success: false,
        message: "Task id is required",
      });
    }

    try {
      const [result] = await db.query(
        `UPDATE task SET task_plan = ? WHERE task_id = ?`,
        [plan, task_id]
      );

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Task id not found",
        });
      }

      await updateTaskOwner(req.username, task_id);

      await auditLog(
        actions.plan,
        req.username,
        task_id,
        null,
        null,
        curr_state,
        prev_plan,
        plan
      );

      res.status(200).json({
        success: true,
        message: "Task details updated successfully!",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Unable to update task details!",
      });
    }
  },

  promoteTask2TodoList: async (req, res) => {
    const { task_id } = req.body;

    if (!task_id) {
      return res.status(400).json({
        success: false,
        message: "Task id is required",
      });
    }

    try {
      const [result] = await db.query(
        `UPDATE task SET task_state = ? WHERE task_id = ? AND task_state = ?`,
        [state.todo, task_id, state.open]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Task id not found or task is not the "open" state',
        });
      }

      await updateTaskOwner(req.username, task_id);

      await auditLog(
        actions.promoted,
        req.username,
        task_id,
        null,
        state.open,
        state.todo
      );

      res.status(200).json({
        success: true,
        message: "Task state promoted successfully!",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Unable to update task state!",
      });
    }
  },

  promoteTask2Doing: async (req, res) => {
    const { task_id } = req.body;

    if (!task_id) {
      return res.status(400).json({
        success: false,
        message: "Task id is required",
      });
    }

    try {
      const [result] = await db.query(
        `UPDATE task SET task_state = ? WHERE task_id = ? AND task_state = ?`,
        [state.doing, task_id, state.todo]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Task id not found or task is not in the "todo" state',
        });
      }

      await updateTaskOwner(req.username, task_id);

      await auditLog(
        actions.promoted,
        req.username,
        task_id,
        null,
        state.todo,
        state.doing
      );

      res.status(200).json({
        success: true,
        message: "Task state promoted successfully!",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Unable to update task state!",
      });
    }
  },

  promoteTask2Done: async (req, res) => {
    const { task_id } = req.body;

    if (!task_id) {
      return res.status(400).json({
        success: false,
        message: "Task id is required",
      });
    }

    try {
      const [result] = await db.query(
        `UPDATE task SET task_state = ? WHERE task_id = ? AND task_state = ?`,
        [state.done, task_id, state.doing]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Task id not found or task is not the "doing" state',
        });
      }

      await updateTaskOwner(req.username, task_id);

      await auditLog(
        actions.promoted,
        req.username,
        task_id,
        null,
        state.doing,
        state.done
      );

      // send email to notify Project Lead (creator)
      await emailPL(task_id);

      res.status(200).json({
        success: true,
        message: "Task state promoted successfully!",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Unable to update task state!",
      });
    }
  },

  demoteTask2TodoList: async (req, res) => {
    const { task_id } = req.body;

    if (!task_id) {
      return res.status(400).json({
        success: false,
        message: "Task id is required",
      });
    }

    try {
      const [result] = await db.query(
        `UPDATE task SET task_state = ? WHERE task_id = ? AND task_state = ?`,
        [state.todo, task_id, state.doing]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Task id not found or task is not the "doing" state',
        });
      }

      await updateTaskOwner(req.username, task_id);

      await auditLog(
        actions.demoted,
        req.username,
        task_id,
        null,
        state.doing,
        state.todo
      );

      res.status(200).json({
        success: true,
        message: "Task state demoted successfully!",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Unable to update task state!",
      });
    }
  },

  promoteTask2Close: async (req, res) => {
    const { task_id } = req.body;

    if (!task_id) {
      return res.status(400).json({
        success: false,
        message: "Task id is required",
      });
    }

    try {
      const [result] = await db.query(
        `UPDATE task SET task_state = ? WHERE task_id = ? AND task_state = ?`,
        [state.close, task_id, state.done]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Task id not found or task state is not in the "done" state',
        });
      }

      await updateTaskOwner(req.username, task_id);

      await auditLog(
        actions.promoted,
        req.username,
        task_id,
        null,
        state.done,
        state.close
      );

      res.status(200).json({
        success: true,
        message: "Task state promoted successfully!",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Unable to update task state!",
      });
    }
  },

  demoteTask2Doing: async (req, res) => {
    const { task_id } = req.body;

    if (!task_id) {
      return res.status(400).json({
        success: false,
        message: "Task id is required",
      });
    }

    try {
      const [result] = await db.query(
        `UPDATE task SET task_state = ? WHERE task_id = ? AND task_state = ?`,
        [state.doing, task_id, state.done]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Task id not found or task is not in "done" state',
        });
      }

      await updateTaskOwner(req.username, task_id);

      await auditLog(
        actions.demoted,
        req.username,
        task_id,
        null,
        state.done,
        state.doing
      );

      res.status(200).json({
        success: true,
        message: "Task state demoted successfully!",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Unable to update task state!",
      });
    }
  },

  getAppPermitCreate: async (req, res) => {
    const { app_acronym } = req.body;

    if (!app_acronym) {
      return res.status(400).json({
        success: false,
        message: "App acronym is required",
      });
    }

    try {
      const [group_name] = await db.query(
        `SELECT app_permit_create FROM application WHERE app_acronym = ?
        `,
        [app_acronym]
      );

      const permit_group = group_name[0].app_permit_create;

      if (permit_group) {
        if (await checkgroup(req.username, [permit_group])) {
          return res.status(200).json({
            success: true,
            isPermitCreate: true,
            message: "Retrieve app permit group successfully!",
          });
        }
      }

      res.status(200).json({
        success: true,
        isPermitCreate: false,
        message: "Retrieve app permit group successfully!",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Unable to retrieve app permit group!",
      });
    }
  },


  ///////////////////////////////////////////////////
  createTask2: async (req, res) => {
    const { name, description, notes, plan, app_acronym, creator, owner } =
      req.body;

    const errors = {};

    if (!name) {
      errors.name = "Name is required";
    }

    if (!app_acronym) {
      errors.acronym = "Application acroynm is required";
    }

    if (!creator) {
      errors.creator = "Creator is required";
    }

    if (!owner) {
      errors.owner = "Owner is required";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors,
        message: "Unable to create task",
      });
    }

    try {
      await db.query(`START TRANSACTION;`);

      // check if app_acronym exists
      const [app_name] = await db.query(
        "SELECT app_acronym FROM application WHERE app_acronym = ?",
        [app_acronym]
      );

      if (app_name.length === 0) {
        return res.status(400).json({
          success: false,
          errors: {
            acronym: "Application acronym does not exists",
          },
          message: "Unable to create task!",
        });
      }

      // check if task name already exists within application
      const [task_name] = await db.query(
        `SELECT task_name FROM task WHERE task_app_acronym = ? AND task_name = ?`,
        [app_acronym, name]
      );

      if (task_name.length > 0) {
        return res.status(400).json({
          success: false,
          errors: {
            name: "Task name already exists",
          },
          message: "Unable to create task!",
        });
      }

      // generate task id
      // fetch r number from application
      const [app_rnumber] = await db.query(
        `SELECT app_rnumber FROM application WHERE app_acronym = ?`,
        [app_acronym]
      );

      if (app_rnumber.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Application acronym not found" });
      }

      // increment r_number by 1
      const rnumber = app_rnumber[0].app_rnumber + 1;

      // generate task_id <app_acronym>_<app_rnumber>
      const task_id = `${app_acronym}_${rnumber}`;

      // update app_rnumber
      await db.query(
        `UPDATE application SET app_rnumber = ? WHERE app_acronym = ?`,
        [rnumber, app_acronym]
      );

      const createdDate = getCurrDate();

      // create a new task using the newly generated task_id
      await db.query(
        `INSERT INTO task
        (task_id, task_name, task_description, task_plan, 
        task_app_acronym, task_creator, task_owner, task_createdDate) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          task_id,
          name,
          description || null,
          plan || null,
          app_acronym,
          creator,
          owner,
          createdDate,
        ]
      );

      await auditLog(
        actions.create,
        req.username,
        task_id,
        notes,
        null,
        state.open
      );
      await db.query(`COMMIT;`);

      res.status(201).json({
        success: true,
        data: rnumber,
        message: "Task created successfully!",
      });
    } catch (error) {
      await pool.query(`ROLLBACK;`);
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Unable to create task!",
      });
    }
  },
  getTasksByState2: async (req, res) => {
    const { state, app_acronym } = req.body;

    if (!state || !app_acronym) {
      return res.status(400).json({
        success: false,
        message: "Both task state and app acronym is required",
      });
    }

    try {
      const [result] = await db.query(
        `SELECT t.task_id, t.task_name, t.task_description, t.task_owner, p.plan_colour
        FROM task t
        LEFT JOIN plan p ON t.task_plan = p.plan_mvp_name AND t.task_app_acronym = p.plan_app_acronym
        WHERE t.task_state = ? AND t.task_app_acronym = ?
        `,
        [state, app_acronym]
      );

      if (result.length === 0) {
        return res.status(200).json({
          success: true,
          data: result,
          message: "No tasks retrieved...",
        });
      }

      res.status(200).json({
        success: true,
        data: result,
        message: "All tasks retrieved successfully!",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Unable to retrieve tasks!",
      });
    }
  },
  promoteTask2Done2: async (req, res) => {
    const { task_id } = req.body;

    if (!task_id) {
      return res.status(400).json({
        success: false,
        message: "Task id is required",
      });
    }

    try {
      const [result] = await db.query(
        `UPDATE task SET task_state = ? WHERE task_id = ? AND task_state = ?`,
        [state.done, task_id, state.doing]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Task id not found or task is not the "doing" state',
        });
      }

      await updateTaskOwner(req.username, task_id);

      await auditLog(
        actions.promoted,
        req.username,
        task_id,
        null,
        state.doing,
        state.done
      );

      // send email to notify Project Lead (creator)
      await emailPL(task_id);

      res.status(200).json({
        success: true,
        message: "Task state promoted successfully!",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Unable to update task state!",
      });
    }
  },
};
