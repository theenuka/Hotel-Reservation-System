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
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  policies?: {
    checkInTime?: string;
    checkOutTime?: string;
    cancellationPolicy?: string;
    petPolicy?: string;
    smokingPolicy?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      zipCode?: string;
    };
  };
  amenities?: {
    parking?: boolean;
    wifi?: boolean;
    pool?: boolean;
    gym?: boolean;
    spa?: boolean;
    restaurant?: boolean;
    bar?: boolean;
    airportShuttle?: boolean;
    businessCenter?: boolean;
  };
  totalBookings?: number;
  totalRevenue?: number;
}

const nestedOptions = { _id: false, id: false } as const;

const contactSchema = new mongoose.Schema(
  {
    phone: { type: String },
    email: { type: String },
    website: { type: String },
  },
  nestedOptions
);

const addressSchema = new mongoose.Schema(
  {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
  },
  nestedOptions
);

const locationSchema = new mongoose.Schema(
  {
    latitude: Number,
    longitude: Number,
    address: addressSchema,
  },
  nestedOptions
);

const policiesSchema = new mongoose.Schema(
  {
    checkInTime: String,
    checkOutTime: String,
    cancellationPolicy: String,
    petPolicy: String,
    smokingPolicy: String,
  },
  nestedOptions
);

const amenitiesSchema = new mongoose.Schema(
  {
    parking: Boolean,
    wifi: Boolean,
    pool: Boolean,
    gym: Boolean,
    spa: Boolean,
    restaurant: Boolean,
    bar: Boolean,
    airportShuttle: Boolean,
    businessCenter: Boolean,
  },
  nestedOptions
);

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
    totalRevenue: { type: Number, default: 0 },
    contact: contactSchema,
    policies: policiesSchema,
    location: locationSchema,
    amenities: amenitiesSchema,
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

hotelSchema.index({ city: 1, country: 1, starRating: -1 });

export default mongoose.model<IHotel>("Hotel", hotelSchema);
