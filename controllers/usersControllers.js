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
      throw HttpError(409, "The email address you’ve entered is already in use");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const emailToLowerCase = email.toLowerCase();
    const gravatarImg = gravatar.url(emailToLowerCase);
    const verificationToken = crypto.randomUUID();



    await Mail.sendMail({
  to: emailToLowerCase,
  from: "aleksander.paluc@wp.pl",
  subject: "Confirm your account!",
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          background-color: #4CAF50;
          color: #ffffff;
          padding: 10px 0;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          margin: 20px 0;
          line-height: 1.6;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          font-size: 16px;
          color: #ffffff;
          background-color: #4CAF50;
          text-decoration: none;
          border-radius: 5px;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          color: #777777;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Confirm Your Account</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Thank you for registering with our service. Please click the button below to confirm your email address:</p>
          <p><a href="http://localhost:3000/api/users/verify/${verificationToken}" class="button">Confirm Email</a></p>
          <p>If you did not create an account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 AquaTrack. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
});
    // await Mail.sendMail({
    //   to: emailToLowerCase,
    //   from: "aleksander.paluc@wp.pl",
    //   subject: "Confirm your account!",
    //   html: `To confirm your email,please click on the <a href="http://localhost:3000/users/verify/${verificationToken}">link</a>`,
    //   // html: `To confirm your email,please click on the <a href="http://localhost:5173/users/verify/${verificationToken}">link</a>`,
    // });

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
      return res.status(401).send({ message: "Please verify your email" });
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
    return res.status(204).end();
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

    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    await User.findByIdAndUpdate(user._id, { verify: true, verificationToken: null });

    res.redirect('http://localhost:5173/signin');
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