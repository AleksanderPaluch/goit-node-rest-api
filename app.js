import express from "express";
import morgan from "morgan";
import cors from "cors";
import path from "node:path";
import cookieParser from "cookie-parser";
import chalk from "chalk";

import "./routes/db.js";

import usersRouter from "./routes/usersRouter.js";
import waterRouter from "./routes/waterRouter.js";


// Updated chalk usage
const errorMsg = chalk.bgWhite.redBright;
const successMsg = chalk.bgGreen.white;

const app = express();

const corsOptions = {
  // origin: "https://water-tracker-app.vercel.app",
  origin: ["http://localhost:5173"],
  credentials: true,
};

app.use(morgan("tiny"));
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use("/users", usersRouter);
app.use("/water", waterRouter);
app.use("/avatars", express.static(path.resolve("public/avatars")));

// Handle 404 - Route not found
app.use((_, res) => {
  console.log(errorMsg("Route not found - 404"));
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  const { status = 500, message = "Server error" } = err;
  console.log(errorMsg(`Error: ${message}, Status: ${status}`));
  return res.status(status).json({ message });
});

const port =  3000
app.listen(port, () => {
  console.log(successMsg(`Server is running. Use our API on port: ${port}`));
});