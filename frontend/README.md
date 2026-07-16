# Nexus Mail

Minimal Next.js frontend for the email marketing assessment.

## Run locally

Copy `.env.example` to `.env.local`, then run:

```bash
npm install
npm run dev
```

The deployed frontend is available at `https://nexus-assignment-six.vercel.app`. Next.js proxies `/api/*` to the Express backend at `https://nexus-assignment-rlf7.onrender.com`, keeping browser authentication same-origin.

## Included scope

- Workspace signup/login
- Contact CRUD, tags, custom fields and duplicate-aware CSV import
- Saved city, tag or custom-field audiences with contact counts
- Audience, tag or pasted-identifier campaign recipients
- Immediate and scheduled sending
- Sent, delivered and opened analytics refreshed every five seconds

The Express API, BullMQ worker, Postgres models, Brevo integration, environment variables and deployment process are documented in the backend repository.
