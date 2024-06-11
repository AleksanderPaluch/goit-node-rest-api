import User from "../models/users.js";
import HttpError from "../helpers/HttpError.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as fs from "node:fs/promises"
import path from "node:path";


export const registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    
    if (user !== null) {
      throw HttpError(409, "Email in use");
    }

    
    
    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ email, password: passwordHash,  });

    

    res.status(201).send({
      user: {
        email,
        "subscription": "starter"
      },
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user === null) {
      throw HttpError(401, "Email or password is wrong");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch === false) {
      throw HttpError(401, "Email or password is wrong");
    }

    const JWT_SECRET = process.env.JWT_SECRET;

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: 60 * 60,
    });

    await User.findByIdAndUpdate(user._id, { token }, { new: true });

    const subscription = user.subscription;

    res.status(200).send({
      token,
      user: {
        email,
        subscription,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { token: null },
      { new: true }
    );
    if (!user) {
      throw HttpError(401, "Not authorized");
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

export const checkCurrentUser = async (req, res, next) => {
  try {
    
    const user = await User.findById(req.user.id);
    if (user === null) {
      throw HttpError(401);
    }

    const { email, subscription } = user;

    res.status(200).send({
      email,
      subscription,
    });
  } catch (error) {
    next(error);
  }
};


export const changeAvatar = async (req, res, next) => {
  try {
    await fs.rename(req.file.path, path.resolve("public/avatars", req.file.filename))

    const user = await User.findByIdAndUpdate(req.user.id, {avatarURL: req.file.filename}, {new: true})

    res.send(user)
  } catch (error) {
    next(error)
  }



};