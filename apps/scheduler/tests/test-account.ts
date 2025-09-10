import fs from 'node:fs/promises';
import { formatISO, subDays } from 'date-fns';
import dotenv from 'dotenv';
import { PlaidService } from '../../../packages/services/plaidService.js';
import { logger } from '../../../packages//utils/logger.js';

dotenv.config();

async function readAccessToken(): Promise<string> {
  const raw = await fs.readFile('../../../src/temp_access_token.json', 'utf8');
  const json = JSON.parse(raw);
  const token = json?.access_token;
  if (!token) throw new Error('No access_token found. Connect your bank first via http://localhost:3000');
  return token;
}

async function main() {
  try {
    const accessToken = await readAccessToken();
    const plaid = new PlaidService();

    logger.info('Fetching accounts...');
    const accounts = await plaid.getAccounts(accessToken);
    for (const acct of accounts) {
      const name = acct.name || acct.official_name || 'Account';
      const balance = acct.balances?.current ?? acct.balances?.available ?? 0;
      logger.info(`Account: ${name} | Type: ${acct.type} | Balance: $${balance}`);
    }

    const endDate = formatISO(new Date(), { representation: 'date' });
    const startDate = formatISO(subDays(new Date(), 30), { representation: 'date' });
    logger.info(`Fetching transactions from ${startDate} to ${endDate} ...`);
    const transactions = await plaid.getTransactions(accessToken, startDate, endDate);
    logger.info(`Transactions (${transactions.length}):`);
    for (const t of transactions.slice(0, 10)) {
      logger.info(`${t.date} | ${t.name} | $${t.amount} | ${t.account_owner || ''}`);
    }
  } catch (error) {
    logger.error('Test failed', error);
    process.exitCode = 1;
  }
}

main();


