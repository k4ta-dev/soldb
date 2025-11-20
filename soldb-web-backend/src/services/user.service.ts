import crypto from "crypto";
import jwt from "jsonwebtoken";

import prisma from "../clients/prisma.client";
import { AppError } from "../utils/error.util";

class UserService {
  requestAuth = async (email: string) => {
    const raw = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(raw).digest("hex");

    try {
      await prisma.magicLink.create({
        data: {
          email,
          tokenHash: hash,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
    } catch (err: any) {
      throw new AppError("Authentication failed, please try again", 500, err);
    }

    const url = `${process.env.APP_URL}/auth/login?token=${raw}`;

    // assume send email

    return url; // dev only
  };

  auth = async (rawToken: string) => {
    const hash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const token = await prisma.magicLink.findFirst({
      where: {
        tokenHash: hash,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!token) throw new AppError("Invalid or expired token", 401);

    try {
      await prisma.magicLink.update({
        where: { id: token.id },
        data: { used: true },
      });
    } catch (err: any) {
      throw new AppError("Authentication failed, please try again", 500, err);
    }

    let user = await prisma.user.findUnique({
      where: { email: token.email },
    });

    if (!user) {
      let username = this.getUsernameFromEmail(token.email);

      const exists = await prisma.user.findUnique({
        where: {
          username,
        },
      });

      if (exists) {
        username = `${username}-${Math.floor(100 + Math.random() * 900).toString()}`; // lol
      }

      try {
        user = await prisma.user.create({
          data: {
            email: token.email,
            username,
          },
        });
      } catch (err: any) {
        throw new AppError(
          "Failed to authenticate the user, please try again",
          500,
          err,
        );
      }
    }

    const jwtAuth = jwt.sign({ email: token.email }, process.env.JWT_SECRET!, {
      expiresIn: "30d",
    });

    return jwtAuth;
  };

  get = async (id: string) => {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) throw new AppError("User not found", 404);

    return user;
  };

  update = async (id: string, newUsername: string) => {
    const exists = await prisma.user.findUnique({
      where: {
        username: newUsername,
      },
    });

    if (exists) {
      throw new AppError("Given username is not available", 409);
    }

    try {
      return await prisma.user.update({
        where: {
          id,
        },
        data: {
          username: newUsername,
        },
      });
    } catch (err: any) {
      throw new AppError("Failed to update username", 500, err);
    }
  };

  private getUsernameFromEmail = (email: string) => {
    return email
      .split("@")[0]
      .replace(/\+.*$/, "")
      .replace(/[^a-zA-Z0-9._-]/g, "");
  };
}

export default UserService;
