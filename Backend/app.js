const express = require("express");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
// const errorHandler = require("./middleware/errorHandler");
const logger = require("morgan");

const userRouter = require("./routes/user");
const authRouter = require("./routes/auth");
const groupRouter = require("./routes/group");
const appRouter = require("./routes/app");
const planRouter = require("./routes/plan");
const taskRouter = require("./routes/task");

const app = express();
const PORT = process.env.PORT || 3000;

//setup body parser (req.body)
app.use(logger("dev"));
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/group", groupRouter);
app.use("/api/app", appRouter);
app.use("/api/plan", planRouter);
app.use("/api/task", taskRouter);

// app.use(errorHandler);

app.listen(PORT, () => {
  console.log(
    `Server started on PORT ${process.env.PORT} in ${process.env.NODE_ENV} mode`
  );
});
