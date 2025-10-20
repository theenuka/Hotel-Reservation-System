# Microservices Layout

This repo now includes a 5-service MERN architecture with an API Gateway:

- backend/services/api-gateway (port 7008)
- backend/services/identity-service (port 7102)
- backend/services/hotel-service (port 7103)
- backend/services/booking-service (port 7104)
- backend/services/search-service (port 7105)
- backend/services/notification-service (port 7101)

Frontend calls the Gateway on http://localhost:7008 (set VITE_API_BASE_URL) and Vite runs on 5175 typically.

Each service requires `MONGODB_CONNECTION_STRING` in its `.env`.

Notification is internal; booking-service calls it after successful booking.

## Quick start

1. In each service folder, create a `.env` with:

```
MONGODB_CONNECTION_STRING=your_atlas_uri
FRONTEND_URL=http://localhost:5175
JWT_SECRET_KEY=your_secret            # identity-service only
STRIPE_API_KEY=sk_live_or_test        # booking-service only (optional)
NOTIFICATION_SERVICE_URL=http://localhost:7101  # booking-service only
```

2. Install deps and start (one-liner or individual):

```
(cd services/notification-service && npm i && npm run dev) &
(cd services/identity-service && npm i && npm run dev) &
(cd services/hotel-service && npm i && npm run dev) &
(cd services/booking-service && npm i && npm run dev) &
(cd services/search-service && npm i && npm run dev) &
(cd services/api-gateway && npm i && npm run dev)

Or from repo root with concurrently:

```
npm install
npm run dev
```
```

3. Frontend: set `VITE_API_BASE_URL=http://localhost:7008` in `hotel-booking-frontend/.env.local` and run Vite.

## Local development with Docker

If you prefer a local MongoDB instead of Atlas:

1. Start MongoDB:

```
npm run compose:up
```

2. Seed test data (optional):

```
npm run seed:local
```

3. Services load env from `services/.env.local` automatically when using `npm run dev`.

## Notes

- The previous monolithic backend is kept temporarily for reference during migration.
- Once all features are validated, it can be removed.
- For production, place services behind a real gateway / ingress and use a message broker for cross-service updates.
