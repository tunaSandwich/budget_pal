import cron, { ScheduledTask } from 'node-cron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { format as formatDateFn, startOfMonth, subMonths } from 'date-fns';
import { PlaidService } from './plaidService.js';
import { CalculationService, PlaidTransaction } from './calculationService.js';
import { SmsService } from './smsService.js';
import { logger } from '../utils/logger';

type ParsedTime = { hours: number; minutes: number };

export class SchedulerService {
  private task: ScheduledTask | null = null;
  private plaidService: PlaidService;
  private calculationService: CalculationService;
  private smsService: SmsService;
  private lastRunAt: Date | null = null;

  constructor() {
    this.plaidService = new PlaidService();
    this.calculationService = new CalculationService();
    this.smsService = new SmsService();
  }

  private parseDailyTime(input: string | undefined): ParsedTime {
    const fallback: ParsedTime = { hours: 8, minutes: 0 };
    if (!input) return fallback;
    const trimmed = input.trim();
    const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
    if (!match) {
      logger.warn(`Invalid DAILY_SMS_TIME '${input}', expected HH:mm. Falling back to 08:00.`);
      return fallback;
    }
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      logger.warn(`Out-of-range DAILY_SMS_TIME '${input}'. Falling back to 08:00.`);
      return fallback;
    }
    return { hours, minutes };
  }

  private toCronExpression(time: ParsedTime): string {
    return `${time.minutes} ${time.hours} * * *`;
  }

  private async resolvePlaidAccessToken(): Promise<string | null> {
    if (process.env.PLAID_ACCESS_TOKEN) {
      return process.env.PLAID_ACCESS_TOKEN;
    }
    // Fallback to temp file saved by the server's exchange endpoint
    try {
      const storagePath = path.join(process.cwd(), 'src', 'temp_access_token.json');
      const raw = await fs.readFile(storagePath, 'utf8');
      const parsed = JSON.parse(raw);
      const token = parsed?.access_token;
      if (typeof token === 'string' && token.length > 0) return token;
      logger.warn('temp_access_token.json found but access_token missing or invalid');
    } catch (err) {
      logger.warn('PLAID_ACCESS_TOKEN not set and temp_access_token.json not found');
    }
    return null;
  }

  private formatYMD(date: Date): string {
    return formatDateFn(date, 'yyyy-MM-dd');
  }

  async runDailyJob(): Promise<void> {
    const startedAt = new Date();
    logger.info('[Scheduler] Daily job started');
    try {
      const accessToken = await this.resolvePlaidAccessToken();
      if (!accessToken) {
        logger.error('[Scheduler] Missing Plaid access token. Skipping job.');
        return;
      }

      const now = new Date();
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const endDate = now;
      const startDate = lastMonthStart;

      const startStr = this.formatYMD(startDate);
      const endStr = this.formatYMD(endDate);

      logger.info('[Scheduler] Fetching transactions', { startStr, endStr });
      const plaidTxs = await this.plaidService.getTransactions(accessToken, startStr, endStr);

      const mapped: PlaidTransaction[] = (plaidTxs || []).map((tx: any) => ({
        date: tx.date || tx.authorized_date || tx.posted_at || tx.timestamp || new Date().toISOString().slice(0, 10),
        amount: Number(tx.amount) || 0,
      }));

      const report = this.calculationService.generateSpendingReport(mapped);
      const message = this.smsService.formatSpendingMessage(report);

      logger.info('[Scheduler] Sending WhatsApp spending update');
      await this.smsService.sendWhatsAppUpdate(message);
      this.lastRunAt = new Date();
      logger.info('[Scheduler] Daily job completed successfully');
    } catch (error) {
      const details = (error as any)?.response?.data ?? error;
      logger.error('[Scheduler] Daily job failed', details);
    } finally {
      const endedAt = new Date();
      logger.info('[Scheduler] Daily job finished', {
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        durationMs: endedAt.getTime() - startedAt.getTime(),
      });
    }
  }

  start(): void {
    const enabledRaw = (process.env.SCHEDULER_ENABLED ?? 'true').toLowerCase();
    const enabled = enabledRaw !== 'false' && enabledRaw !== '0' && enabledRaw !== 'no';
    if (!enabled) {
      logger.warn('[Scheduler] Disabled via SCHEDULER_ENABLED env var');
      return;
    }

    if (this.task) {
      logger.warn('[Scheduler] Already started');
      return;
    }

    const parsed = this.parseDailyTime(process.env.DAILY_SMS_TIME || '08:00');
    const cronExpr = this.toCronExpression(parsed);
    const tz = process.env.TZ || process.env.TIMEZONE || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    logger.info('[Scheduler] Scheduling daily job', {
      cronExpr,
      time: `${String(parsed.hours).padStart(2, '0')}:${String(parsed.minutes).padStart(2, '0')}`,
      timezone: tz,
    });

    try {
      this.task = cron.schedule(cronExpr, () => {
        // Fire and forget; errors are handled inside runDailyJob
        void this.runDailyJob();
      }, { timezone: tz });
    } catch (err) {
      logger.error('[Scheduler] Failed to schedule cron task', err);
      throw err;
    }
  }

  stop(): void {
    if (this.task) {
      try {
        this.task.stop();
        logger.info('[Scheduler] Stopped');
      } catch (err) {
        logger.error('[Scheduler] Error while stopping', err);
      } finally {
        this.task = null;
      }
    }
  }

  getLastRunAt(): Date | null {
    return this.lastRunAt;
  }
}


