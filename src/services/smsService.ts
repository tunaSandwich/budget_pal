import { twilioClient } from '../config/twilio.js';
import { logger } from '../utils/logger';

export class SmsService {
  async sendSpendingUpdate(message: string) {
    try {
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

  formatSpendingMessage(data: { name: string; dailyLimit: number; monthlySpent: number; lastMonthSpent: number; averageDaily: number }) {
    const { name, dailyLimit, monthlySpent, lastMonthSpent, averageDaily } = data;
    
    return `Good morning ${name}!

Today's spending limit: $${dailyLimit}
This month spent: $${monthlySpent.toFixed(2)}
Last month total: $${lastMonthSpent.toFixed(2)}
Daily average last month: $${averageDaily.toFixed(2)}

Have a great day! 💰`;
  }
}
