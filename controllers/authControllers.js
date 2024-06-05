import User from "../models/users.js";
import HttpError from "../helpers/HttpError.js";
import bcrypt from "bcrypt";

export const registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user !== null) {
      throw HttpError(409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ email, password: passwordHash });

    res.status(201).send({ message: "Registered successfully" });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user === null) {
      throw HttpError(401);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch === false) {
      throw HttpError(401);
    }

    res.status(200).send({ message: "good login", token: "TOKEN" });
  } catch (error) {
    next(error);
  }
};
