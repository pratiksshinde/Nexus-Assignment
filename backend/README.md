# Nexus Mail API

Express API for the assessment email marketing app.

## Run locally

1. Copy `.env.example` to `.env` and fill in the values.
2. Use any hosted Postgres and hosted Redis connection URLs; Docker is not required.
   For Upstash, use its TLS Redis URL beginning with `rediss://`, not the REST URL.
3. Run the API and queue worker in separate terminals:

```bash
npm install
npm run dev
npm run worker
```

The API runs at `http://localhost:4000/api` by default. Sequelize creates missing tables during this assessment-stage build.

The deployed API is available at `https://nexus-assignment-rlf7.onrender.com`.

## Email and webhooks

Create a Brevo API key and verify `SENDER_EMAIL`. Configure a transactional webhook for delivered and opened events using:

```text
https://YOUR_API_HOST/api/webhooks/brevo?token=YOUR_WEBHOOK_SECRET
```

The API sends every immediate and scheduled campaign through BullMQ. Delayed jobs live in Redis, so they survive API or worker restarts.

## Deployment

Deploy the API and worker from this same repository as two processes. Give both the same environment variables. The API command is `npm start`; the worker command is `npm run worker`. Deploy the Next.js directory separately and set its `NEXT_PUBLIC_API_URL` to the public API URL ending in `/api`.

## Deliberate scope

This implements only the required assessment flow. Docker, campaign duplication, attachments, rich-text editing, complex nested audience rules, and real-time sockets are intentionally omitted.
