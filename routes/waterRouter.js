import express from "express";
import { addWaterAmount, editWaterAmount, getWaterDaily, removeWaterAmount } from "../controllers/waterControllers.js";



const router = express.Router();


router.get("/get", getWaterDaily)
router.post("/add", addWaterAmount)
router.patch("/edit", editWaterAmount)
router.delete("/remove", removeWaterAmount)



export default router;