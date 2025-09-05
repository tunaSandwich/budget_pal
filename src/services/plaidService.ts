import { CountryCode, Products, LinkTokenCreateRequest } from 'plaid';
import { plaidClient } from '../config/plaid.js';
import { logger } from '../utils/logger';

export class PlaidService {
  async createLinkToken(userId: string): Promise<string> {
    try {
      const request: LinkTokenCreateRequest = {
        user: { client_user_id: userId },
        client_name: 'Spending Tracker',
        products: ['transactions', 'auth'] as Products[],
        country_codes: ['US'] as CountryCode[],
        language: 'en',
      };
      if (process.env.PLAID_REDIRECT_URI) {
        request.redirect_uri = process.env.PLAID_REDIRECT_URI;
      }

      const response = await plaidClient.linkTokenCreate(request);
      return response.data.link_token;
    } catch (error) {
      const details = (error as any)?.response?.data ?? error;
      logger.error('Error creating link token:', details);
      throw error;
    }
  }

  async exchangePublicToken(publicToken: string): Promise<string> {
    try {
      const response = await plaidClient.itemPublicTokenExchange({ public_token: publicToken });
      return response.data.access_token;
    } catch (error) {
      const details = (error as any)?.response?.data ?? error;
      logger.error('Error exchanging public token:', details);
      throw error;
    }
  }

  async getAccounts(accessToken: string) {
    try {
      const response = await plaidClient.accountsGet({
        access_token: accessToken,
      });
      return response.data.accounts;
    } catch (error) {
      const details = (error as any)?.response?.data ?? error;
      logger.error('Error fetching accounts:', details);
      throw error;
    }
  }

  async getTransactions(accessToken: string, startDate: string, endDate: string) {
    try {
      const response = await plaidClient.transactionsGet({
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
      });
      return response.data.transactions;
    } catch (error) {
      const details = (error as any)?.response?.data ?? error;
      logger.error('Error fetching transactions:', details);
      throw error;
    }
  }
}
