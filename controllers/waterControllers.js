import HttpError from "../helpers/HttpError.js";
import {
  createWaterSchema,
  updateWaterSchema,
} from "../schemas/waterSchema.js";
import Water from "../models/water.js";
import * as tokenServices from "../services/token-services.js";

export const getWaterDaily = async (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not found" });
  }

  try {
    const userData = tokenServices.validateRefreshToken(refreshToken);
    if (!userData) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const { day, month, year } = req.query;

    const waterDaily = await Water.find({
      ownerId: userData.id,
      day,
      month,
      year,
    });

    res.status(200).send({ waterDaily });
  } catch (error) {
    next(error);
  }
};

export const addWaterAmount = async (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not found" });
  }

  try {
    const userData = tokenServices.validateRefreshToken(refreshToken);
    if (!userData) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const waterAmount = {
      time: req.body.time,
      amount: req.body.water,
      date: req.body.fullDate,
      day: req.body.day,
      month: req.body.month,
      year: req.body.year,
      ownerId: userData.id,
    };

    const { error } = createWaterSchema.validate(waterAmount, {
      abortEarly: false,
    });
    if (error) {
      throw HttpError(400, error.message);
    }

    try {
      await Water.create(waterAmount);
    } catch (error) {
      throw HttpError(500, error.message);
    }
    res.status(201).send("Amount of water has been added");
  } catch (error) {
    next(error);
  }
};

export const editWaterAmount = async (req, res, next) => {
  try {
    const { time, water, id } = req.body;

    if (!time && !water && !id) {
      return res
        .status(400)
        .json({ message: "Body must have at least one field" });
    }

    const { error } = updateWaterSchema.validate(
      { time, water, id },
      {
        abortEarly: false,
      }
    );

    if (error) {
      console.log(error);
      throw HttpError(400, error.message);
    }

    await Water.findOneAndUpdate(
      { _id: id },
      { time: time, amount: water },
      { new: true }
    );

    res.status(201).send("water edited successfully");
  } catch (error) {
    next(error);
  }
};

export const removeWaterAmount = async (req, res, next) => {
  const { id } = req.params;
  try {
    await Water.findOneAndDelete({ _id: id });

    res.status(200).send("water removed successfully");
  } catch (error) {
    console.log(error);
    next(error);
  }
};
