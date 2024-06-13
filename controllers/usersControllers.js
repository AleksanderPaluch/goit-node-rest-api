import User from "../models/users.js";
import HttpError from "../helpers/HttpError.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as fs from "node:fs/promises";
import path from "node:path";
import gravatar from "gravatar";
import jimp from "jimp";
import Mail from "../helpers/verifyEmail.js";
import crypto from "node:crypto";

export const registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user !== null) {
      throw HttpError(409, "Email in use");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const emailToLowerCase = email.toLowerCase();
    const gravatarImg = gravatar.url(emailToLowerCase);
    const verificationToken = crypto.randomUUID();

    await Mail.sendMail({
      to: emailToLowerCase,
      from: "aleksander.paluc@wp.pl",
      subject: "Confirm your account!",
      html: `To confirm your email,please click on the <a href="http://localhost:3000/users/verify/${verificationToken}">link</a>`,
      text: `To confirm your email please open the link http://localhost:3000/users/verify/${verificationToken}`,
    });

    await User.create({
      email,
      password: passwordHash,
      avatarURL: `http:${gravatarImg}`,
      verificationToken,
    });

    res.status(201).send({
      user: {
        email,
        avatarURL: `http:${gravatarImg}`,
        subscription: "starter",
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

    if (user.verify === false) {
      res.status(401).send({ message: "please verify your email" });
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
    if (!req.file) {
      throw HttpError(400, "File not found");
    }

    const publicDirectory = path.resolve("public/avatars", req.file.filename);

    await fs.rename(req.file.path, publicDirectory);

    const avatar = await jimp.read(publicDirectory);
    await avatar.resize(250, 250).writeAsync(publicDirectory);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatarURL: `/avatars/${req.file.filename}` },
      { new: true }
    );

    res.send({ avatarURL: `/avatars/${req.file.filename}` });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { verificationToken } = req.params;
    console.log(verificationToken);

   const user = await User.findOne({verificationToken})
   
   if (!user) {
    return res.status(404).send({message: "user not found"})
   }

   await User.findByIdAndUpdate(user._id, {verify: true, verificationToken: null})

   res.status(200).json({ message: "Email confirm successfully" });
   
  } catch (error) {
    next(error);
  }

  
};


export const resendVerify = async (req, res, next) => {
 
  try {

    const { email } = req.body;

    if (!email) {
      res.status(400).send({"message":"missing required field email"})
    }

    const verificationToken = crypto.randomUUID()

    const user = await User.findOneAndUpdate(
      { email },
      { verificationToken },
      { new: true }
    );

    if (!user) {
      return next(HttpError(404, "User not found"));
    }

    if (user.verify == true) {
      return next(HttpError(400, "Verification has already been passed"));
    }
  
    await Mail.sendMail({
      to: email,
      from: "aleksander.paluc@wp.pl",
      subject: "Confirm your account!",
      html: `To confirm your email,please click on the <a href="http://localhost:3000/users/verify/${verificationToken}">link</a>`,
      text: `To confirm your email please open the link http://localhost:3000/users/verify/${verificationToken}`,
    });

    res.status(201).json({ message: " Verification email sent" });
    
  } catch (error) {
    next(error)
  }
 
  
};