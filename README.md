## Budget Pal

Automated daily spending tracker that connects to your bank via Plaid, computes simple spending metrics, and sends a daily WhatsApp (or SMS) update via Twilio.

### Features
- **Plaid integration**: Link your bank, exchange public token, and fetch accounts/transactions.
- **Daily scheduler**: Cron-based job runs at a configurable local time to compute and send updates.
- **WhatsApp/SMS messaging**: Sends a friendly daily summary through Twilio.
- **Minimal UI**: Static page to initiate Plaid Link and save an access token locally for development.
- **Simple calculations**: Current month total, last month total, and last month daily average.

### Tech Stack
- Node.js + TypeScript (ESM) with `tsx`
- Express for APIs and static hosting
- Plaid SDK for banking data
- Twilio SDK for WhatsApp/SMS
- node-cron for scheduling

---

## Getting Started

### Prerequisites
- Node.js 18+ recommended
- Plaid account with API keys
- Twilio account with WhatsApp sender approved (or SMS number)

### Installation
```bash
npm install
```

### Environment Variables
Create a `.env` file in the project root. Values marked (optional) have defaults or are only needed for specific features.

```env
# Server / Process
PORT=3000                                 # (optional) default 3000
TZ=America/Chicago                        # (optional) timezone for scheduler
HEALTH_LOG_INTERVAL_MS=60000              # (optional) health log interval

# Plaid
PLAID_ENV=sandbox                         # sandbox | development | production
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_REDIRECT_URI=http://localhost:3000  # (optional) if using redirect flows
# Either set PLAID_ACCESS_TOKEN or connect via the web UI to create src/temp_access_token.json
PLAID_ACCESS_TOKEN=                       # (optional)

# Twilio (WhatsApp preferred)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth
TWILIO_WHATSAPP_FROM=whatsapp:+1415XXXXXXX   # WhatsApp sender (approved)
YOUR_WHATSAPP_NUMBER=whatsapp:+1XXXXXXXXXX   # Your WhatsApp number

# Twilio (SMS fallback - optional)
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX          # (optional) SMS-capable number
YOUR_PHONE_NUMBER=+1XXXXXXXXXX            # (optional) your SMS number

# Messaging / Calculations
YOUR_NAME=Friend                          # name used in the daily message
DAILY_SPENDING_LIMIT=100                  # default daily limit displayed

# Scheduler
SCHEDULER_ENABLED=true                    # set to false to disable
DAILY_SMS_TIME=08:00                      # local time HH:mm (24h)

# Remote utility (for npm run run:now:remote)
APP_URL=https://your-deployment-url
```

### Run in Development
This starts the Express server, serves the static Plaid Link UI, and runs the scheduler.
```bash
npm run dev
# or
npm start
```
Open `http://localhost:3000` and click “Connect US Bank” to run Plaid Link. On success, the app stores a development access token at `src/temp_access_token.json` for local testing (unless `PLAID_ACCESS_TOKEN` is provided).

---

## How It Works

### High-Level Flow
1. Frontend requests `/api/create_link_token` and initializes Plaid Link.
2. After a successful Link session, the client posts `public_token` to `/api/exchange_public_token`.
3. The server exchanges it for an access token and stores it (locally for dev) at `src/temp_access_token.json`.
4. The scheduler (or a manual trigger) fetches recent transactions with Plaid.
5. `CalculationService` computes monthly totals and last month’s daily average.
6. `SmsService` formats and sends a WhatsApp message via Twilio.

### Key Endpoints
- `GET /health` → simple health check.
- `POST /api/create_link_token` → returns a Plaid Link token.
- `POST /api/exchange_public_token` → body: `{ public_token: string }`; stores access token for dev.
- `POST /api/run-now` → triggers the daily job immediately (fire-and-forget).

### Scheduler
- Enabled by default. Control with `SCHEDULER_ENABLED`.
- Schedule time via `DAILY_SMS_TIME` (HH:mm, 24-hour). Timezone taken from `TZ`/`TIMEZONE` or system default.
- Manual trigger:
  - Local: `npm run run:now:local`
  - Remote: `APP_URL=https://your-app.example.com npm run run:now:remote`

---

## Scripts
```bash
npm run dev                # watch mode for main daemon (server + scheduler)
npm start                  # run main daemon once (server + scheduler)
npm run start:server       # run only the Express server
npm run dev:server         # watch mode for Express server
npm run start:now          # run the daily job once from CLI
npm run run:now:local      # POST /api/run-now on localhost:3000
npm run run:now:remote     # POST /api/run-now on $APP_URL
npm run test:plaid         # quick Plaid API connectivity test
npm run test:transactions  # fetch and summarize recent transactions via Plaid
npm run test:account       # list accounts and sample transactions
npm run test:whatsapp      # send WhatsApp hello + spending update
```

---

## File Overview
- `src/index.ts` → main entry; starts scheduler and imports `server.ts`.
- `src/server.ts` → Express server, Plaid endpoints, static UI.
- `src/services/plaidService.ts` → Plaid wrapper: create link token, exchange, fetch data.
- `src/services/schedulerService.ts` → cron job orchestration and job runner.
- `src/services/calculationService.ts` → spending calculations and report.
- `src/services/smsService.ts` → WhatsApp/SMS sending and message formatting.
- `src/public/index.html` → Plaid Link UI for local development.
- `src/utils/logger.ts` → console-based logger.

---

## Troubleshooting
- **Missing access token**: If `PLAID_ACCESS_TOKEN` is not set and `src/temp_access_token.json` doesn’t exist, open `http://localhost:3000` and complete Plaid Link.
- **Twilio WhatsApp errors**: Ensure numbers are in the form `whatsapp:+1XXXXXXXXXX` and the sender is approved. The app tries variants automatically.
- **Invalid DAILY_SMS_TIME**: Defaults to 08:00 if the format is not HH:mm.
- **Timezone issues**: Set `TZ` to your IANA timezone (e.g., `America/Chicago`).
- **Plaid environment**: Use `PLAID_ENV=sandbox` for testing unless you’ve enabled a higher tier.

---

## Security Notes
- Never commit real access tokens or secrets.
- `src/temp_access_token.json` is for development convenience; use environment variables/secrets in production.

---

## License
Proprietary/Unspecified — add a license if you plan to share or open source.


