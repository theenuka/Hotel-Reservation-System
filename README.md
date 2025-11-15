# Phoenix Booking – MERN microservices

A modern hotel booking platform with a React + Vite frontend and Node/Express microservices. Includes authentication, hotel search, owner management, and booking flows. Local setup uses MongoDB via Docker and an API Gateway in front of services.

## What’s inside

- Frontend: React + Vite + TypeScript + React Query + Tailwind (`hotel-booking-frontend`)
- Services (Node + Express + TypeScript) under `backend/services`:
  - api-gateway (7008)
  - identity-service (auth/users, 7102)
  - hotel-service (hotels & owner ops, 7103)
  - search-service (search queries, 7105)
  - booking-service (7104) and notification-service (7101) are optional for local quick start
- Database: MongoDB Docker container at localhost:27018

## Project structure

```
.
├─ docker-compose.yml              # MongoDB (27018 -> 27017 in container)
├─ package.json                    # Root scripts (dev, dev:core, seed, compose)
├─ scripts/
│  └─ seed-local.ts               # Seeds a user + a sample hotel (https image URLs)
├─ data/                           # Seed fixtures and sample images
├─ e2e-tests/                      # Playwright tests
├─ shared/
│  └─ types.ts                     # Shared TS types
├─ backend/
│  ├─ .env.example                 # Copy to .env.local and fill
│  └─ services/
│     ├─ api-gateway/              # Port 7008 (proxy to downstream services)
│     ├─ identity-service/         # Port 7102 (auth/users)
│     ├─ hotel-service/            # Port 7103 (hotels & owner ops)
│     ├─ booking-service/          # Port 7104 (optional locally)
│     ├─ search-service/           # Port 7105 (search queries)
│     └─ notification-service/     # Port 7101 (optional locally)
└─ hotel-booking-frontend/         # React + Vite app (5174)
```

## Scripts

From the repo root:

```
# Start MongoDB container
npm run compose:up

# Stop and remove MongoDB container and volume
npm run compose:down

# Start core services (gateway, identity, hotel, search)
npm run dev:core

# Start all services (includes booking and notification)
npm run dev

# Kill any stray dev service ports
npm run kill:ports

# Seed a user and one hotel (expects Mongo on 27018)
npm run seed:local
```

## Quick start

Prereqs: Node 18+, Docker Desktop

1) Start MongoDB

```bash
docker compose up -d
```

2) Create env files

- Backend (shared):

```bash
cp backend/.env.example backend/.env.local
```

Key fields in `backend/.env.local`:

```
MONGODB_CONNECTION_STRING=mongodb://localhost:27018/hotel-booking
FRONTEND_URL=http://localhost:5174
JWT_SECRET_KEY=dev_secret
# Identity security tuning (defaults shown)
ALLOW_ROLE_FROM_REGISTER=false
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=30
PASSWORD_RESET_TOKEN_TTL_MINUTES=60
VERIFICATION_CODE_TTL_MINUTES=15
REQUIRE_VERIFIED_EMAIL_FOR_LOGIN=false
SENDGRID_API_KEY=
NOTIFICATION_FROM_EMAIL=no-reply@phoenix-booking.local
NOTIFICATION_FROM_NAME=Phoenix Booking
REDIS_URL=redis://localhost:6379/0
NOTIFICATION_QUEUE_MODE=inline
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
TWILIO_MESSAGING_SERVICE_SID=
# Optional (pick one style):
# CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>?secure=true
# CLOUDINARY_CLOUD_NAME=your_cloud
# CLOUDINARY_API_KEY=your_key
# CLOUDINARY_API_SECRET=your_secret
```

- Frontend:

```bash
cp hotel-booking-frontend/.env.example hotel-booking-frontend/.env.local
```

`hotel-booking-frontend/.env.local`:

```
VITE_API_BASE_URL=http://localhost:7008
```

3) Start core services (gateway, identity, hotel, search)

```bash
npm run kill:ports
npm run dev:core
```

4) Seed sample data (optional)

```bash
npm run seed:local
```

5) Start the frontend

```bash
cd hotel-booking-frontend
npm run dev
```

Open http://localhost:5174

## Service map and routes

- Gateway 7008 proxies:
  - `/api/auth/*`, `/api/users/*` → identity-service (7102)
  - `/api/hotels/search` → search-service (7105)
  - `/api/hotels`, `/api/my-hotels` → hotel-service (7103)
- Identity service now exposes:
  - `POST /auth/request-verification`, `POST /auth/verify-email`
  - `POST /auth/request-password-reset`, `POST /auth/reset-password`
  - `POST /auth/refresh` (refresh token rotation)
  - Admin-only endpoints: `GET /admin/users`, `PATCH /admin/users/:id/role`
  - Every login/register response returns `{ accessToken, refreshToken, emailVerified }`
- Notification service now supports BullMQ-backed delivery with a Redis queue (`NOTIFICATION_QUEUE_MODE=queue`) and Twilio SMS in addition to SendGrid email. Without API keys/Redis it falls back to inline mocks and console logs.
- JWT is stored in `localStorage` under `session_id` for the frontend.
- CORS allows `FRONTEND_URL`.

## Troubleshooting

- Port already in use (EADDRINUSE):

```bash
npm run kill:ports
```

- Health checks:

```bash
curl -sS http://localhost:7008/health
curl -sS http://localhost:7102/health
curl -sS http://localhost:7103/health
curl -sS http://localhost:7101/health
curl -sS http://localhost:7105/health
```

- 504s from gateway usually mean a downstream service isn’t running yet.
- No hotel images? Ensure `imageUrls` exist or set Cloudinary vars and re-seed.
- Exit code 137/143 means a process was killed (often from port killers); restart with the scripts above.

## Notes

- This fork is branded “Phoenix Booking.” Update favicon/logo under `hotel-booking-frontend/public` if desired.
- The previous monolith and archived folders were removed to avoid duplication.

## License

MIT

---

Tip for teams: run “npm run setup:env” once to auto-create local env files from the provided examples. We intentionally do not commit .env.local files with secrets; use the examples and adjust locally.
