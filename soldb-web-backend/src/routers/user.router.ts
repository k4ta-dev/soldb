import { Router } from "express";
import Joi from "joi";

import UserService from "../services/user.service";
import { validate } from "../middleware/validation.middleware";
import { AuthRequest, authMiddleware } from "../middleware/auth.middleware";

const userService = new UserService();
const userRouter = Router();

const requestAuthSchema = Joi.object({
  email: Joi.string().email().required(),
});

const authSchema = Joi.object({
  token: Joi.string()
    .pattern(/^[a-f0-9]{64}$/i)
    .required(),
});

const updateUserSchema = Joi.object({
  username: Joi.string()
    .pattern(/^[a-zA-Z0-9._-]+$/)
    .min(3)
    .max(32)
    .required(),
});

userRouter.post("/auth/request", validate(requestAuthSchema), async (req, res, next) => {
  try {
    const { email } = req.body;

    const url = await userService.requestAuth(email);

    res.status(200).json({
      devOnlyUrl: url, // 1 factor auth :D
    });
  } catch (err: any) {
    next(err);
  }
});

userRouter.post("/auth", validate(authSchema), async (req, res, next) => {
  try {
    const { token } = req.body;

    const jwt = await userService.auth(token);

    // set cookie

    res.status(200).json({ token: jwt });
  } catch (err: any) {
    next(err);
  }
});

userRouter.get("/", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const user = await userService.get(req.user!.id);

    res.status(200).json(user);
  } catch (err: any) {
    next(err);
  }
});

userRouter.patch(
  "/",
  authMiddleware,
  validate(updateUserSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { username } = req.body;

      const user = await userService.update(req.user!.id, username);

      res.status(200).json(user);
    } catch (err: any) {
      next(err);
    }
  },
);

export default userRouter;
