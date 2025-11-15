import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import "dotenv/config";
import Hotel from "./models/hotel";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";
import Maintenance from "./models/maintenance";

const app = express();
app.use(cors({ origin: [process.env.FRONTEND_URL || "http://localhost:5174"], credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

const MONGO_URI = process.env.MONGODB_CONNECTION_STRING as string;
if (!MONGO_URI) { console.error("MONGODB_CONNECTION_STRING missing"); process.exit(1); }
const connectWithRetry = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("hotel-service connected to MongoDB");
  } catch (e: any) {
    console.error("Mongo connect failed, retrying in 5s:", e?.message || e);
    setTimeout(connectWithRetry, 5000);
  }
};
connectWithRetry();

app.get("/health", (_req: Request, res: Response) => res.json({ status: "ok", service: "hotel-service" }));

app.get("/hotels", async (_req: Request, res: Response) => {
  const hotels = await Hotel.find({ imageUrls: { $exists: true, $ne: [] } }).sort("-lastUpdated");
  res.json(hotels);
});

app.get("/hotels/:id", async (req: Request, res: Response) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) return res.status(404).json({ message: "Hotel not found" });
  res.json(hotel);
});

// JWT middleware (shared secret for demo)
const JWT_SECRET = process.env.JWT_SECRET_KEY || "dev_secret";
const verifyToken = (req: Request & { userId?: string; role?: string }, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.split(" ")[1] : undefined;
  if (!token) return res.status(401).json({ message: "unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role?: string };
    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch {
    return res.status(401).json({ message: "invalid token" });
  }
};

// Guard: only hotel owners (or admins) can manage my-hotels
const requireOwner = (req: Request & { role?: string }, res: Response, next: NextFunction) => {
  const roleHeader = (req.headers["x-user-role"] as string | undefined) || req.role;
  if (roleHeader === "hotel_owner" || roleHeader === "admin") return next();
  return res.status(403).json({ message: "forbidden: owner role required" });
};

// Multer for multipart forms (we ignore file bytes for now and use provided imageUrls)
const upload = multer({ storage: multer.memoryStorage() });

const extractIndexedValues = (body: any, key: string): string[] => {
  const values: { index: number; value: string }[] = [];
  const pattern = new RegExp(`^${key}\\[(\\d+)\\]$`);
  Object.keys(body || {}).forEach((k) => {
    const match = k.match(pattern);
    if (match) {
      values.push({ index: parseInt(match[1], 10), value: body[k] });
    }
  });
  return values.sort((a, b) => a.index - b.index).map((entry) => entry.value).filter(Boolean);
};

// Helper to extract imageUrls array from multipart fields like imageUrls[0], imageUrls[1]
const extractImageUrls = (body: any): string[] => {
  const direct = body.imageUrls;
  if (Array.isArray(direct)) return direct.filter(Boolean);
  if (typeof direct === "string" && direct.length > 0) return [direct];
  return extractIndexedValues(body, "imageUrls");
};

const extractArrayField = (body: any, field: string): string[] => {
  const direct = body[field];
  if (Array.isArray(direct)) return direct.filter(Boolean);
  if (typeof direct === "string" && direct.length > 0) return [direct];
  return extractIndexedValues(body, field);
};

const toNumber = (value: any): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
};

const toBoolean = (value: any): boolean | undefined => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const lowered = value.toLowerCase();
    if (["true", "1", "yes", "on"].includes(lowered)) return true;
    if (["false", "0", "no", "off"].includes(lowered)) return false;
  }
  return undefined;
};

const getNestedValue = (body: any, path: string): any => {
  if (!body || typeof body !== "object") return undefined;
  if (Object.prototype.hasOwnProperty.call(body, path)) return body[path];
  const segments = path.split(".");
  let cursor: any = body;
  for (const segment of segments) {
    if (cursor && typeof cursor === "object" && Object.prototype.hasOwnProperty.call(cursor, segment)) {
      cursor = cursor[segment];
    } else {
      return undefined;
    }
  }
  return cursor;
};

const sanitizeString = (value: any): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
};

const buildContact = (body: any) => {
  const phone = sanitizeString(getNestedValue(body, "contact.phone"));
  const email = sanitizeString(getNestedValue(body, "contact.email"));
  const website = sanitizeString(getNestedValue(body, "contact.website"));
  if (!phone && !email && !website) return undefined;
  return { phone, email, website };
};

