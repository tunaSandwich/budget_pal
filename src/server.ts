import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs/promises';
import dotenv from 'dotenv';
import { PlaidService } from './services/plaidService.js';
import { SchedulerService } from './services/schedulerService.js';
import { logger } from './utils/logger.js';

dotenv.config();

const app = express();
const plaidService = new PlaidService();

app.use(cors());
app.use(express.json());

// Simple health endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Handle favicon explicitly
app.get('/favicon.ico', (_req, res) => {
  res.status(204).end();
});

// Trigger the daily job immediately (for live testing)
app.post('/api/run-now', (_req, res) => {
  try {
    const scheduler = new SchedulerService();
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

// Serve the Plaid Link page - inline HTML for reliability
app.get('/', (_req, res) => {
  res.send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Budget Pal - Connect Your Bank</title>
    <style>
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 32px; }
      .container { max-width: 560px; margin: 0 auto; }
      button { padding: 12px 16px; font-size: 16px; }
      pre { background: #f5f5f5; padding: 12px; overflow-x: auto; }
    </style>
    <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
  </head>
  <body>
    <div class="container">
      <h1>Budget Pal</h1>
      <p>Connect your US Bank account via Plaid.</p>
      <button id="linkButton">Connect US Bank</button>
      <p id="status"></p>
      <pre id="log"></pre>
    </div>

    <script>
      const log = (msg) => {
        const el = document.getElementById('log');
        el.textContent += (typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2)) + '\\n';
      };
      const status = (msg) => { document.getElementById('status').textContent = msg; };

      async function createLinkToken() {
        const res = await fetch('/api/create_link_token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: 'demo-user' }) });
        if (!res.ok) throw new Error('Failed to create link token');
        const data = await res.json();
        return data.link_token;
      }

      async function init() {
        try {
          status('Creating link token...');
          const linkToken = await createLinkToken();
          status('Initializing Plaid Link...');

          const handler = Plaid.create({
            token: linkToken,
            onSuccess: async (public_token) => {
              status('Exchanging public token...');
              const res = await fetch('/api/exchange_public_token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ public_token }) });
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                log(err);
                status('Failed to exchange public token');
                return;
              }
              status('Success! Access token stored on server.');
            },
            onLoad: () => { status('Plaid Link loaded.'); },
            onExit: (err, metadata) => { if (err) log(err); log(metadata); },
            receivedRedirectUri: window.location.href
          });

          document.getElementById('linkButton').addEventListener('click', () => handler.open());
        } catch (e) {
          console.error(e);
          status('Error initializing Plaid Link');
          log(e.message || e);
        }
      }
      init();
    </script>
  </body>
</html>`);
});

// Export the startServer function
export async function startServer() {
  return new Promise((resolve, reject) => {
    const PORT = Number(process.env.PORT || 3000);
    const HOST = process.env.HOST || '0.0.0.0';

    logger.info('Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      HOST: process.env.HOST,
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT
    });

    const server = app.listen(PORT, HOST, () => {
      logger.info(`✅ Server listening on http://${HOST}:${PORT}`);
      resolve(server);
    });

    server.on('error', (error) => {
      logger.error('❌ Server failed to start:', error);
      reject(error);
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, closing server...');
      server.close(() => {
        logger.info('Server closed');
      });
    });
  });
}

export default app;
