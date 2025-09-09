import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { SchedulerService } from './services/schedulerService.js';

dotenv.config();

async function start() {
  logger.info('[Main] Budget Pal daemon starting');
  
  // Global error handlers for better visibility in Railway logs
  process.on('unhandledRejection', (reason) => {
    logger.error('[Process] Unhandled promise rejection', reason);
    process.exit(1); // Exit on unhandled rejections
  });
  
  process.on('uncaughtException', (err) => {
    logger.error('[Process] Uncaught exception', err);
    process.exit(1); // Exit on uncaught exceptions
  });

  // Start the HTTP server FIRST and wait for it
  try {
    logger.info('[Main] Starting HTTP server...');
    const { startServer } = await import('./server.js');
    await startServer(); // Make sure server actually starts
    logger.info('[Main] HTTP server started successfully');
  } catch (error) {
    logger.error('[Main] Failed to start HTTP server', error);
    process.exit(1); // Exit if server fails to start
  }

  // Only start scheduler after server is confirmed working
  try {
    logger.info('[Main] Starting scheduler...');
    const scheduler = new SchedulerService();
    scheduler.start();
    logger.info('[Main] Scheduler started successfully');

    // Health logging
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
    
  } catch (error) {
    logger.error('[Main] Failed to start scheduler', error);
    process.exit(1);
  }
}

start().catch((error) => {
  logger.error('[Main] Fatal error during startup', error);
  process.exit(1);
});
