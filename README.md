# Sentry Telegram Bridge

A Cloudflare Worker that forwards Sentry issue alerts and metric alerts to a Telegram chat.

It verifies the webhook signature and sends a message with the alert title, its details and a button that opens the alert in Sentry.

## Example messages

Issue alert:

```text
TypeError
Cannot read properties of undefined

Project: example-project
Environment: production
Level: error

[Open in Sentry]
```

Metric alert:

```text
Critical: Too many errors
1000 events in the last 10 minutes

Project: example-project
Environment: production
Status: critical

[Open in Sentry]
```

## Setup

### 1. Create a Telegram bot

1. Create a bot with [BotFather](https://t.me/BotFather) and copy its token.
2. Add the bot to the chat that should receive the alerts.
3. Find the chat ID with [IDBot](https://t.me/myidbot), which replies with your own ID or the ID of your group.

### 2. Deploy the Worker

```bash
npm install
```

```bash
npm run deploy
```

Note the Worker URL from the output, you need it in the next step.

### 3. Create a Sentry integration

1. In Sentry, go to **Settings > Developer Settings** and create an internal integration.
2. Set the **Webhook URL** to your Worker URL.
3. Enable the **Alert Action** toggle.
4. Save the integration and copy its **Client Secret**.
5. Add the integration as an action to each issue or metric alert rule that should notify Telegram.

### 4. Configure the secrets

Run each command and enter the value when prompted:

```bash
npx wrangler secret put SENTRY_CLIENT_SECRET
```

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
```

```bash
npx wrangler secret put TELEGRAM_CHAT_ID
```

## Development

```bash
npm test
```

```bash
npm run dev
```
