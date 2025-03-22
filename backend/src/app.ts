/**
 * Configuração principal da aplicação Express
 * Este arquivo configura middlewares, rotas e tratamento de erros
 */

import "./bootstrap";
import "reflect-metadata";
import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";

import "./database";
import uploadConfig from "./config/upload";
import AppError from "./errors/AppError";
import routes from "./routes";
import { logger } from "./utils/logger";
import { messageQueue, sendScheduledMessages } from "./queues";

// Inicializa o Sentry para monitoramento de erros
Sentry.init({ dsn: process.env.SENTRY_DSN });

const app = express();
const bodyParser = require('body-parser');

// Configura as filas de mensagens na aplicação
app.set("queues", {
  messageQueue,
  sendScheduledMessages
});

// Configura limites para o tamanho do corpo das requisições
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));

// Configura CORS para permitir requisições do frontend
app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URL
  })
);

// Middlewares essenciais
app.use(cookieParser());  // Para processar cookies
app.use(express.json());  // Para processar JSON no corpo das requisições
app.use(Sentry.Handlers.requestHandler());  // Middleware do Sentry para rastreamento de requisições

// Configuração de arquivos estáticos
app.use("/public", express.static(uploadConfig.directory));

// Configuração das rotas da aplicação
app.use(routes);

// Middleware de tratamento de erros do Sentry
app.use(Sentry.Handlers.errorHandler());

/**
 * Middleware global de tratamento de erros
 * Diferencia entre erros da aplicação (AppError) e erros internos do servidor
 */
app.use(async (err: Error, req: Request, res: Response, _: NextFunction) => {
  if (err instanceof AppError) {
    logger.warn(err);
    return res.status(err.statusCode).json({ error: err.message });
  }

  logger.error(err);
  return res.status(500).json({ error: "Internal server error" });
});

export default app;
