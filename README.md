# Nexus Assignment

A small email marketing application built for the take-home assessment.

## Structure

- `frontend` — Next.js application
- `backend` — Express API, BullMQ worker, Sequelize/Postgres models and Brevo integration

## Run locally

Start the API:

```bash
cd backend
npm install
npm run dev
```

Start the campaign worker in another terminal:

```bash
cd backend
npm run worker
```

Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Copy each `.env.example` file to its local `.env` equivalent and provide the required values. Real environment files are intentionally excluded from Git.
