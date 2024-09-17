const db = require("../config/db");

const groupRegex = /^[\w]+$/;
const validateGroup = (group) => {
  return groupRegex.test(group);
};

module.exports = {
  createGroup: async (req, res) => {
    const { groupName } = req.body;

    if (!groupName) {
      return res.status(400).json({
        success: false,
        errors: {
          group: "Group name is required",
        },
        message: "Unable to create group",
      });
    }

    if (!validateGroup(groupName)) {
      return res.status(400).json({
        success: false,
        errors: {
          group: "Invalid group name",
        },
        message: "Unable to create group",
      });
    }

    try {
      // throw Error("something went wrong");
      const [result] = await db.execute(
        `SELECT group_name FROM group_list WHERE group_name = ?`,
        [groupName]
      );

      if (result.length > 0) {
        return res.status(400).json({
          success: false,
          errors: {
            group: "Group name already exists",
          },
          message: "Unable to create group",
        });
      }

      await db.execute("INSERT INTO group_list (group_name) VALUES(?)", [
        groupName,
      ]);

      res
        .status(201)
        .json({ success: true, message: "New group created successfully!" });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  getAllGroups: async (req, res) => {
    try {
      const [result] = await db.query("SELECT * FROM group_list");
      // const groups = result.map((group) => group.group_name);

      res.status(200).json({
        success: true,
        data: result,
        message: "Groups successfully loaded",
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
};