const buildPolicies = (body: any) => {
  const policies = {
    checkInTime: sanitizeString(getNestedValue(body, "policies.checkInTime")),
    checkOutTime: sanitizeString(getNestedValue(body, "policies.checkOutTime")),
    cancellationPolicy: sanitizeString(getNestedValue(body, "policies.cancellationPolicy")),
    petPolicy: sanitizeString(getNestedValue(body, "policies.petPolicy")),
    smokingPolicy: sanitizeString(getNestedValue(body, "policies.smokingPolicy")),
  };
  if (Object.values(policies).every((value) => !value)) return undefined;
  return policies;
};

const parseJsonIfNeeded = (value: any) => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  return typeof value === "object" ? value : undefined;
};

const buildLocation = (body: any) => {
  const raw = parseJsonIfNeeded(body.location) || body.location;
  const latitude = toNumber(raw?.latitude ?? getNestedValue(body, "location.latitude"));
  const longitude = toNumber(raw?.longitude ?? getNestedValue(body, "location.longitude"));
  const address = raw?.address || getNestedValue(body, "location.address");
  const normalizedAddress = address && typeof address === "object" ? {
    street: sanitizeString(address.street ?? getNestedValue(body, "location.address.street")),
    city: sanitizeString(address.city ?? getNestedValue(body, "location.address.city")),
    state: sanitizeString(address.state ?? getNestedValue(body, "location.address.state")),
    country: sanitizeString(address.country ?? getNestedValue(body, "location.address.country")),
    zipCode: sanitizeString(address.zipCode ?? getNestedValue(body, "location.address.zipCode")),
  } : undefined;
  if (!latitude && !longitude && (!normalizedAddress || Object.values(normalizedAddress).every((v) => !v))) {
    return undefined;
  }
  return { latitude, longitude, address: normalizedAddress };
};

const buildAmenities = (body: any) => {
  const amenities = {
    parking: toBoolean(getNestedValue(body, "amenities.parking")),
    wifi: toBoolean(getNestedValue(body, "amenities.wifi")),
    pool: toBoolean(getNestedValue(body, "amenities.pool")),
    gym: toBoolean(getNestedValue(body, "amenities.gym")),
    spa: toBoolean(getNestedValue(body, "amenities.spa")),
    restaurant: toBoolean(getNestedValue(body, "amenities.restaurant")),
    bar: toBoolean(getNestedValue(body, "amenities.bar")),
    airportShuttle: toBoolean(getNestedValue(body, "amenities.airportShuttle")),
    businessCenter: toBoolean(getNestedValue(body, "amenities.businessCenter")),
  };
  if (Object.values(amenities).every((value) => value === undefined)) return undefined;
  return amenities;
};

const buildHotelPayload = (body: any) => {
  const payload: any = {
    name: sanitizeString(body.name),
    city: sanitizeString(body.city),
    country: sanitizeString(body.country),
    description: sanitizeString(body.description),
    type: extractArrayField(body, "type"),
    facilities: extractArrayField(body, "facilities"),
  };

  const pricePerNight = toNumber(body.pricePerNight);
  if (pricePerNight !== undefined) payload.pricePerNight = pricePerNight;

  const starRating = toNumber(body.starRating);
  if (starRating !== undefined) payload.starRating = starRating;

  const adultCount = toNumber(body.adultCount);
  if (adultCount !== undefined) payload.adultCount = adultCount;

  const childCount = toNumber(body.childCount);
  if (childCount !== undefined) payload.childCount = childCount;

  const contact = buildContact(body);
  if (contact) payload.contact = contact;

  const policies = buildPolicies(body);
  if (policies) payload.policies = policies;

  const location = buildLocation(body);
  if (location) payload.location = location;

  const amenities = buildAmenities(body);
  if (amenities) payload.amenities = amenities;

  const isFeatured = toBoolean(body.isFeatured);
  if (isFeatured !== undefined) payload.isFeatured = isFeatured;
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });
  return payload;
};

// Configure Cloudinary if env exists
const hasCloudinary = !!(
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
);
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
} else if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const uploadToCloudinary = async (files: Express.Multer.File[]): Promise<string[]> => {
  if (!hasCloudinary || !files || files.length === 0) return [];
  const uploads = files.map(async (file) => {
    const b64 = file.buffer.toString("base64");
    const dataUri = `data:${file.mimetype};base64,${b64}`;
    const res = await cloudinary.uploader.upload(dataUri, { folder: "hotel-images" });
    return res.secure_url;
  });
  return Promise.all(uploads);
};

