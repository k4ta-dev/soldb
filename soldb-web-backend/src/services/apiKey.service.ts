import crypto from "crypto";

import prisma from "../clients/prisma.client";
import { AppError } from "../utils/error.util";

class ApiKeyService {
  create = async (userId: string, name?: string) => {
    const raw = crypto.randomBytes(32).toString("hex");
    const keyHash = crypto.createHash("sha256").update(raw).digest("hex");

    try {
      const created = await prisma.aPIKey.create({
        data: {
          userId,
          name,
          keyHash,
        },
      });

      return {
        id: created.id,
        key: `api_${raw}`,
      };
    } catch (err: any) {
      throw new AppError("Failed to create API key", 500, err);
    }
  };

  list = async (userId: string) => {
    return prisma.aPIKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        revoked: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
  };

  revoke = async (userId: string, apiKeyId: string) => {
    const existing = await prisma.aPIKey.findFirst({
      where: {
        id: apiKeyId,
        userId,
      },
    });

    if (!existing) {
      throw new AppError("API key not found", 404);
    }

    if (existing.revoked) {
      return existing;
    }

    try {
      return await prisma.aPIKey.update({
        where: { id: apiKeyId },
        data: { revoked: true },
        select: {
          id: true,
          name: true,
          revoked: true,
          createdAt: true,
          lastUsedAt: true,
        },
      });
    } catch (err: any) {
      throw new AppError("Failed to revoke API key", 500, err);
    }
  };
}

export default ApiKeyService;
