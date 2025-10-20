import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "notification-service" });
});

app.post("/notify", async (req, res) => {
  // Minimal notification microservice: logs notifications; can be extended to email/SMS.
  const { type, to, subject, message, metadata } = req.body || {};
  if (!to || !message) {
    return res.status(400).json({ message: "'to' and 'message' are required" });
  }
  // Here you'd integrate with SendGrid, SES, Twilio, etc.
  console.log("[notification]", { type, to, subject, message, metadata });
  return res.status(202).json({ accepted: true });
});

const port = process.env.PORT || 7101;
app.listen(port, () => console.log(`notification-service listening on :${port}`));
