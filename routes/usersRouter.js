import express from "express";
import { registerUser, loginUser, logoutUser, checkCurrentUser, changeAvatar, verifyEmail, resendVerify, sendResetMail, changePassword } from "../controllers/usersControllers.js";
import { auth } from "../middlewares/auth.js";
import upload from "../middlewares/upload.js"


const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", auth, logoutUser)
router.get("/current", auth, checkCurrentUser)
router.patch("/avatars", auth, upload.single("avatar"), changeAvatar)
router.get("/verify/:verificationToken", verifyEmail)
router.post("/reset-mail", sendResetMail)
router.post("/change-password", changePassword)

export default router;
