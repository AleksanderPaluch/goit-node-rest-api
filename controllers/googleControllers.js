import { URL } from "url";
import queryString from "query-string";

import axios from "axios";
import User from "../models/users.js";
import * as tokenServices from "../services/token-services.js";

export const googleAuth = async (req, res, next) => {
  const stringifiedParams = queryString.stringify({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${process.env.BASE_URL}/users/google-redirect`,
    scope:
      "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
  });

  return res.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${stringifiedParams}`
  );
};

export const googleAuthRedirect = async (req, res, next) => {
  try {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const urlObj = new URL(fullUrl);
    const urlParams = queryString.parse(urlObj.search);
    const code = urlParams.code;

    // Отримуємо токен доступу
    const tokenData = await axios({
      url: "https://oauth2.googleapis.com/token",
      method: "post",
      data: {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.BASE_URL}/users/google-redirect`,
        grant_type: "authorization_code",
        code,
      },
    });

    // Отримуємо інформацію про користувача
    const userData = await axios({
      url: "https://www.googleapis.com/oauth2/v3/userinfo",
      method: "get",
      headers: {
        Authorization: `Bearer ${tokenData.data.access_token}`,
      },
    });

    const {
      sub: googleId,
      email,
      picture: avatarURL,
      given_name: name,
    } = userData.data;

    // Перевіряємо, чи є користувач у базі даних
    let user = await User.findOne({ googleId });

    // Якщо користувача немає, реєструємо його
    if (!user) {
      user = await User.create({
        googleId,
        email: email.toLowerCase(),
        name,
        avatarURL,
        verify: true,
      });
    }

    // Генеруємо токен
    const payload = { id: user._id, email: user.email };
    const token = await tokenServices.generateAccessToken(payload);
    const refreshToken = await tokenServices.generateRefreshToken(payload);

    // Зберігаємо refresh токен
    await tokenServices.saveToken(user._id, refreshToken);
    await User.findByIdAndUpdate(user._id, { token }, { new: true });

    // Відправляємо токен клієнту або редіректимо на потрібну сторінку
   
    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true });
    res.redirect(`https://water-tracker-app.vercel.app/signin?token=${token}`);
  } catch (error) {
    console.error("Помилка авторизації:", error);
    next(error);
  }
};

export const googleLogin = async (req, res, next) => {
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
    console.log(user);
    return res.status(200).send({ user: { email: user.email }, token: user.token} );
  } catch (error) {
    console.log(error);
    next(error);
  }
};