// My Hotels (owner)
app.get("/my-hotels", verifyToken, requireOwner, async (req: Request & { userId?: string }, res: Response) => {
  const hotels = await Hotel.find({ userId: req.userId }).sort("-lastUpdated");
  res.json(hotels);
});

app.get("/my-hotels/:id", verifyToken, requireOwner, async (req: Request & { userId?: string }, res: Response) => {
  const hotel = await Hotel.findOne({ _id: req.params.id, userId: req.userId });
  if (!hotel) return res.status(404).json({ message: "Hotel not found" });
  res.json(hotel);
});

app.post("/my-hotels", verifyToken, requireOwner, upload.array("imageFiles", 6), async (req: Request & { userId?: string }, res: Response) => {
  const uploaded = await uploadToCloudinary((req.files as Express.Multer.File[]) || []);
  let imageUrls = uploaded.length > 0 ? uploaded : extractImageUrls(req.body);
  if (!Array.isArray(imageUrls)) imageUrls = imageUrls ? [imageUrls as any] : [];
  const payload = buildHotelPayload(req.body);
  const hotel = await new Hotel({
    ...payload,
    imageUrls,
    userId: req.userId,
    lastUpdated: new Date(),
  }).save();
  res.json(hotel);
});

app.put("/my-hotels/:id", verifyToken, requireOwner, upload.array("imageFiles", 6), async (req: Request & { userId?: string }, res: Response) => {
  const uploaded = await uploadToCloudinary((req.files as Express.Multer.File[]) || []);
  let imageUrls = uploaded.length > 0 ? uploaded : extractImageUrls(req.body);
  if (!Array.isArray(imageUrls)) imageUrls = imageUrls ? [imageUrls as any] : [];
  const payload = buildHotelPayload(req.body);
  const updated = await Hotel.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { ...payload, imageUrls, lastUpdated: new Date() },
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: "Hotel not found" });
  res.json(updated);
});

// Delete a hotel
app.delete("/my-hotels/:id", verifyToken, requireOwner, async (req: Request & { userId?: string }, res: Response) => {
  const deleted = await Hotel.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!deleted) return res.status(404).json({ message: "Hotel not found" });
  res.json({ success: true });
});

// --- Maintenance windows (owner) ---
app.get("/my-hotels/:id/maintenance", verifyToken, requireOwner, async (req: Request & { userId?: string }, res: Response) => {
  const hotel = await Hotel.findOne({ _id: req.params.id, userId: req.userId });
  if (!hotel) return res.status(404).json({ message: "Hotel not found" });
  const items = await Maintenance.find({ hotelId: req.params.id }).sort({ startDate: 1 });
  res.json(items);
});

app.post("/my-hotels/:id/maintenance", verifyToken, requireOwner, async (req: Request & { userId?: string }, res: Response) => {
  const hotel = await Hotel.findOne({ _id: req.params.id, userId: req.userId });
  if (!hotel) return res.status(404).json({ message: "Hotel not found" });
  const { title, description, startDate, endDate } = req.body || {};
  const sd = new Date(startDate);
  const ed = new Date(endDate);
  if (!startDate || !endDate || isNaN(sd.getTime()) || isNaN(ed.getTime()) || sd >= ed) {
    return res.status(400).json({ message: "Invalid start/end dates" });
  }
  const existing = await Maintenance.findOne({ hotelId: req.params.id, startDate: { $lt: ed }, endDate: { $gt: sd } });
  if (existing) return res.status(409).json({ message: "Overlaps an existing maintenance window" });
  const item = await new Maintenance({ hotelId: req.params.id, title, description, startDate: sd, endDate: ed }).save();
  res.status(201).json(item);
});

app.delete("/my-hotels/:id/maintenance/:mid", verifyToken, requireOwner, async (req: Request & { userId?: string }, res: Response) => {
  const hotel = await Hotel.findOne({ _id: req.params.id, userId: req.userId });
  if (!hotel) return res.status(404).json({ message: "Hotel not found" });
  const deleted = await Maintenance.findOneAndDelete({ _id: req.params.mid, hotelId: req.params.id });
  if (!deleted) return res.status(404).json({ message: "Maintenance not found" });
  res.json({ success: true });
});

const port = process.env.PORT || 7103;
app.listen(port, () => console.log(`hotel-service listening on :${port}`));
