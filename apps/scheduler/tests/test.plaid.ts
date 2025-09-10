import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products } from 'plaid';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Plaid client
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

async function testPlaidConnection(): Promise<void> {
  try {
    console.log('🔗 Testing Plaid connection...');
    
    // Create a link token for testing
    const linkTokenRequest = {
      user: {
        client_user_id: 'lucas_garza_budget_pal'
      },
      client_name: 'Lucas Budget Pal',
      products: ['transactions' as const, 'auth' as const] as Products[],
      country_codes: ['US' as const] as CountryCode[],
      language: 'en' as const,
    };

    const linkTokenResponse = await client.linkTokenCreate(linkTokenRequest);
    console.log('Plaid connection successful');
    console.log('🔑 Link token created:', linkTokenResponse.data.link_token.substring(0, 20) + '...');
    
    console.log('\n📋 Next steps:');
    console.log('1. ✅ Plaid API credentials work');
    console.log('2. 🏦 Ready to connect your US Bank account');
    console.log('3. 📱 Next: Set up SMS service');
    
  } catch (error: any) {
    console.error('❌ Error testing Plaid connection:');
    console.error(error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testPlaidConnection();
