import mongoose from "mongoose";

const DB_URI = process.env.DB_URI;

// async function run() {
//   try {
//     await mongoose.connect(DB_URI);
//     console.log("Database connection success");
//   } catch (error) {
//     console.error("Database connection failure:", error);
//   } finally {
//     await mongoose.disconnect();
//   }
// }

mongoose
  .connect(DB_URI)
  .then(() => console.log("Database connection success"))
  .catch((error) => {
    console.error("Database connection failure:", error)
    process.exit(1)
});
