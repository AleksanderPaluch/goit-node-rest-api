import express from "express";
import {
  getAllContacts,
  getOneContact,
  deleteContact,
  createContact,
  updateContact,
} from "../controllers/contactsControllers.js";

const contactsRouter = express.Router();
const JSONparser = express.json()

contactsRouter.get("/", getAllContacts);

contactsRouter.get("/:id", getOneContact);

contactsRouter.delete("/:id", deleteContact);

contactsRouter.post("/", JSONparser,  createContact);

contactsRouter.put("/:id", JSONparser,  updateContact);

export default contactsRouter;
