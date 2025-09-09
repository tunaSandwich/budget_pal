# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

Budget Pal is a Node.js/TypeScript application that provides automated daily spending tracking with bank integration via Plaid and messaging via Twilio/WhatsApp.

**Core Components:**
- **Main Daemon** (`src/index.ts`): Entry point that starts the scheduler and Express server
- **Express Server** (`src/server.ts`): REST API endpoints and static file serving for Plaid Link UI
- **Scheduler Service** (`src/services/schedulerService.ts`): Cron-based daily job orchestration 
- **Plaid Service** (`src/services/plaidService.ts`): Bank account and transaction data fetching
- **Calculation Service** (`src/services/calculationService.ts`): Monthly spending calculations and reporting
- **SMS Service** (`src/services/smsService.ts`): WhatsApp/SMS messaging with Twilio integration

**Data Flow:**
1. Plaid Link UI exchanges public tokens for access tokens (stored in `src/temp_access_token.json` for dev)
2. Daily scheduler fetches transactions from Plaid API
3. Calculations service computes monthly totals and averages
4. SMS service formats and sends WhatsApp updates via Twilio

## Development Commands

**Primary Development:**
- `npm run dev` - Watch mode for main daemon (server + scheduler)
- `npm start` - Run main daemon once (server + scheduler)

**Server Only:**
- `npm run dev:server` - Watch mode for Express server only
- `npm run start:server` - Run Express server once

**Testing & Manual Execution:**
- `npm run start:now` - Run daily job once from CLI
- `npm run run:now:local` - Trigger daily job via local API call
- `npm run run:now:remote` - Trigger daily job via remote API call (requires APP_URL env)
- `npm run test:plaid` - Test Plaid API connectivity
- `npm run test:transactions` - Fetch and display recent transactions
- `npm run test:account` - List accounts and sample transactions
- `npm run test:whatsapp` - Send test WhatsApp message

## Configuration

**Access Token Management:**
- Production: Set `PLAID_ACCESS_TOKEN` environment variable
- Development: Use Plaid Link UI at `http://localhost:3000` to generate `src/temp_access_token.json`

**Scheduler Configuration:**
- `SCHEDULER_ENABLED=true/false` - Enable/disable cron scheduler
- `DAILY_SMS_TIME=08:00` - Time for daily job (HH:mm format, 24-hour)
- `TZ` - Timezone for scheduler (defaults to system timezone)

**Key Environment Variables:**
- Plaid: `PLAID_ENV`, `PLAID_CLIENT_ID`, `PLAID_SECRET`
- Twilio WhatsApp: `TWILIO_WHATSAPP_FROM`, `YOUR_WHATSAPP_NUMBER`
- Messaging: `YOUR_NAME`, `DAILY_SPENDING_LIMIT`

## Important Implementation Details

**Transaction Processing:**
- Uses `date-fns` for date calculations and month boundaries
- Plaid transactions have positive amounts for debits (money spent)
- Monthly calculations include start/end dates inclusively

**Error Handling:**
- Services use comprehensive try/catch with detailed error logging
- WhatsApp service tries multiple number format variants automatically
- Scheduler jobs are fire-and-forget with internal error handling

**File Structure:**
- ES modules with `.js` extensions in imports (TypeScript requirement)
- Configuration files in `src/config/` (mixed .js/.ts for legacy reasons)
- Test files in `tests/` directory and `src/test-*.ts` for service testing
- Static UI files in `src/public/`

**Access Token Storage:**
- Development tokens stored in `src/temp_access_token.json` (gitignored)
- Production should use `PLAID_ACCESS_TOKEN` environment variable
- Token resolution checks env var first, then falls back to temp file

## Testing Considerations

There are no formal test suites. Use the provided test scripts:
- Test Plaid connectivity before making changes to PlaidService
- Use `test:whatsapp` to verify Twilio configuration
- Use `run:now:local` to test full daily job workflow locally