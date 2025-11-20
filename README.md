# Phoenix Booking – MERN microservices

A modern hotel booking platform with a React + Vite frontend and Node/Express microservices. Includes authentication, hotel search, owner management, and booking flows. Local setup uses MongoDB via Docker and an API Gateway in front of services.

## What’s inside

  - api-gateway (7008)
  - identity-service (auth/users, 7102)
  - hotel-service (hotels & owner ops, 7103)
  - search-service (search queries, 7105)
  - booking-service (7104) and notification-service (7101) are optional for local quick start

## Building release images (linux/amd64)

The kubeadm cluster runs on x86_64 EC2 nodes, so every image we push to ECR must include a `linux/amd64` variant. GitHub Actions now enforces this via `docker buildx build --platform linux/amd64`, but you can produce the same artifacts locally with the helper script:

```bash
scripts/build-linux-amd64.sh frontend asgardeo-fix-amd64
```

The script wraps `docker buildx` for all services (pass `all` to rebuild everything) and pushes to ECR by default. Set `PUSH=false` if you only need to load the resulting image into your local Docker daemon. Override `ECR_REGISTRY` or `PLATFORM` as needed.

- Frontend builds now inject the production Asgardeo + API URLs automatically. Override `FRONTEND_PUBLIC_URL`, `FRONTEND_API_BASE_URL`, or any `VITE_ASGARDEO_*` env var before running the helper if you are targeting a different host/tenant.
- GitHub Actions (`.github/workflows/build-and-deploy.yml`) passes the same build args so every pushed image contains the right client ID and redirect URLs.

### Kubernetes auth config

Apply `phoenix-booking-infra/k8s-manifests/09-asgardeo-config.yaml` to share the SPA client info with every microservice:

```bash
kubectl apply -f phoenix-booking-infra/k8s-manifests/09-asgardeo-config.yaml
```

The identity, hotel, booking, and API gateway deployments consume that ConfigMap via `envFrom`. After you update credentials, re-apply the file and roll your deployments to pick up the new values.

## Lint/build health checks

Every pull request now runs `scripts/run-ci-checks.sh`, which iterates through each backend service with `npm ci && npm run build` and finishes by linting + building the Vite frontend. Run the same script locally before pushing changes:

```bash
scripts/run-ci-checks.sh
```

Set `RUN_INSTALL=false` if you already installed dependencies and just want to re-run the builds (helpful for local iteration). The GitHub Action defined in `.github/workflows/ci.yml` caches each package-lock file, so CI catches type or lint issues before container builds kick off.

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

1) Start MongoDB (and Redis if you want queue processing)

```bash
docker compose up -d mongo redis
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
ALLOW_ROLE_FROM_REGISTER=true
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=30
PASSWORD_RESET_TOKEN_TTL_MINUTES=60
VERIFICATION_CODE_TTL_MINUTES=15
REQUIRE_VERIFIED_EMAIL_FOR_LOGIN=false
LOYALTY_POINTS_PER_CURRENCY=0.1

# Service-to-service auth
INTERNAL_SERVICE_API_KEY=local-internal-key
NOTIFICATION_SERVICE_KEY=local-internal-key

# Asgardeo (OIDC) – replace with your tenant + SPA client
ASGARDEO_TENANT_DOMAIN=your-tenant
ASGARDEO_ORG_URL=https://api.asgardeo.io/t/your-tenant
ASGARDEO_CLIENT_ID=your-spa-client-id
ASGARDEO_AUDIENCE=
ASGARDEO_ISSUER=https://api.asgardeo.io/t/your-tenant/oauth2/token
ASGARDEO_JWKS_URL=https://api.asgardeo.io/t/your-tenant/oauth2/jwks

# Notification + third-party services
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
VITE_ASGARDEO_CLIENT_ID=your-spa-client-id
VITE_ASGARDEO_BASE_URL=https://api.asgardeo.io/t/your-tenant
VITE_ASGARDEO_SIGN_IN_REDIRECT=http://localhost:5174
VITE_ASGARDEO_SIGN_OUT_REDIRECT=http://localhost:5174
VITE_ASGARDEO_SCOPES=openid profile email
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

### Configure Asgardeo (one-time)

1. In Asgardeo, create an SPA application and note the `Client ID`, tenant domain, and org URL.
2. Add `http://localhost:5174` to both authorized redirect URLs (sign-in and sign-out).
3. Under scopes, include at least `openid profile email` and any custom roles you rely on (e.g. `hotel_owner`, `admin`).
4. Copy the values into `backend/.env.local` (`ASGARDEO_*`) and `hotel-booking-frontend/.env.local` (`VITE_ASGARDEO_*`).
5. Assign roles to users in Asgardeo so the JWT contains `hotel_owner`, `admin`, or `user` claims for the new role-based gates.

## Docker (full stack)

Prefer an end-to-end containerized workflow? Every microservice now ships with a multi-stage Dockerfile and the root `docker-compose.yml` wires them together. This spins up MongoDB, Redis, all backend services, the API gateway, and the Vite/NGINX frontend with a single command.

1. Review/update `backend/.env.docker` (at minimum change `JWT_SECRET_KEY` and any third-party API keys).
2. Build the images (run from the repo root):

```bash
docker compose build
```

3. Start the full stack:

```bash
docker compose up -d
```

4. Visit the frontend at http://localhost:4173 (it talks to the gateway on http://localhost:7008).
5. Follow logs or stop the stack when you're done:

```bash
docker compose logs -f api-gateway
docker compose down        # keep volumes
docker compose down -v     # blow away Mongo/Redis data
```

Need to rebuild just one service? Swap the target name (e.g. `docker compose build hotel-service`). Want the frontend to hit a different gateway URL? Override the build arg: `docker compose build --build-arg VITE_API_BASE_URL=https://api.example.com frontend`.

| Service | Container name | Exposed port | Dockerfile |
| --- | --- | --- | --- |
| API Gateway | api-gateway | 7008 | `backend/services/api-gateway/Dockerfile` |
| Identity Service | identity-service | 7102 | `backend/services/identity-service/Dockerfile` |
| Hotel Service | hotel-service | 7103 | `backend/services/hotel-service/Dockerfile` |
| Booking Service | booking-service | 7104 | `backend/services/booking-service/Dockerfile` |
| Search Service | search-service | 7105 | `backend/services/search-service/Dockerfile` |
| Notification Service | notification-service | 7101 | `backend/services/notification-service/Dockerfile` |
| Frontend | frontend | 4173 | `hotel-booking-frontend/Dockerfile` |
| MongoDB | hotel-booking-mongo | 27018 | official `mongo:7` image |
| Redis | hotel-booking-redis | 6379 | official `redis:7-alpine` image |

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
- Authentication flows now run entirely through Asgardeo via `@asgardeo/auth-react`; the frontend requests tokens from the SDK and the gateway/backends validate them with the shared `shared/auth/asgardeo.ts` helper.
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
