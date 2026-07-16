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

Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Copy each `.env.example` file to its local `.env` equivalent and provide the required values. Real environment files are intentionally excluded from Git.

Set `NEXT_PUBLIC_API_URL` in the frontend deployment to the backend URL ending in `/api`. Authentication uses the secure cookie when available and a bearer token fallback for reliable Vercel-to-Render requests.
