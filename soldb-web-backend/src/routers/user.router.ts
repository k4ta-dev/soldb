import { Router } from "express"; // todo authReq

import UserService from "../services/user.service";
import { AppError } from "../utils/error.util";

const userService = new UserService();
const userRouter = Router();

userRouter.post("/auth/request", async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      // todo proepr validation
      throw new AppError("Missing email in request", 400);
    }

    const url = userService.requestAuth(email);

    res.status(200).json({
      devOnlyUrl: url, // 1 factor auth :D
    });
  } catch (err: any) {
    next(err);
  }
});

userRouter.post("/auth", async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      // todo proepr validation
      throw new AppError("Missing token in request", 400);
    }

    const jwt = userService.auth(token);

    // set cookie

    res.status(200);
  } catch (err: any) {
    next(err);
  }
});

// todo onlyAuth middleware
userRouter.get("/", async (req, res, next) => {
  try {
    const id = "0x1";

    const user = await userService.get(id);

    res.status(200).json(user);
  } catch (err: any) {
    next(err);
  }
});

// todo onlyAuth middleware
userRouter.patch("/", async (req, res, next) => {
  try {
    const id = "0x1";
    const { username } = req.body;

    if (!username) {
      throw new AppError("Missing username in request", 400);
    }

    const user = await userService.update(id, username);

    res.status(200).json(user);
  } catch (err: any) {
    next(err);
  }
});

export default userRouter;
