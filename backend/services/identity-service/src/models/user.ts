import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: "user" | "admin" | "hotel_owner";
  loyaltyPoints?: number;
}

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, enum: ["user", "admin", "hotel_owner"], default: "user" },
    loyaltyPoints: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);
