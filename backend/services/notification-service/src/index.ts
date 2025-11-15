import express from "express";
import cors from "cors";
import "dotenv/config";
import { enqueueNotification } from "./queue";
import { NotificationChannel, NotificationJobPayload } from "./types";

const allowedChannels: NotificationChannel[] = ["email", "sms"];

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "notification-service" });
});

app.post("/notify", async (req, res) => {
  const { channel = "email", type, to, subject, message, metadata, html } = req.body || {};
  if (!to || !message) {
    return res.status(400).json({ message: "'to' and 'message' are required" });
  }
  if (!allowedChannels.includes(channel)) {
    return res.status(400).json({ message: `channel '${channel}' not supported` });
  }

  const payload: NotificationJobPayload = { channel, to, subject, message, metadata, html };

  try {
    const result = await enqueueNotification(payload);
    console.log("[notification:queued]", { type, channel, to, queued: result.queued });
    return res.status(202).json({ accepted: true, channel, queued: result.queued });
  } catch (err: any) {
    console.error("[notification:enqueue:error]", err);
    return res.status(502).json({ message: "Failed to queue notification" });
  }
});

const port = process.env.PORT || 7101;
app.listen(port, () => console.log(`notification-service listening on :${port}`));
