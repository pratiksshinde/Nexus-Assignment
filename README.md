# Nexus Assignment

A small email marketing application built for the take-home assessment.

## Live application

- Frontend: https://nexus-assignment-six.vercel.app
- Backend: https://nexus-assignment-rlf7.onrender.com

## Structure

- `frontend` — Next.js application
- `backend` — Express API, Sequelize/Postgres models and Brevo integration

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

Set `BACKEND_URL` in the frontend deployment to the backend origin. The Next.js server proxies `/api/*` requests to Express and keeps the JWT in a secure HTTP-only first-party cookie.

Campaign scheduling uses BullMQ with a hosted Redis URL. Docker is not required. Deploy the backend API and worker as separate processes with the same environment variables.
