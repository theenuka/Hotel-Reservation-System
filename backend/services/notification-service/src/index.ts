import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import mongoose from "mongoose";
import { enqueueNotification } from "./queue";
import { notificationConfig } from "./config";
import { resolveTemplate } from "./templates";
import { NotificationChannel, NotificationJobPayload, NotificationRequestPayload } from "./types";
import Notification from "./models/notification";
import { extractBearerToken, verifyAsgardeoJwt } from "../../../../shared/auth/asgardeo";
import { initializeScheduler } from "./scheduler";
import webpush from "web-push";

const allowedChannels: NotificationChannel[] = ["email", "sms", "push"];

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:notifications@phoenixbooking.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log("[notification-service] Web Push configured with VAPID keys");
}

// Store push subscriptions in memory (in production, use database)
const pushSubscriptions = new Map<string, webpush.PushSubscription>();

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

// ============================================================================
// PUSH NOTIFICATION ENDPOINTS
// ============================================================================

// Get VAPID public key
app.get("/push/vapid-public-key", (_req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// Subscribe to push notifications
app.post("/push/subscribe", attachUser, async (req: AuthedRequest, res: Response) => {
  const { subscription } = req.body || {};
  
  if (!subscription || !req.userId) {
    return res.status(400).json({ message: "Subscription data required" });
  }

  // Store the subscription
  pushSubscriptions.set(req.userId, subscription as webpush.PushSubscription);
  
  // Optionally store in database for persistence
  if (MONGO_URI) {
    try {
      // You could create a PushSubscription model to persist this
      console.log(`[push:subscribe] User ${req.userId} subscribed to push notifications`);
    } catch (err) {
      console.warn("[push:subscribe:db:error]", err);
    }
  }

  res.json({ success: true, message: "Successfully subscribed to push notifications" });
});

// Unsubscribe from push notifications
app.post("/push/unsubscribe", attachUser, async (req: AuthedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(400).json({ message: "User ID required" });
  }

  pushSubscriptions.delete(req.userId);
  res.json({ success: true, message: "Successfully unsubscribed from push notifications" });
});

// Send push notification to a specific user (internal use)
const sendPushNotification = async (userId: string, title: string, body: string, data?: Record<string, unknown>) => {
  const subscription = pushSubscriptions.get(userId);
  
  if (!subscription || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log(`[push:send] No subscription found for user ${userId} or VAPID not configured`);
    return false;
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title,
        body,
        icon: "/logo.png",
        badge: "/badge.png",
        data,
        timestamp: Date.now(),
      })
    );
    console.log(`[push:send] Push notification sent to user ${userId}`);
    return true;
  } catch (error: any) {
    if (error.statusCode === 410) {
      // Subscription expired or invalid
      pushSubscriptions.delete(userId);
      console.log(`[push:send] Subscription expired for user ${userId}, removed`);
    } else {
      console.error(`[push:send:error] Failed to send push to user ${userId}:`, error.message);
    }
    return false;
  }
};

// Test push notification endpoint
app.post("/push/test", attachUser, async (req: AuthedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(400).json({ message: "User ID required" });
  }

  const success = await sendPushNotification(
    req.userId,
    "Test Notification",
    "This is a test push notification from Phoenix Booking!",
    { type: "test", timestamp: Date.now() }
  );

  if (success) {
    res.json({ success: true, message: "Test notification sent" });
  } else {
    res.status(400).json({ message: "Failed to send test notification. Make sure you're subscribed." });
  }
});

// Admin endpoint to manually trigger reminders (protected by service key)
app.post("/admin/trigger-reminders", verifyServiceKey, async (req: Request, res: Response) => {
  const { sendCheckInReminders, sendCheckOutReminders } = await import("./scheduler");
  const { type } = req.body || {};
  
  try {
    if (type === "checkin" || !type) {
      await sendCheckInReminders();
    }
    if (type === "checkout" || !type) {
      await sendCheckOutReminders();
    }
    res.json({ success: true, message: `Triggered ${type || "all"} reminders` });
  } catch (error) {
    console.error("[admin:trigger-reminders]", error);
    res.status(500).json({ message: "Failed to trigger reminders" });
  }
});

const port = process.env.PORT || 7101;
app.listen(port, () => {
  console.log(`notification-service listening on :${port}`);
  // Initialize the reminder scheduler after MongoDB connects
  if (MONGO_URI) {
    initializeScheduler();
  }
});
