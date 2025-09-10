import { twilioClient } from '../../packages/config/twilio.js';
import { logger } from '../utils/logger';

export class SmsService {
  async sendSpendingUpdate(message: string) {
    try {
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER || !process.env.YOUR_PHONE_NUMBER) {
        throw new Error('Missing Twilio configuration. Ensure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, and YOUR_PHONE_NUMBER are set.');
      }
      const result = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: process.env.YOUR_PHONE_NUMBER,
      });
      
      logger.info('SMS sent successfully:', result.sid);
      return result;
    } catch (error) {
      logger.error('Error sending SMS:', error);
      throw error;
    }
  }

  private maskNumberForLogs(input: string | undefined): string {
    if (!input) return '(empty)';
    const trimmed = input.trim();
    const last4 = trimmed.slice(-4);
    const prefix = trimmed.startsWith('whatsapp:') ? 'whatsapp:' : '';
    const hasPlus = trimmed.includes('+');
    return `${prefix}${hasPlus ? '+' : ''}***${last4}`;
  }

  private sanitizeRaw(raw: string): string {
    return raw.replace(/\s|\(|\)|-/g, '').trim();
  }

  private buildWhatsappVariants(raw: string, isFrom: boolean): string[] {
    const sanitized = this.sanitizeRaw(raw.replace(/^whatsapp:/, ''));
    const digitsWithPlus = sanitized.startsWith('+') ? sanitized : `+${sanitized}`;
    const digitsNoPlus = digitsWithPlus.replace(/^\+/, '');
    const primary = `whatsapp:${digitsWithPlus}`;
    const secondary = `whatsapp:${digitsNoPlus}`;
    const variants = [primary, secondary];
    if (!isFrom) {
      variants.push(digitsWithPlus); // try without whatsapp: prefix as a last resort
    }
    return variants;
  }

  async sendWhatsAppUpdate(message: string) {
    try {
      const fromEnv = process.env.TWILIO_WHATSAPP_FROM || '';
      const toEnv = process.env.YOUR_WHATSAPP_NUMBER || '';
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !fromEnv || !toEnv) {
        throw new Error('Missing WhatsApp configuration. Ensure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, and YOUR_WHATSAPP_NUMBER are set.');
      }

      logger.info('WhatsApp env check', {
        from_config: this.maskNumberForLogs(fromEnv),
        to_config: this.maskNumberForLogs(toEnv),
      });

      const fromVariants = this.buildWhatsappVariants(fromEnv, true);
      const toVariants = this.buildWhatsappVariants(toEnv, false);

      let lastError: unknown = undefined;
      for (const from of fromVariants) {
        for (const to of toVariants) {
          const payload = { body: message, from, to } as const;
          logger.info('Attempting WhatsApp send with payload', {
            from: this.maskNumberForLogs(from),
            to: this.maskNumberForLogs(to),
          });
          try {
            const result = await twilioClient.messages.create(payload);
            logger.info('WhatsApp message sent successfully:', result.sid);
            try {
              const status = await twilioClient.messages(result.sid).fetch();
              logger.info('Twilio delivery status', {
                sid: result.sid,
                status: status.status,
                errorCode: (status as any)?.errorCode ?? null,
                errorMessage: (status as any)?.errorMessage ?? null,
              });
            } catch (fetchErr) {
              logger.warn('Failed to fetch Twilio message status', fetchErr);
            }
            return result;
          } catch (err: any) {
            lastError = err;
            const twilioData = err?.response?.data || err?.data || err?.message || err;
            logger.error('WhatsApp send attempt failed', twilioData);
            // If error explicitly mentions invalid number, continue to next variant, else rethrow
            const msg = String(twilioData);
            const shouldTryNext = /invalid|not a valid phone number|21211|To number/i.test(msg);
            if (!shouldTryNext) throw err;
          }
        }
      }
      throw lastError ?? new Error('All WhatsApp send attempts failed for unknown reasons');
    } catch (error) {
      const details = (error as any)?.response?.data ?? error;
      logger.error('Error sending WhatsApp message (final)', details);
      throw error;
    }
  }

  async sendWhatsAppHello(toOverride?: string) {
    const text = 'hello';
    const toRaw = toOverride || process.env.YOUR_WHATSAPP_NUMBER || '';
    const fromRaw = process.env.TWILIO_WHATSAPP_FROM || '';
    logger.info('sendWhatsAppHello using', {
      from: this.maskNumberForLogs(fromRaw),
      to: this.maskNumberForLogs(toRaw),
    });
    const payload = { body: text } as any;
    const fromVariants = this.buildWhatsappVariants(fromRaw, true);
    const toVariants = this.buildWhatsappVariants(toRaw, false);
    for (const from of fromVariants) {
      for (const to of toVariants) {
        payload.from = from;
        payload.to = to;
        logger.info('Attempting WhatsApp hello with', {
          from: this.maskNumberForLogs(from),
          to: this.maskNumberForLogs(to),
        });
        try {
          const result = await twilioClient.messages.create(payload);
          logger.info('WhatsApp hello sent', result.sid);
          return result;
        } catch (err: any) {
          const twilioData = err?.response?.data || err?.data || err?.message || err;
          logger.error('WhatsApp hello failed', twilioData);
        }
      }
    }
    throw new Error('All WhatsApp hello attempts failed');
  }

  formatSpendingMessage(data: { name: string; dailyLimit: number; monthlySpent: number; lastMonthSpent: number; averageDaily: number }) {
    const { name, dailyLimit, monthlySpent, lastMonthSpent, averageDaily } = data;
    const dailyLimitStr = Number(dailyLimit).toFixed(2);
    const monthlySpentStr = Number(monthlySpent).toFixed(2);
    const lastMonthSpentStr = Number(lastMonthSpent).toFixed(2);
    const averageDailyStr = Number(averageDaily).toFixed(2);
    return `Good morning ${name}! Today's spending limit: $${dailyLimitStr}. This month spent: $${monthlySpentStr}. Last month total: $${lastMonthSpentStr}. Daily average last month: $${averageDailyStr}`;
  }
}
