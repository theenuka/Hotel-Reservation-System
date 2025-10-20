import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";
import "dotenv/config";
import jwt from "jsonwebtoken";

const app = express();
app.use(cors({ origin: [process.env.FRONTEND_URL || "http://localhost:5174"], credentials: true }));
app.use(morgan("dev"));
// Parse JSON bodies for logging and optional downstream forward
app.use(express.json({ limit: "1mb" }));

// Service URLs (env or defaults)
// Attach user id from JWT (if present) to downstream request headers
app.use((req, _res, next) => {
  const auth = req.headers.authorization as string | undefined;
  const token = auth?.startsWith("Bearer ") ? auth.split(" ")[1] : undefined;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || "dev_secret") as { userId?: string };
      if (decoded?.userId) {
        req.headers["x-user-id"] = decoded.userId;
      }
    } catch {
      // ignore invalid tokens, downstream will handle auth
    }
  }
  next();
});
const IDENTITY_URL = process.env.IDENTITY_SERVICE_URL || "http://localhost:7102";
const HOTEL_URL = process.env.HOTEL_SERVICE_URL || "http://localhost:7103";
const BOOKING_URL = process.env.BOOKING_SERVICE_URL || "http://localhost:7104";
const SEARCH_URL = process.env.SEARCH_SERVICE_URL || "http://localhost:7105";

// Health
app.get("/health", (_req: Request, res: Response) => res.json({ status: "ok", service: "api-gateway" }));

// Helper: forward JSON body when present (body-parser would consume it otherwise)
const forwardBodyIfPresent = (proxyReq: any, req: any) => {
  if (!req.body || Object.keys(req.body).length === 0) return;
  const contentType = req.headers["content-type"] || "application/json";
  const bodyData = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  proxyReq.setHeader("Content-Type", contentType);
  proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
  proxyReq.write(bodyData);
};

// Route mapping
// Auth endpoints -> identity-service; because Express strips mount path, manually rewrite to /auth/*
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: IDENTITY_URL,
    changeOrigin: true,
    pathRewrite: (path) => {
      // When mounted, Express strips the mount path, so path may be '/validate-token'.
      // Ensure the downstream path always starts with '/auth'.
      if (path.startsWith("/auth")) return path; // already correct
      return `/auth${path}`;
    },
    on: { proxyReq: forwardBodyIfPresent },
  })
);
// User endpoints -> identity-service; rewrite to /users/*
app.use(
  "/api/users",
  createProxyMiddleware({
    target: IDENTITY_URL,
    changeOrigin: true,
    pathRewrite: (path) => {
      // Ensure downstream path starts with '/users'
      if (path.startsWith("/users")) return path;
      return `/users${path}`;
    },
    on: { proxyReq: forwardBodyIfPresent },
  })
);

// Search goes to search-service
// Search endpoint -> search-service; rewrite to /hotels/search
app.use(
  "/api/hotels/search",
  createProxyMiddleware({
    target: SEARCH_URL,
    changeOrigin: true,
    pathRewrite: (path) => {
      // When mounted, path may be '/' or '' — normalize to '/hotels/search' + remainder
      if (path === "/" || path === "") return "/hotels/search";
      if (path.startsWith("/hotels/search")) return path;
      return `/hotels/search${path}`;
    },
    on: { proxyReq: forwardBodyIfPresent },
  })
);

// Booking flows and business insights (must be BEFORE generic /api/hotels mapping)
app.use((req, res, next) => {
  const path = req.path;
  const isBooking =
    path.startsWith("/api/my-bookings") ||
    path.startsWith("/api/bookings") ||
    (path.startsWith("/api/hotels/") && path.includes("/bookings")) ||
    path.startsWith("/api/business-insights");
  if (isBooking) {
    return createProxyMiddleware({
      target: BOOKING_URL,
      changeOrigin: true,
      pathRewrite: { "^/api": "" },
      on: { proxyReq: forwardBodyIfPresent },
    })(req, res, next);
  }
  return next();
});

// Hotel listing/details and management to hotel-service (exclude /bookings and /search handled above)
app.use((req, res, next) => {
  const path = req.path;
  const isHotel =
    (path.startsWith("/api/hotels") && !path.includes("/bookings") && !path.startsWith("/api/hotels/search")) ||
    path.startsWith("/api/my-hotels");
  if (isHotel) {
    return createProxyMiddleware({
      target: HOTEL_URL,
      changeOrigin: true,
      pathRewrite: { "^/api": "" },
      on: { proxyReq: forwardBodyIfPresent },
    })(req, res, next);
  }
  return next();
});

const port = process.env.PORT || 7008;
app.listen(port, () => console.log(`api-gateway listening on :${port}`));
