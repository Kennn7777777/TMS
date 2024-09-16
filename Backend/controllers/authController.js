const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

module.exports = {
  login: async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
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
        return res
          .status(400)
          .json({ success: false, message: "Invalid Username or password!" });
      }

      if (user[0].active === 0) {
        return res.status(400).json({
          success: false,
          message: "Your account is deactived! Please contact Admin!",
        });
      }

      // create token using username, ip, user-agent(browser type)
      const token = jwt.sign(
        {
          username: username,
          ipaddress: req.ip,
          browser: req.headers["user-agent"],
        },
        process.env.JWT_TOKEN_SECRET,
        {
          expiresIn: "24h",
        }
      );

      // browser store cookie
      res.cookie(process.env.JWT_TOKEN_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        token,
        username: username,
        message: "Login successfully",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  logout: (req, res) => {
    res.clearCookie(process.env.JWT_TOKEN_NAME);
    // res.cookie('access_token', {httpOnly: true, maxAge:0});
    res.status(200).json({ success: true, message: "Logout successfully" });
  },
};
