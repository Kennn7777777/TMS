const express = require("express");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const tmsRouter =  require("./routes/route");

const app = express();
const PORT = process.env.PORT || 3000;

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

app.use("/api", tmsRouter);

app.use((req, res) => {
    res.status(404).json({ code: code.url01 });
});

app.listen(PORT, () => {
  console.log(
    `Server started on PORT ${process.env.PORT} in ${process.env.NODE_ENV} mode`
  );
});
