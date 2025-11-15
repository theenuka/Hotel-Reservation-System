import sgMail from "@sendgrid/mail";
import twilio from "twilio";
import "dotenv/config";
import { NotificationJobPayload } from "./types";

const SENDGRID_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || "no-reply@phoenix-booking.local";
const FROM_NAME = process.env.NOTIFICATION_FROM_NAME || "Phoenix Booking";
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_FROM_NUMBER;
const TWILIO_MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID;

if (SENDGRID_KEY) {
  sgMail.setApiKey(SENDGRID_KEY);
}

const twilioClient = TWILIO_SID && TWILIO_TOKEN ? twilio(TWILIO_SID, TWILIO_TOKEN) : null;

const htmlWrapper = (subject: string, body: string) => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${subject}</title>
    <style>
      body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background: #f7f7f7; padding: 24px; }
      .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 24px; box-shadow: 0 8px 30px rgba(0,0,0,0.08); }
      .brand { font-weight: 600; color: #ea580c; }
      p { line-height: 1.5; color: #1f2937; }
    </style>
  </head>
  <body>
    <div class="card">
      <p class="brand">${FROM_NAME}</p>
      <p>${body.replace(/\n/g, '<br/>')}</p>
      <p style="font-size:12px;color:#6b7280;margin-top:32px;">This message was generated automatically. Do not reply.</p>
    </div>
  </body>
</html>`;

export const sendEmail = async ({ to, subject, message, html }: NotificationJobPayload) => {
  const resolvedSubject = subject || "Phoenix Booking Notification";
  if (!SENDGRID_KEY) {
    console.log("[notification:email:mock]", { to, subject: resolvedSubject, message });
    return { mocked: true };
  }
  await sgMail.send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: resolvedSubject,
    text: message,
    html: html || htmlWrapper(resolvedSubject, message),
  });
  return { mocked: false };
};

export const sendSms = async ({ to, message }: NotificationJobPayload) => {
  if (!twilioClient || (!TWILIO_FROM && !TWILIO_MESSAGING_SERVICE_SID)) {
    console.log("[notification:sms:mock]", { to, message });
    return { mocked: true };
  }
  await twilioClient.messages.create({
    to,
    body: message,
    ...(TWILIO_MESSAGING_SERVICE_SID ? { messagingServiceSid: TWILIO_MESSAGING_SERVICE_SID } : { from: TWILIO_FROM })
  });
  return { mocked: false };
};

export const deliverNotification = async (payload: NotificationJobPayload) => {
  switch (payload.channel) {
    case "email":
      return sendEmail(payload);
    case "sms":
      return sendSms(payload);
    default:
      throw new Error(`Unsupported channel ${payload.channel}`);
  }
};
