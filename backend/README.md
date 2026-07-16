# Nexus Mail API

Express API for the assessment email marketing app.

## Run locally

1. Copy `.env.example` to `.env` and fill in the values.
2. Use hosted Postgres and Redis connection URLs. Docker is not required. The Redis URL must begin with `redis://` or `rediss://`—do not use an Upstash REST URL.
3. Run the API and worker in separate terminals:

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

Immediate and scheduled campaigns are stored as BullMQ jobs in Redis. Delayed jobs survive API and worker restarts.

## Deployment

For a zero-cost Render deployment, keep one Web Service with `npm start` and set `RUN_WORKER=true`. The API then runs the same BullMQ worker in its process.

If your host supports a separate worker service, keep `RUN_WORKER=false` on the API and start the worker with `npm run worker`. Give both services the same `DB_URL`, `REDIS_URL`, Brevo, and JWT environment variables.

Deploy the Next.js directory separately and set `BACKEND_URL` to the public backend origin.

## Deliberate scope

This implements only the required assessment flow. Docker, campaign duplication, attachments, rich-text editing, complex nested audience rules, and real-time sockets are intentionally omitted.
