# Nexus Mail API

Express API for the assessment email marketing app.

## Run locally

1. Copy `.env.example` to `.env` and fill in the values.
2. Use any hosted Postgres connection URL; Docker and Redis are not required.
3. Run the API:

```bash
npm install
npm run dev
```

The API runs at `http://localhost:4000/api` by default. Sequelize creates missing tables during this assessment-stage build.

The deployed API is available at `https://nexus-assignment-rlf7.onrender.com`.

## Email and webhooks

Create a Brevo API key and verify `SENDER_EMAIL`. Configure a transactional webhook for delivered and opened events using:

```text
https://YOUR_API_HOST/api/webhooks/brevo?token=YOUR_WEBHOOK_SECRET
```

The API checks Postgres every five seconds for scheduled campaigns. Campaign schedules survive API restarts without requiring Redis or a separate worker.

## Deployment

Deploy the API with `npm start`. Deploy the Next.js directory separately and set its `NEXT_PUBLIC_API_URL` to the public API URL ending in `/api`.

## Deliberate scope

This implements only the required assessment flow. Docker, campaign duplication, attachments, rich-text editing, complex nested audience rules, and real-time sockets are intentionally omitted.
