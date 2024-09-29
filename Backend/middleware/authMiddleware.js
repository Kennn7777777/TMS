const jwt = require("jsonwebtoken");
const db = require("../config/db");

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

const checkIsActive = async (username) => {
  try {
    const [user] = await db.query(
      `
      SELECT active FROM user WHERE username = ?`,
      [username]
    );

    if (user[0].active === 1) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
};

const verifyTokenAndAuthorize = (groups = []) => {
  return async (req, res, next) => {
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        code: "ERR_AUTH",
        message:
          "Access denied. You must be authenticated to access this resource.",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET);

      // check for ip and browser agent
      if (
        !decoded ||
        decoded.browser !== req.headers["user-agent"] ||
        decoded.ipaddress !== req.ip
      )
        return res.status(401).json({
          success: false,
          code: "ERR_AUTH",
          message:
            "Access denied. You must be authenticated to access this resource.",
        });

      // maybe call again each route
      const username = decoded.username;

      //TODO: check if user is disabled
      // if (!(await checkIsActive(username))) {
      //   return res.status(401).json({
      //     success: false,
      //     code: "SOME ERROR CODE",
      //     message:
      //       "Your account is deactived! Please contact Admin!",
      //   });
      // }

      // check if user is allowed to access route (for hardcoded routes)
      // TODO: change error code and message
      if (groups.length > 0) {
        if (!(await checkgroup(username, groups))) {
          return res.status(401).json({
            success: false,
            code: "ERR_ADMIN",
            message:
              "Access denied. You must be authenticated to access this resource. (GROUP)",
          });
        }
      }

      // attached decoded token payload to request object
      req.username = username;

      // proceed to next middleware/route handler if token is valid and has the required group permission
      next();
    } catch (error) {
      // TODO: catch error message
      return res.status(401).json({
        success: false,
        code: "ERR_AUTH",
        error: "Invalid token or expired token",
      });
    }
  };
};

// check if user is permitted to perform actions (create/promote/demote/updateNotes/updatePlan)
// on a task within an application
const permitTaskAction = (action = null) => {
  return async (req, res, next) => {
    if (!action) {
      const { task_id } = req.body;

      if (!task_id) {
        return res.status(400).json({
          success: false,
          message: "Task id is required",
        });
      }

      try {
        // get the current state and app_acronym of the task
        const [task] = await db.query(
          `SELECT task_state, task_app_acronym FROM task WHERE task_id = ?`,
          [task_id]
        );

        const task_state = task[0].task_state;
        const app_acronym = task[0].task_app_acronym;
        const app_permit_state = `app_permit_${task_state}`;

        // get permitted group for this current state
        const [group_name] = await db.query(
          `SELECT ${app_permit_state} FROM application WHERE app_acronym = ?`,
          [app_acronym]
        );

        const permit_group = group_name[0][app_permit_state];
        console.log(task_state);
        console.log(app_acronym);
        console.log(app_permit_state);
        console.log(permit_group);

        if (permit_group) {
          // check if user is permitted to perform the actions
          if (!(await checkgroup(req.username, [permit_group]))) {
            return res.status(401).json({
              success: false,
              code: "SOME ERROR CODE",
              message:
                "Access denied. You do not have the permission to access this resource.",
            });
          }
        } else {
          // do not let user perform any actions
          return res.status(401).json({
            success: false,
            code: "SOME ERROR CODE",
            message:
              "Access denied. You do not have the permission to access this resource. (NULL)",
          });
        }

        next();
      } catch (error) {
        // TODO: handle errors
        console.log(error);
      }
    } else if (action === "create") {
      console.log("CREATE ACTION");
      const { app_acronym } = req.body;

      if (!app_acronym) {
        return res.status(400).json({
          success: false,
          message: "App Acronym is required",
        });
      }
      try {
        const [group_name] = await db.query(
          `SELECT app_permit_create FROM application WHERE app_acronym = ?`,
          [app_acronym]
        );

        const permit_group = group_name[0].app_permit_create;
        console.log(permit_group);

        if (permit_group) {
          // check if user is permitted to perform the actions
          if (!(await checkgroup(req.username, [permit_group]))) {
            return res.status(401).json({
              success: false,
              code: "SOME ERROR CODE",
              message:
                "Access denied. You do not have the permission to access this resource.",
            });
          }
        } else {
          // do not let user perform any actions
          return res.status(401).json({
            success: false,
            code: "SOME ERROR CODE",
            message:
              "Access denied. You do not have the permission to access this resource. (NULL)",
          });
        }

        next();
      } catch (error) {
        // TODO: handle errors
        console.log(error);
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action",
      });
    }
  };
};

module.exports = {
  default: verifyTokenAndAuthorize,
  permitTaskAction,
  checkgroup,
};
