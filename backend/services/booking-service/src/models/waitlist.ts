import mongoose, { Document } from "mongoose";

export interface IWaitlist extends Document {
  hotelId: string;
  userId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  desiredCheckIn: Date;
  desiredCheckOut: Date;
  createdAt: Date;
  updatedAt: Date;
}

const waitlistSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true, index: true },
    userId: { type: String },
    email: { type: String, required: true, index: true },
    firstName: { type: String },
    lastName: { type: String },
    desiredCheckIn: { type: Date, required: true, index: true },
    desiredCheckOut: { type: Date, required: true },
  },
  { timestamps: true }
);

waitlistSchema.index({ hotelId: 1, desiredCheckIn: 1 });

export default mongoose.model<IWaitlist>("Waitlist", waitlistSchema);
