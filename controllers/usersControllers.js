import User from "../models/users.js";
import HttpError from "../helpers/HttpError.js";
import bcrypt from "bcrypt";
import * as fs from "node:fs/promises";
import * as tokenServices from "../services/token-services.js";
import path from "node:path";
import gravatar from "gravatar";
import jimp from "jimp";
import Mail from "../helpers/verifyEmail.js";
import crypto from "node:crypto";

const cookieConfig = {
  maxAge: 30 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  // sameSite: "none",
  // secure: true,
  sameSite: "lax", // замінено на 'lax' для локальної розробки
  secure: false, // змінено на false для локальної розробки без HTTPSs
};

export const registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user !== null) {
      throw HttpError(
        409,
        "The email address you’ve entered is already in use"
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const emailToLowerCase = email.toLowerCase();
    const gravatarImg = gravatar.url(emailToLowerCase);
    const verificationToken = crypto.randomUUID();

    await Mail.sendMail({
      to: emailToLowerCase,
      from: "AquaTrack.com",
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

    const payload = { id: user._id, email: user.email };

    const token = await tokenServices.generateAccessToken(payload);
    const refreshToken = await tokenServices.generateRefreshToken(payload);

    await tokenServices.saveToken(user._id, refreshToken);
    await User.findByIdAndUpdate(user._id, { token }, { new: true });

    return res
      .cookie("refreshToken", refreshToken, cookieConfig)
      .status(200)
      .send({ token, user: { email: user.email } });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not found" });
  }

  try {
    await User.findByIdAndUpdate(req.user.id, { token: null }, { new: true });
    await tokenServices.removeToken(refreshToken);

    // Очищення куки та відповідь
    res.clearCookie("refreshToken", { path: "/" });
    return res.status(204).end();
  } catch (error) {
    console.log("error: ", error);
    next(error);
  }
};

export const refreshAccess = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token not found" });
    }

    const userData = tokenServices.validateRefreshToken(refreshToken);
    const tokenFromDb = await tokenServices.findToken(refreshToken);

    if (!userData || !tokenFromDb) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = { id: userData.id, email: userData.email };
    const newAccessToken = tokenServices.generateAccessToken(payload);

    // Оновлюємо тільки Access Token в базі даних
    await User.findByIdAndUpdate(
      userData.id,
      { token: newAccessToken },
      { new: true }
    );

    return res.status(200).json({ token: newAccessToken });
  } catch (error) {
    console.error("Error during token refresh:", error);
    next(error);
  }
};

export const checkCurrentUser = async (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not found" });
  }

  try {
    const userData = tokenServices.validateRefreshToken(refreshToken);
    if (!userData) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(userData.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Якщо користувач знайдений, повертаємо його дані
    return res.status(200).send({
      user: {
        email: user.email,
        name: user.name,
        gender: user.gender,
        weight: user.weight,
        timeActivity: user.timeActivity,
        dailyNorma: user.dailyNorma,
        avatarURL: user.avatarURL,
      },
    });
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

    await User.findByIdAndUpdate(user._id, {
      verify: true,
      verificationToken: null,
    });

    res.redirect("http://localhost:5173/signin");
  } catch (error) {
    next(error);
  }
};

// export const resendVerify = async (req, res, next) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       res.status(400).send({ message: "missing required field email" });
//     }

//     const verificationToken = crypto.randomUUID();

//     const user = await User.findOneAndUpdate(
//       { email },
//       { verificationToken },
//       { new: true }
//     );

//     if (!user) {
//       return next(HttpError(404, "User not found"));
//     }

//     if (user.verify === true) {
//       return next(HttpError(400, "Verification has already been passed"));
//     }

//     await Mail.sendMail({
//       to: email,
//       from: "aleksander.paluc@wp.pl",
//       subject: "Confirm your account!",
//       html: `To confirm your email,please click on the <a href="http://localhost:3000/users/verify/${verificationToken}">link</a>`,
//       text: `To confirm your email please open the link http://localhost:3000/users/verify/${verificationToken}`,
//     });

//     res.status(201).json({ message: " Verification email sent" });
//   } catch (error) {
//     next(error);
//   }
// };

export const sendResetMail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      throw HttpError(
        404,
        `Password reset requested for non-existent email: ${email}`
      );
    }
    const emailToLowerCase = email.toLowerCase();
    const verificationToken = crypto.randomUUID();

    await User.findByIdAndUpdate(
      user._id,
      {
        verificationToken,
      },
      { new: true }
    );

    await Mail.sendMail({
      to: emailToLowerCase,
      from: "AquaTrack.com",
      subject: "Reset Your Password",
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
      <h1>Reset Your Password</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>We received a request to reset the password for your account. Please click the button below to reset your password:</p>
      <p><a href="http://localhost:5173/reset-password/${verificationToken}" class="button">Reset Password</a></p>
      <p>If you did not request a password reset, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 AquaTrack. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    });

    res.status(200).json({ message: " reset email sent" });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { verificationToken, password } = req.body;

    // Перевірка наявності всіх необхідних полів
    if (!verificationToken || !password) {
      return res
        .status(400)
        .send({ message: "verification token and password are required" });
    }

    // Пошук користувача за токеном
    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res
        .status(404)
        .send({ message: "Invalid or expired reset token" });
    }

    // Хешування нового пароля
    const passwordHash = await bcrypt.hash(password, 10);

    // Оновлення пароля та видалення токена
    await User.findByIdAndUpdate(
      user._id,
      { password: passwordHash, verificationToken: null },
      { new: true }
    );

    res.status(200).json({ message: "Password has been successfully changed" });
  } catch (error) {
    console.error("Error changing password:", error); // Логування помилки
    next(error); // Передача помилки в middleware обробки помилок
  }
};

export const updateUser = async (req, res, next) => {
  const { refreshToken } = req.cookies;
  const update = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not found" });
  }

  try {
    const userData = tokenServices.validateRefreshToken(refreshToken);
    if (!userData) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(userData.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userData.id,
      {
        email: update.email,
        name: update.name,
        gender: update.gender,
        weight: update.weight,
        timeActivity: update.activeTime,
        dailyNorma: update.water * 1000,
      },
      { new: true } // This option returns the updated document
    );

    return res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const getTotalUsers = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();

    return res.status(200).json({ totalUsers });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const changeAvatar = async (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not found" });
  }

  if (!req.file) {
        throw HttpError(400, "File not found");
      }

  try {

    const publicDirectory = path.resolve("public/avatars", req.file.filename);

    await fs.rename(req.file.path, publicDirectory);

    const avatar = await jimp.read(publicDirectory);
    await avatar.resize(250, 250).writeAsync(publicDirectory);

    const userData = tokenServices.validateRefreshToken(refreshToken);
    if (!userData) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    await User.findByIdAndUpdate(
      userData.id,
      { avatarURL: `http://localhost:3000/avatars/${req.file.filename}` },
      { new: true }
    );
  
 
  return   res.status(201).send("avatar changed successfully");
  } catch (error) {
    console.log(error);
    next(error)
  }

};
