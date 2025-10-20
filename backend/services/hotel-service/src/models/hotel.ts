import mongoose, { Document } from "mongoose";

export interface IHotel extends Document {
  _id: string;
  userId: string;
  name: string;
  city: string;
  country: string;
  description: string;
  type: string[];
  adultCount: number;
  childCount: number;
  facilities: string[];
  pricePerNight: number;
  starRating: number;
  imageUrls: string[];
  lastUpdated: Date;
  totalBookings?: number;
  totalRevenue?: number;
}

const hotelSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    city: { type: String, required: true, index: true },
    country: { type: String, required: true, index: true },
    description: { type: String, required: true },
    type: [{ type: String }],
    adultCount: { type: Number, required: true },
    childCount: { type: Number, required: true },
    facilities: [{ type: String }],
    pricePerNight: { type: Number, required: true, index: true },
    starRating: { type: Number, required: true, index: true },
    imageUrls: [{ type: String }],
    lastUpdated: { type: Date, default: Date.now, index: true },
    totalBookings: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 }
  },
  { timestamps: true }
);

hotelSchema.index({ city: 1, country: 1, starRating: -1 });

export default mongoose.model<IHotel>("Hotel", hotelSchema);
