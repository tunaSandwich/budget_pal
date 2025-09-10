import { startOfMonth, endOfMonth, subMonths, isAfter, isBefore, isEqual, differenceInCalendarDays } from 'date-fns';
import { logger } from '../utils/logger.js';

export type PlaidTransaction = { date: string; amount: number };

export class CalculationService {
  private isWithinInclusive(date: Date, start: Date, end: Date): boolean {
    return (isAfter(date, start) || isEqual(date, start)) && (isBefore(date, end) || isEqual(date, end));
  }

  calculateMonthlySpending(transactions: PlaidTransaction[], targetMonth: Date): number {
    try {
      const monthStart = startOfMonth(targetMonth);
      const monthEnd = endOfMonth(targetMonth);
      let total = 0;
      for (const tx of transactions) {
        const txDate = new Date(tx.date);
        if (Number.isFinite(tx.amount) && tx.amount > 0 && this.isWithinInclusive(txDate, monthStart, monthEnd)) {
          total += tx.amount;
        }
      }
      return Number(total.toFixed(2));
    } catch (err) {
      logger.error('calculateMonthlySpending failed', err);
      throw err;
    }
  }

  calculateDailyAverage(transactions: PlaidTransaction[], targetMonth: Date): number {
    try {
      const monthStart = startOfMonth(targetMonth);
      const monthEnd = endOfMonth(targetMonth);
      const daysInMonth = differenceInCalendarDays(monthEnd, monthStart) + 1;
      const monthlySpent = this.calculateMonthlySpending(transactions, targetMonth);
      return Number((monthlySpent / daysInMonth).toFixed(2));
    } catch (err) {
      logger.error('calculateDailyAverage failed', err);
      throw err;
    }
  }

  generateSpendingReport(transactions: PlaidTransaction[]) {
    const now = new Date();
    const currentMonth = now;
    const lastMonth = subMonths(now, 1);

    const monthlySpent = this.calculateMonthlySpending(transactions, currentMonth);
    const lastMonthSpent = this.calculateMonthlySpending(transactions, lastMonth);
    const averageDaily = this.calculateDailyAverage(transactions, lastMonth);

    return {
      name: process.env.YOUR_NAME || 'Friend',
      dailyLimit: parseFloat(process.env.DAILY_SPENDING_LIMIT || '100'),
      monthlySpent,
      lastMonthSpent,
      averageDaily,
    };
  }
}

