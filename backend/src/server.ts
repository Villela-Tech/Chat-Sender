/**
 * Arquivo principal do servidor que inicializa a aplicação
 * Responsável por iniciar o servidor HTTP, WebSocket e serviços do WhatsApp
 */

import gracefulShutdown from "http-graceful-shutdown";
import app from "./app";
import { initIO } from "./libs/socket";
import { logger } from "./utils/logger";
import { StartAllWhatsAppsSessions } from "./services/WbotServices/StartAllWhatsAppsSessions";
import Company from "./models/Company";
import { startQueueProcess } from "./queues";

// Inicia o servidor HTTP na porta definida em variável de ambiente
const server = app.listen(process.env.PORT, async () => {
  // Busca todas as empresas cadastradas no sistema
  const companies = await Company.findAll();
  const allPromises: any[] = [];

  // Inicia as sessões do WhatsApp para cada empresa
  companies.map(async c => {
    const promise = StartAllWhatsAppsSessions(c.id);
    allPromises.push(promise);
  });

  // Aguarda todas as sessões do WhatsApp serem iniciadas antes de começar o processamento das filas
  Promise.all(allPromises).then(() => {
    startQueueProcess();
  });
  
  logger.info(`Server started on port: ${process.env.PORT}`);
});

// Inicializa o servidor WebSocket
initIO(server);

// Configura o desligamento gracioso do servidor
gracefulShutdown(server);
