import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { AppError } from "../utils/error.util";

type RequestPart = "body" | "query" | "params";

export const validate =
  (schema: Joi.ObjectSchema, part: RequestPart = "body") =>
  (req: Request, _res: Response, next: NextFunction) => {
    const { value, error } = schema.validate(req[part], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join("; ");
      next(new AppError(message, 400));
      return;
    }

    req[part] = value;
    next();
  };
