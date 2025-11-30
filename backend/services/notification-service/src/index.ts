import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import mongoose from "mongoose";
import { enqueueNotification } from "./queue";
import { notificationConfig } from "./config";
import { resolveTemplate } from "./templates";
import { NotificationChannel, NotificationJobPayload, NotificationRequestPayload } from "./types";
import Notification from "./models/notification";
import { extractBearerToken, verifyAsgardeoJwt } from "../../../../shared/auth/asgardeo";

const allowedChannels: NotificationChannel[] = ["email", "sms"];

const app = express();
const corsOrigins = notificationConfig.allowedOrigins.length
  ? { origin: notificationConfig.allowedOrigins, credentials: true }
  : undefined;
app.use(corsOrigins ? cors(corsOrigins) : cors());
app.use(express.json());

// MongoDB connection
const MONGO_URI = process.env.MONGODB_CONNECTION_STRING as string;
if (MONGO_URI) {
  const connectWithRetry = async () => {
    try {
      await mongoose.connect(MONGO_URI);
      console.log("notification-service connected to MongoDB");
    } catch (e: any) {
      console.error("Mongo connect failed, retrying in 5s:", e?.message || e);
      setTimeout(connectWithRetry, 5000);
    }
  };
  connectWithRetry();
}

// Auth middleware for user notification endpoints
type AuthedRequest = Request & { userId?: string; roles?: string[] };
const attachUser = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  // Check gateway headers first
  const headerUserId = req.headers["x-user-id"] as string | undefined;
  const headerRoles = (req.headers["x-user-roles"] as string | undefined)?.split(",").filter(Boolean);
  if (headerUserId) {
    req.userId = headerUserId;
    req.roles = headerRoles;
    return next();
  }

  // Try JWT verification
  const token = extractBearerToken(req.headers.authorization as string | undefined);
  if (!token) return res.status(401).json({ message: "unauthorized" });

  try {
    const user = await verifyAsgardeoJwt(token);
    req.userId = user.userId;
    req.roles = user.roles;
    next();
  } catch (error) {
    console.warn("[notification-service] token verification failed", (error as Error)?.message || error);
    return res.status(401).json({ message: "unauthorized" });
  }
};

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "notification-service" });
});

const verifyServiceKey = (req: Request, res: Response, next: NextFunction) => {
  if (notificationConfig.disableAuth || !notificationConfig.serviceKey) return next();
  const provided = (req.headers["x-service-key"] || req.headers["x-api-key"]) as string | undefined;
  if (provided && provided === notificationConfig.serviceKey) return next();
  return res.status(401).json({ message: "invalid service key" });
};

app.post("/notify", verifyServiceKey, async (req: Request, res: Response) => {
  const { channel = "email", type, to, subject, message, metadata, html } = (req.body || {}) as NotificationRequestPayload;
  if (!to) {
    return res.status(400).json({ message: "'to' is required" });
  }
  if (!allowedChannels.includes(channel || "email")) {
    return res.status(400).json({ message: `channel '${channel}' not supported` });
  }

  const template = resolveTemplate(type, { subject, text: message, message, html, metadata });
  if (!template.text) {
    return res.status(400).json({ message: "Message body is required" });
  }

  const payload: NotificationJobPayload = {
    type,
    channel: channel || "email",
    to,
    subject: template.subject,
    message: template.text,
    html: template.html,
    metadata,
  };

  try {
    const result = await enqueueNotification(payload);
    console.log("[notification:queued]", { type, channel: payload.channel, to, queued: result.queued });
    
    // Also store notification in database if userId provided in metadata
    const userId = metadata?.userId as string | undefined;
    if (userId && MONGO_URI) {
      try {
        await Notification.create({
          userId,
          type: mapNotificationType(type),
          title: template.subject || type || "Notification",
          message: template.text,
          link: metadata?.link as string | undefined,
          metadata,
        });
      } catch (dbErr) {
        console.warn("[notification:db:error]", dbErr);
      }
    }
    
    return res.status(202).json({ accepted: true, channel: payload.channel, queued: result.queued });
  } catch (err: any) {
    console.error("[notification:enqueue:error]", err);
    return res.status(502).json({ message: "Failed to queue notification" });
  }
});

// Helper to map notification type to category
const mapNotificationType = (type?: string): "booking" | "reminder" | "promotion" | "system" => {
  if (!type) return "system";
  if (type.includes("booking") || type.includes("waitlist")) return "booking";
  if (type.includes("reminder")) return "reminder";
  if (type.includes("promo") || type.includes("offer")) return "promotion";
  return "system";
};

// User notification endpoints
app.get("/notifications", attachUser, async (req: AuthedRequest, res: Response) => {
  if (!MONGO_URI) return res.json([]);
  const notifications = await Notification.find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  res.json(notifications);
});

app.get("/notifications/unread-count", attachUser, async (req: AuthedRequest, res: Response) => {
  if (!MONGO_URI) return res.json({ count: 0 });
  const count = await Notification.countDocuments({ userId: req.userId, read: false });
  res.json({ count });
});

app.patch("/notifications/:id/read", attachUser, async (req: AuthedRequest, res: Response) => {
  if (!MONGO_URI) return res.json({ success: true });
  await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { read: true }
  );
  res.json({ success: true });
});

app.patch("/notifications/read-all", attachUser, async (req: AuthedRequest, res: Response) => {
  if (!MONGO_URI) return res.json({ success: true });
  await Notification.updateMany({ userId: req.userId, read: false }, { read: true });
  res.json({ success: true });
});

const port = process.env.PORT || 7101;
app.listen(port, () => console.log(`notification-service listening on :${port}`));
