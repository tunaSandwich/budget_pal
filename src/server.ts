import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs/promises';
import dotenv from 'dotenv';
import { PlaidService } from './services/plaidService.js';
import { SchedulerService } from './services/schedulerService.js';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const plaidService = new PlaidService();

app.use(cors());
app.use(express.json());

// const publicDir = path.join(process.cwd(), 'src', 'public');
// app.use(express.static(publicDir));

// Simple health endpoint
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Trigger the daily job immediately (for live testing)
app.post('/api/run-now', (_req, res) => {
  try {
    const scheduler = new SchedulerService();
    // Fire-and-forget to avoid request timeouts at the edge
    void scheduler.runDailyJob();
    res.status(202).json({ ok: true, started: true });
  } catch (error) {
    logger.error('Failed to trigger daily job via /api/run-now', error);
    res.status(500).json({ ok: false, error: 'Failed to trigger job' });
  }
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
// app.get('/', (_req, res) => {
//   res.sendFile(path.join(publicDir, 'index.html'));
// });

app.get('/', (_req, res) => {
  res.send('<h1>Budget Pal Test</h1><p>Server is working!</p>');
});

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

// Debug logging
logger.info('Environment check:', {
  PORT_env: process.env.PORT,
  HOST_env: process.env.HOST,
  PORT_final: PORT,
  HOST_final: HOST
});

app.listen(PORT, HOST, () => {
  logger.info(`Server listening on http://${HOST}:${PORT}`);
  logger.info(`Railway should connect to this exact port: ${PORT}`);
});

