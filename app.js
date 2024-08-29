import express from "express";
import morgan from "morgan";
import cors from "cors";
import path from "node:path";
import cookieParser from "cookie-parser";

import "./routes/db.js";

import usersRouter from "./routes/usersRouter.js";
import waterRouter from "./routes/waterRouter.js";
import { auth } from "./middlewares/auth.js";

const app = express();

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};

app.use(morgan("tiny"));
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use("/users", usersRouter);
app.use("/water", waterRouter);
app.use("/avatars", express.static(path.resolve("public/avatars")));

app.use((_, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  const { status = 500, message = "Server error" } = err;
  return res.status(status).json({ message });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running. Use our API on port: ${port}`);
});