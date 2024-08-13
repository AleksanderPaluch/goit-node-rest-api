import jwt from "jsonwebtoken";
import RefreshToken from "../models/refresh-token.js";
import User from "../models/users.js";

export const generateToken = async (payload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "10m",
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "30d",
  });

  return {
    token,
    refreshToken,
  };
};

export const saveToken = async (userId, refreshToken) => {
  const tokenData = await RefreshToken.findOne({ userId });
  if (tokenData) {
    tokenData.refreshToken = refreshToken;
    return tokenData.save();
  }
  const reftoken = await RefreshToken.create({ userId, refreshToken });

  return reftoken;
};


export const removeToken = async (refreshToken) => {
  const tokenData = await RefreshToken.deleteOne({ refreshToken });
  return tokenData;
}




export const refresh = async (checkRefreshToken) => {
  const userData = validateRefreshToken(checkRefreshToken);
  const tokenFromDb = await findToken(checkRefreshToken);

  console.log("here");

  if(!userData || !tokenFromDb) {
      //return HttpError(401, 'Unauthorized');
      return false;
  }
  const user = await User.findById(userData.id);
  const payload = { id: user._id, email: user.email };
  const { token, refreshToken } = await generateToken(payload);
  await saveToken(user._id, refreshToken);
  await User.findByIdAndUpdate(user._id, { token }, { new: true });

  return { token, refreshToken, user: { email: user.email } };
}


const validateRefreshToken = (refreshToken) => {
  try{
  const userData = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  return userData;
  } catch (e) {
      return false;
  }

}

const findToken = async (refreshToken) => {
  const tokenData = await RefreshToken.findOne({ refreshToken:refreshToken });
  return tokenData;
}
