import { startOfMonth, endOfMonth, subMonths, differenceInDays } from 'date-fns';
import { logger } from '../utils/logger';

type Transaction = { date: string; amount: number };

export class CalculationService {
  calculateMonthlySpending(transactions: Transaction[], targetMonth: Date): number {
    const monthStart = startOfMonth(targetMonth);
    const monthEnd = endOfMonth(targetMonth);
    
    return transactions
      .filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= monthStart && txDate <= monthEnd && tx.amount > 0;
      })
      .reduce((total, tx) => total + tx.amount, 0);
  }

  calculateDailyAverage(transactions: Transaction[], targetMonth: Date): number {
    const monthlySpent = this.calculateMonthlySpending(transactions, targetMonth);
    const monthStart = startOfMonth(targetMonth);
    const monthEnd = endOfMonth(targetMonth);
    const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
    
    return monthlySpent / daysInMonth;
  }

  generateSpendingReport(transactions: Transaction[]) {
    const now = new Date();
    const currentMonth = now;
    const lastMonth = subMonths(now, 1);

    const currentMonthSpent = this.calculateMonthlySpending(transactions, currentMonth);
    const lastMonthSpent = this.calculateMonthlySpending(transactions, lastMonth);
    const averageDaily = this.calculateDailyAverage(transactions, lastMonth);

    return {
      name: process.env.YOUR_NAME || 'Lucas',
      dailyLimit: parseFloat(process.env.DAILY_SPENDING_LIMIT) || 100,
      monthlySpent: currentMonthSpent,
      lastMonthSpent: lastMonthSpent,
      averageDaily: averageDaily,
    };
  }
}
