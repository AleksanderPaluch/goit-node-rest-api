import express from "express";
import morgan from "morgan";
import cors from "cors";
import "./routes/db.js";
import path from "node:path"

import contactsRouter from "./routes/contactsRouter.js";
import usersRouter from "./routes/usersRouter.js";
import { auth } from "./middlewares/auth.js";

const app = express();

app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());

app.use("/contacts", auth, contactsRouter);
app.use("/api/users", usersRouter);

app.use("/avatars", express.static(path.resolve("public/avatars")))

app.use((_, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  const { status = 500, message = "Server error" } = err;
  return res.status(status).json({ message });
});

app.listen(3000, () => {
  console.log("Server is running. Use our API on port: 3000");
});
