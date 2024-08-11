import HttpError from "../helpers/HttpError.js";
import jwt from "jsonwebtoken";
import User from "../models/users.js";

export const auth = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return next(HttpError(401, "Authorization header missing"));
  }
  const [bearer, token] = authorizationHeader.split(" ", 2);

  if (bearer !== "Bearer" || !token) {
    return next(HttpError(401, "invalid token"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.token !== token) {
      throw HttpError(401, "Not authorized");
    }

    req.user = { id: decoded.id, email: decoded.email };

    next();
  } catch (error) {
    next(error);
  }
};
