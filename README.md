# PathWise – AI-Based Academic and Career Recommendation System

Monorepo with:

- `frontend/`: Next.js (App Router) + TypeScript + Tailwind (ShadCN-style UI components) + Framer Motion + Recharts
- `backend/`: Node.js + Express + MongoDB (Mongoose) + JWT auth (HTTP-only cookie)
- `ai-engine/`: Explainable recommendation microservice (cosine similarity + weighted scoring)
- `database/`: MongoDB Docker compose + seed dataset

## Folder structure

```
PathWise/
  frontend/
  backend/
  ai-engine/
  database/
```

## Features implemented

- **Auth**: `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`
  - Password hashing: **bcrypt**
  - Auth: **JWT** stored in **HTTP-only cookie**
- **Profile**: `POST /api/profile`, `GET /api/profile`
- **Recommendation**: `POST /api/recommend` (backend calls `ai-engine` `POST /recommend`)
  - Vectorization + **cosine similarity**
  - Weighted scoring:
    \[
    final = 0.5 * similarity + 0.3 * skillsMatch + 0.2 * academicAlignment
    \]
  - Outputs: top 3–5 careers, skill gaps, roadmap, and explanations (matched skills/interests/subjects)
- **Feedback**: `POST /api/feedback`
- **Admin (basic)**: `GET /api/admin/careers`, `POST /api/admin/careers`, `PUT /api/admin/careers/:id`

## Prerequisites

- Node.js 20+
- macOS: Homebrew + MongoDB Community Edition, or Docker Desktop if you prefer containers

## Setup (local)

### 1) Start MongoDB

From repo root:

```bash
npm run db:start
```

This project is configured for local macOS MongoDB at `mongodb://127.0.0.1:27017/pathwise`.
To avoid macOS AirTunes conflicts on some machines, the local app uses:

- Backend: `http://localhost:5050`
- AI engine: `http://localhost:7070`

If `npm run db:start` says MongoDB is not installed yet, run:

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

Optional Docker alternative:

```bash
docker compose -f database/docker-compose.yml up -d
```

### 2) Configure environment variables

Copy each example file and adjust if needed:

- `backend/.env.example` → `backend/.env`
- `ai-engine/.env.example` → `ai-engine/.env`
- `frontend/.env.example` → `frontend/.env`

### 3) Seed careers + (optional) admin user

```bash
npm run seed
```

This loads `database/seed/careers.json` into MongoDB and creates an admin user if `ADMIN_EMAIL` + `ADMIN_PASSWORD` are set in `backend/.env`.

### 4) Run everything (frontend + backend + ai-engine)

```bash
npm run dev:mac
```

Services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5050`
- AI engine: `http://localhost:7070`

## Demo flow

1. Open the app at `http://localhost:3000`
2. Go to **Auth** and sign up
3. Go to **Profile** and add:
   - Academics (subject + mark)
   - Skills and interests
4. Go to **Recommendations** and refresh
5. Rate a recommendation to store feedback

## Deployment notes (production-ready structure)

### Backend

- Set:
  - `NODE_ENV=production`
  - `COOKIE_SECURE=true`
  - `COOKIE_SAME_SITE=none` (only if frontend and backend are on different sites)
  - `FRONTEND_ORIGIN=https://your-frontend-domain`
  - `MONGODB_URI` to your managed MongoDB (Atlas, etc.)

### AI engine

- Set `BACKEND_ORIGIN=https://your-backend-domain`
- Deploy as a separate service (container or node process)

### Frontend

- Set `NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain`

## Seed dataset

Edit `database/seed/careers.json` to add/update:

- `requiredSkills`
- `interests`
- `academicStrengths`
- courses/certifications

Then rerun:

```bash
npm run seed
```
