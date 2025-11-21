import * as dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "fs";
import path from "path";
import YAML from "yaml";

import apiKeyRouter from "./routers/apiKey.router";
import userRouter from "./routers/user.router";
import { AppError } from "./utils/error.util";

dotenv.config();

const app = express();
app.use(express.json());

const openapiPath = path.join(process.cwd(), "openapi.yaml");
const openapiDocument = YAML.parse(readFileSync(openapiPath, "utf8"));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

app.get("/", (_req, res) => {
  res.status(200).json({ message: "soldb-web-backend" });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/users", userRouter);
app.use("/api-keys", apiKeyRouter);

app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    path: req.originalUrl,
  });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.errorCode).json({ error: err.clientError });
    console.log(err)
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
