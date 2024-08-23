import Joi from "joi";

export const createWaterSchema = Joi.object({
  time: Joi.string().required(),
  amount: Joi.number().required().min(50).max(1000),
  date: Joi.string().required(),
  day: Joi.number().required().min(1).max(31),
  month: Joi.number().required().min(1).max(12),
  year: Joi.number().required().min(2024).max(2040),
  ownerId: Joi.string().required(),
});

export const updateWaterSchema = Joi.object({
  time: Joi.string().required(),
  water: Joi.number().required().min(50).max(1000),
  id: Joi.string().required(),
});
