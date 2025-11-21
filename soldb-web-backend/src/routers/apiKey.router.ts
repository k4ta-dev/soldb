import { Router } from "express";
import Joi from "joi";

import ApiKeyService from "../services/apiKey.service";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";

const apiKeyRouter = Router();
const apiKeyService = new ApiKeyService();

const createSchema = Joi.object({
  name: Joi.string().trim().min(1).max(64).optional(),
});

const idParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

apiKeyRouter.use(authMiddleware);

apiKeyRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const keys = await apiKeyService.list(req.user!.id);
    res.status(200).json(keys);
  } catch (err: any) {
    next(err);
  }
});

apiKeyRouter.post("/", validate(createSchema), async (req: AuthRequest, res, next) => {
  try {
    const { name } = req.body;
    const created = await apiKeyService.create(req.user!.id, name);
    res.status(201).json(created);
  } catch (err: any) {
    next(err);
  }
});

apiKeyRouter.delete(
  "/:id",
  validate(idParamSchema, "params"),
  async (req: AuthRequest, res, next) => {
    try {
      await apiKeyService.revoke(req.user!.id, req.params.id);
      res.status(204).send();
    } catch (err: any) {
      next(err);
    }
  },
);

export default apiKeyRouter;
