import { Server } from 'http';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { logger } from '../config/logger';
import { printServerBanner } from '../shared/utils/banner';
import { AcknowledgmentEngine } from '../features/agent/realtime/acknowledgment.engine';

export async function startServer(port: number = Number(process.env.PORT) || 5000): Promise<Server> {
  // Connect to database before accepting incoming HTTP requests
  try {
    await connectDatabase();
  } catch (error) {
    logger.fatal({ error: (error as Error).message }, 'Server failed to start due to database connection error');
    // If running in development/test without internet or local mongo, still allow fallback if desired
  }

  const app = createApp();

  const server = app.listen(port, () => {
    printServerBanner(port, process.env.NODE_ENV || 'development');
    // Pre-warm verbal acknowledgments in memory for 0ms latency
    AcknowledgmentEngine.warmCache().catch(() => {});
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, `Received ${signal}, gracefully shutting down...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        await disconnectDatabase();
      } catch (err) {
        logger.error({ error: (err as Error).message }, 'Error during database disconnection on shutdown');
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return server;
}
