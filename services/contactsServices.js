import * as fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const contactsPath = path.resolve("db", "contacts.json");

async function readContacts() {
  const data = await fs.readFile(contactsPath, { encoding: "utf8" });
  return JSON.parse(data);
}

async function writeContacts(contacts) {
  await fs.writeFile(contactsPath, JSON.stringify(contacts, undefined, 2));
}

async function listContacts() {
  const contacts = await readContacts();
  return contacts;
}

async function getContactById(contactId) {
  const contacts = await readContacts();

  const contact = contacts.find((contact) => contact.id === contactId);

  if (typeof contact === undefined) {
    return null;
  }

  return contact;
}

async function addContact(contact) {
  const allContacts = await readContacts();

  const newContact = { id: crypto.randomUUID(), ...contact };

  allContacts.push(newContact);

  await writeContacts(allContacts);

  return newContact;
}

async function removeContact(contactId) {
  const contacts = await readContacts();

  const index = contacts.findIndex((contact) => contact.id === contactId);

  if (index === -1) {
    return null;
  }

  const [removedContact] = contacts.splice(index, 1);

  await writeContacts(contacts);

  return removedContact;
}

async function updateContact(contactId, data) {
  try {
    const contacts = await readContacts();
    const index = contacts.findIndex((contact) => contact.id === contactId);

    if (index === -1) {
      return null;
    }

    const updateContact = { ...contacts[index], ...data};
    contacts[index] = updateContact;
    await writeContacts(contacts);
    return updateContact;
  } catch (error) {
    console.log(error);
  }
}

export default {
  listContacts,
  getContactById,
  addContact,
  removeContact,
  updateContact,
};
