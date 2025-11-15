export type NotificationChannel = "email" | "sms";

export interface NotificationJobPayload {
  channel: NotificationChannel;
  to: string;
  subject?: string;
  message: string;
  html?: string;
  metadata?: Record<string, unknown>;
}
