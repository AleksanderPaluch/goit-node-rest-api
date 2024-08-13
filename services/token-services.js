import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const generateToken = async (payload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "10m",
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "30d",
  });

  return {
    token,
    refreshToken
  }
};
