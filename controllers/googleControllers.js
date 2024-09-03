import { URL } from "url";
import queryString from "query-string";
import { response } from "express";
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

    const { sub: googleId, email, picture: avatarURL, given_name: name } = userData.data;

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
    res.status(200).redirect("http://localhost:5173/signin")
  } catch (error) {
    console.error("Помилка авторизації:", error);
    next(error);
  }
};


// id: '117989122758053172226',
// email: 'piesciejebaljak@gmail.com',
// verified_email: true,
// name: 'Aleksander Paluch',
// given_name: 'Aleksander',
// family_name: 'Paluch',
// picture: 'https://lh3.googleusercontent.com/a/ACg8ocInNjyC1DUO3ZuOL4DEi0MmedvCzj-T8FeGV_9HZN8ciKdeXw=s96-c'
