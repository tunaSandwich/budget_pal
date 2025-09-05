import { Configuration, PlaidApi, PlaidEnvironments, TransactionsGetRequest } from 'plaid';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import { formatISO, subDays } from 'date-fns';

dotenv.config();

// Initialize Plaid client (same pattern as tests/test.plaid.ts)
const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
      'PLAID-SECRET': process.env.PLAID_SECRET!,
    },
  },
});

const client = new PlaidApi(configuration);

async function readAccessToken(): Promise<string> {
  // Prefer env var; fallback to the token saved by the server script
  const fromEnv = process.env.PLAID_ACCESS_TOKEN;
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv.trim();

  try {
    const raw = await fs.readFile('src/temp_access_token.json', 'utf8');
    const json = JSON.parse(raw);
    if (!json?.access_token) throw new Error('access_token missing in src/temp_access_token.json');
    return json.access_token as string;
  } catch (e) {
    throw new Error('No access token found. Set PLAID_ACCESS_TOKEN in your environment or connect via the web UI to create src/temp_access_token.json');
  }
}

async function main(): Promise<void> {
  try {
    const accessToken = await readAccessToken();

    const endDate = formatISO(new Date(), { representation: 'date' });
    const startDate = formatISO(subDays(new Date(), 30), { representation: 'date' });

    const request: TransactionsGetRequest = {
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
      options: { count: 100, offset: 0 },
    };

    console.log('🔍 Fetching transactions for last 30 days...');
    const response = await client.transactionsGet(request);
    const transactions = response.data.transactions;

    if (!transactions || transactions.length === 0) {
      console.log('No transactions returned for the date range.');
      return;
    }

    // Show a concise sample
    console.log('\nSample transactions (up to 10):');
    transactions.slice(0, 10).forEach((t) => {
      const amount = Number(t.amount).toFixed(2);
      console.log(`${t.date}  $${amount}  ${t.name}`);
    });

    // Sum positive spending amounts
    const totalSpending = transactions
      .filter((t) => typeof t.amount === 'number' && t.amount > 0)
      .reduce((sum, t) => sum + (t.amount as number), 0);

    console.log(`\n🧮 Total spending (positive amounts) over 30 days: $${totalSpending.toFixed(2)}`);
  } catch (error: any) {
    console.error('❌ Error fetching transactions:');
    console.error(error.response?.data || error.message || error);
    process.exit(1);
  }
}

main();


