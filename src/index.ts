import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { SchedulerService } from './services/schedulerService.js';
import './server.js';

dotenv.config();

const scheduler = new SchedulerService();

function start() {
  logger.info('[Main] Budget Pal daemon starting');
  // Global error handlers for better visibility in Railway logs
  process.on('unhandledRejection', (reason) => {
    logger.error('[Process] Unhandled promise rejection', reason as any);
  });
  process.on('uncaughtException', (err) => {
    logger.error('[Process] Uncaught exception', err as any);
  });
  scheduler.start();

  const healthLogIntervalMs = Number(process.env.HEALTH_LOG_INTERVAL_MS || 60_000);
  const interval = setInterval(() => {
    const lastRun = scheduler.getLastRunAt();
    logger.info('[Health] Process healthy', {
      pid: process.pid,
      uptimeSec: Math.floor(process.uptime()),
      lastRunAt: lastRun ? lastRun.toISOString() : null,
      now: new Date().toISOString(),
    });
  }, healthLogIntervalMs);

  const shutdown = (signal: string) => {
    logger.info(`[Main] Received ${signal}, shutting down gracefully`);
    try {
      clearInterval(interval);
      scheduler.stop();
    } catch (err) {
      logger.error('[Main] Error during shutdown', err);
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();


