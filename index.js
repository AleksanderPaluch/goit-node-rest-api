import "dotenv/config";
import mongoose from "mongoose";
const starter = "node index.js";



const DB_URI = process.env.DB_URI;
console.log('DB_URI: ', DB_URI);

async function run() {
  try {
    await mongoose.connect(DB_URI);
    console.log("Database connection succes");
  } catch (error) {
    console.error("Database connecyion faliure:", error);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch(console.error);
