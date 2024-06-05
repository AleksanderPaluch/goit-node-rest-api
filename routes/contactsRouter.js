import express from "express";
import {
  getAllContacts,
  getOneContact,
  deleteContact,
  createContact,
  updateContact,
  updateFavorite
} from "../controllers/contactsControllers.js";

const contactsRouter = express.Router();
const JSONparser = express.json()

contactsRouter.get("/", getAllContacts);

contactsRouter.get("/:id", getOneContact);

contactsRouter.delete("/:id", deleteContact);

contactsRouter.post("/", JSONparser,  createContact);

contactsRouter.put("/:id", JSONparser,  updateContact);

contactsRouter.patch("/:id/favorite", updateFavorite);

export default contactsRouter;
