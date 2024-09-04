import express from "express";
import { registerUser, loginUser, logoutUser, refreshAccess, checkCurrentUser, changeAvatar, verifyEmail, sendResetMail, changePassword, updateUser, getTotalUsers } from "../controllers/usersControllers.js";
import { auth } from "../middlewares/auth.js";
import upload from "../middlewares/upload.js"
import { googleAuth, googleAuthRedirect, googleLogin } from "../controllers/googleControllers.js";



const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", auth, logoutUser)
router.get("/verify/:verificationToken", verifyEmail)
router.post("/reset-mail", sendResetMail)
router.post("/change-password", changePassword)
router.post("/token-refresh", refreshAccess)
router.get("/current", checkCurrentUser)
router.patch("/update", updateUser)
router.get("/total", getTotalUsers)
router.patch("/avatars",  upload.single("avatar"), changeAvatar)
router.get("/google", googleAuth)
router.get("/google-redirect", googleAuthRedirect)
router.post("/google-auth", googleLogin)

export default router;
