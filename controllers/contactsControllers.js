import HttpError from "../helpers/HttpError.js";
import {
  createContactSchema,
  updateContactSchema,
} from "../schemas/contactsSchemas.js";
import Contact from "../models/contacts.js";

export const getAllContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find(); // {favorite: true}
    res.status(200).send(contacts);
  } catch (error) {
    next(error);
  }
};

export const getOneContact = async (req, res, next) => {
  const { id } = req.params;
  try {
    const contact = await Contact.findById(id);
    if (!contact) {
      throw HttpError(404);
    }
    return res.status(200).json(contact);
  } catch (error) {
    next(error);
  }
};
export const deleteContact = async (req, res, next) => {
  const { id } = req.params;
  try {
    const removedContact = await Contact.findByIdAndDelete(id);
    if (!removedContact) {
      throw HttpError(404);
    }
    return res.status(200).json(removedContact);
  } catch (error) {
    next(error);
  }
};

export const createContact = async (req, res, next) => {
  try {
    const contact = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      favorite: req.body.favorite,
    };

    const { error } = createContactSchema.validate(contact, {
      abortEarly: false,
    });
    if (error) {
      throw HttpError(400, error.message);
    }
    try {
      const newContact = await Contact.create(contact);

      res.status(201).send(newContact);
    } catch (error) {
      throw HttpError(500, error.message);
    }
  } catch (error) {
    next(error);
  }
};

export const updateContact = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contact = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
    };

    if (!contact.name && !contact.email && !contact.phone) {
      return res
        .status(400)
        .json({ message: "Body must have at least one field" });
    }

    const { error, value } = updateContactSchema.validate(contact, {
      abortEarly: false,
    });
    if (error) {
      throw HttpError(400, error.message);
    }
    const updatedContact = await Contact.findByIdAndUpdate(id, value);
    res.status(201).send(updatedContact);
  } catch (error) {
    next(error);
  }
};

export const updateFavorite = async (req, res, next) => {
  const { id } = req.params;
  try {
    const updatedContact = await Contact.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedContact) {
      throw HttpError(404);
    }
    return res.status(200).json(updatedContact);
  } catch (error) {
    next(error);
  }
};
