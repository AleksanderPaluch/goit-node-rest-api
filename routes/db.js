import mongoose from "mongoose";
import chalk from "chalk";

const DB_URI = process.env.DB_URI;
const successMsg = chalk.bgGreen.white;
const errorMsg = chalk.bgWhite.redBright;



mongoose
  .connect(DB_URI)
  .then(() => console.log(successMsg("Database connection success")))
  .catch((error) => {
    console.error(errorMsg("Database connection failure:", error))
    process.exit(1)
});


