import dotenv from 'dotenv';
import { SchedulerService } from './services/schedulerService.js';
import { logger } from './utils/logger';

dotenv.config();

async function main() {
  logger.info('[TestRun] Triggering daily job immediately');
  const scheduler = new SchedulerService();
  await scheduler.runDailyJob();
  logger.info('[TestRun] Done');
}

main().catch((err) => {
  logger.error('[TestRun] Failed', err);
  process.exit(1);
});


