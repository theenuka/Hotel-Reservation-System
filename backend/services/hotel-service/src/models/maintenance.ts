import mongoose, { Document } from "mongoose";

export interface IMaintenance extends Document {
  hotelId: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const maintenanceSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true, index: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    reason: { type: String },
  },
  { timestamps: true }
);

maintenanceSchema.index({ hotelId: 1, startDate: 1 });

export default mongoose.model<IMaintenance>("Maintenance", maintenanceSchema);
