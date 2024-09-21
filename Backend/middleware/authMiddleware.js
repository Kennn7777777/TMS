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

      // check if user is allowed to access route
      if (groups.length > 0) {
        if (!(await checkgroup(username, groups))) {
          return res.status(401).json({
            success: false,
            code: "ERR_ADMIN",
            message:
              "Access denied. You must be authenticated to access this resource.",
          });
        }
      }

      // attached decoded token payload to request object
      req.username = username;

      // proceed to next middleware/route handler if token is valid and has the required group permission
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        code: "ERR_AUTH",
        error: "Invalid token or expired token",
      });
    }
  };
};

module.exports = verifyTokenAndAuthorize;
