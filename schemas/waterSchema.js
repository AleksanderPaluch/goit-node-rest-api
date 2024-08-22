import Joi from "joi";

export const createWaterSchema = Joi.object({
  time: Joi.string().required().min(3),
  date: Joi.string().required(),
  amount: Joi.number().required(),
  ownerId: Joi.string().required(),
});
