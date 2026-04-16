# Tracenix Frontend (Integrated MVP)

Next.js + TypeScript frontend for the Tracenix MVP.  
This frontend is API-driven and integrated with the FastAPI backend.

## 1) Requirements

- Node.js 20+
- npm
- Backend running at `http://localhost:8000` (default)

## 2) Environment

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Key variable:

- `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:8000`)

## 3) Install + Run

```bash
npm install
npm run dev
```

Frontend: [http://localhost:3000](http://localhost:3000)

## 4) Auth Bootstrap

Default backend seed account:

- Email: `admin@tracenix.com`
- Password: `admin12345`

Use this account on `/login` for local MVP verification.

## 5) Integrated MVP Screens

- `/dashboard`
- `/projects` + `/projects/{id}`
- `/documents` + `/documents/{id}`
- `/approvals`
- `/checklist`
- `/notifications`
- `/activity`
- `/users`

All above screens consume backend APIs (no operational mock dependency).

## 6) Validation

```bash
npm run lint
npm run build
```

