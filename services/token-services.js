import jwt from "jsonwebtoken";
import RefreshToken from "../models/refresh-token.js";
import User from "../models/users.js"

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "10m" });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: "30d" });
};

export const saveToken = async (userId, refreshToken) => {
  const tokenData = await RefreshToken.findOne({ userId });
  if (tokenData) {
    tokenData.refreshToken = refreshToken;
    return tokenData.save();
  }
  const newToken = await RefreshToken.create({ userId, refreshToken });
  return newToken;
};

export const removeToken = async (refreshToken) => {
  return RefreshToken.deleteOne({ refreshToken });
};

export const validateAccessToken = (accessToken) => {
  try {
    const userData = jwt.verify(accessToken, process.env.JWT_SECRET);
    
    return userData;
  } catch (e) {
   
    return null;
  }
};

export const validateRefreshToken = (refreshToken) => {
  try {
    const userData = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    return userData;
  } catch (e) {
   
    return null;
  }
};

export const findToken = async (refreshToken) => {
  return RefreshToken.findOne({ refreshToken });
};
