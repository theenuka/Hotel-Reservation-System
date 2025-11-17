import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { enqueueNotification } from "./queue";
import { notificationConfig } from "./config";
import { resolveTemplate } from "./templates";
import { NotificationChannel, NotificationJobPayload, NotificationRequestPayload } from "./types";

const allowedChannels: NotificationChannel[] = ["email", "sms"];

const app = express();
const corsOrigins = notificationConfig.allowedOrigins.length
  ? { origin: notificationConfig.allowedOrigins, credentials: true }
  : undefined;
app.use(corsOrigins ? cors(corsOrigins) : cors());
app.use(express.json());

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
    return res.status(202).json({ accepted: true, channel: payload.channel, queued: result.queued });
  } catch (err: any) {
    console.error("[notification:enqueue:error]", err);
    return res.status(502).json({ message: "Failed to queue notification" });
  }
});

const port = process.env.PORT || 7101;
app.listen(port, () => console.log(`notification-service listening on :${port}`));
