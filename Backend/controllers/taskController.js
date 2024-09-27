const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

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
  const day = String(today.getDate()).padStart(2, "0"); // Get day and pad with zero if needed
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const year = today.getFullYear(); // Get the full year

  return `${day}-${month}-${year}`; // Format as DD-MM-YYYY
};

const getCurrDateTime = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0"); // Get day and pad with zero if needed
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const year = today.getFullYear(); // Get the full year

  const hours = String(today.getHours()).padStart(2, "0");
  const mins = String(today.getMinutes()).padStart(2, "0");
  const secs = String(today.getSeconds()).padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${mins}:${secs}`;
};

// audit trail in contains username, current state, date & timestamp, notes
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
    if (prev_plan) {
      actionStr += `has change task plan from "${prev_plan}" to "${curr_plan}".<br/>`;
    } else {
      actionStr += `has change task plan to "${curr_plan}".<br/>`;
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

    // append delimited and current notes to existing notes
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
    // TODO: handle errors
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

      // BEGIN TRANSACTION
      // generate task id
      // 1. fetch r number from application associated to this task
      const [app_rnumber] = await db.query(
        `SELECT app_rnumber FROM application WHERE app_acronym = ?`,
        [app_acronym]
      );

      if (app_rnumber.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Application acronym not found" });
      }

      // 2. r_number = r_number + 1
      const rnumber = app_rnumber[0].app_rnumber + 1;

      // 3. generate task_id <app_acronym>_<app_rnumber>
      const task_id = `${app_acronym}_${rnumber}`;

      // 4. update app_rnumber
      await db.query(
        `UPDATE application SET app_rnumber = ? WHERE app_acronym = ?`,
        [rnumber, app_acronym]
      );

      const createdDate = getCurrDate();

      // remove task_notes field because auditlog will add in
      const [result] = await db.query(
        `INSERT INTO task
        (task_id, task_name, task_description, task_plan, 
        task_app_acronym, task_creator, task_owner, task_createdDate) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          task_id,
          name,
          description || null,
          // notes || null,
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

      res.status(201).json({
        success: true,
        data: rnumber,
        message: "Task created successfully!",
      });
    } catch (error) {
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
        message: "Both state and app acronym is required",
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

      res.status(200).json({
        success: true,
        data: result[0],
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
      // // retrieve existing notes
      // const [existing_notes] = await db.query(
      //   `SELECT task_notes FROM task WHERE task_id = ?`,
      //   [task_id]
      // );

      // if (existing_notes.length === 0) {
      //   return res.status(404).json({
      //     success: false,
      //     message: "Task id not found",
      //   });
      // }

      // let updated_notes = notes;

      // // append delimited and current notes to existing notes
      // if (existing_notes[0].task_notes) {
      //   updated_notes = `${existing_notes[0].task_notes}§${notes}`;
      // }

      // // update db with the updated notes
      // const [result] = await db.query(
      //   `UPDATE task SET task_notes = ? WHERE task_id = ?`,
      //   [updated_notes, task_id]
      // );

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

      await auditLog(
        actions.promoted,
        req.username,
        task_id,
        null,
        state.doing,
        state.done
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
};
