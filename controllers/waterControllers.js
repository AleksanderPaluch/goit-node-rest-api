import HttpError from "../helpers/HttpError.js";
import {
  createWaterSchema,
 
} from "../schemas/waterSchema.js";
import Water from "../models/water.js";

export const getWaterDaily = async (req, res, next) => {
  try {
    console.log("get water");
    // получити список води по дню
        // перезаписати його в стан waterDaily
    //
    res.status(200).send("get water");
  } catch (error) {
    next(error);
  }
};

export const addWaterAmount = async (req, res, next) => {
    try {
        console.log("add water");
        console.log('req.body: ', req.body);
  
      res.status(200).send("add water");
    } catch (error) {
      next(error);
    }
  };

  export const editWaterAmount = async (req, res, next) => {
    try {
        console.log("edit water");
        console.log('req.body: ', req.body);
  
      res.status(200).send("edit water");
    } catch (error) {
      next(error);
    }
  };

  export const removeWaterAmount = async (req, res, next) => {
    try {

       
        console.log('req.body: ', req.body);

  
      res.status(200).send("delete water");
    } catch (error) {
      next(error);
    }
  };