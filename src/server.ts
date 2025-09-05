import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs/promises';
import dotenv from 'dotenv';
import { PlaidService } from './services/plaidService.js';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const plaidService = new PlaidService();

app.use(cors());
app.use(express.json());

const publicDir = path.join(process.cwd(), 'src', 'public');
app.use(express.static(publicDir));

// Simple health endpoint
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Create a link token for the client
app.post('/api/create_link_token', async (req, res) => {
  try {
    const userId = req.body?.userId || 'demo-user';
    const linkToken = await plaidService.createLinkToken(userId);
    logger.info('Created link token');
    res.json({ link_token: linkToken });
  } catch (error) {
    logger.error('Failed to create link token', error);
    res.status(500).json({ error: 'Failed to create link token' });
  }
});

// Exchange public token and persist the access token for testing
app.post('/api/exchange_public_token', async (req, res) => {
  try {
    const publicToken = req.body?.public_token;
    if (!publicToken) {
      return res.status(400).json({ error: 'public_token is required' });
    }
    const accessToken = await plaidService.exchangePublicToken(publicToken);
    const storagePath = path.join(process.cwd(), 'src', 'temp_access_token.json');
    await fs.writeFile(storagePath, JSON.stringify({ access_token: accessToken }, null, 2), 'utf8');
    logger.info('Stored access token at src/temp_access_token.json');
    res.json({ status: 'success' });
  } catch (error) {
    logger.error('Failed to exchange public token', error);
    res.status(500).json({ error: 'Failed to exchange public token' });
  }
});

// Serve the Plaid Link page
app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  logger.info(`Server listening on http://localhost:${PORT}`);
});


