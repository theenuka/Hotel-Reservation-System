import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import "dotenv/config";
import Hotel, {
  AmenityGroups,
  ContactInfo,
  FacilitySpace,
  HighlightInfo,
  LocationInfo,
  PolicyInfo,
} from "./models/hotel";
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

const isEmpty = (value: unknown) => value === undefined || value === null || value === "";

const normalizeArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String).map((v) => v.trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
};

const buildIndexedArrayExtractor = (key: string) => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^${escaped}\\[(\\d+)\\]$`);
  return (body: any) => {
    const direct = normalizeArray(body?.[key]);
    if (direct.length) return direct;
    const indexed: { index: number; value: string }[] = [];
    Object.keys(body || {}).forEach((k) => {
      const match = k.match(regex);
      if (match) {
        indexed.push({ index: Number(match[1]), value: body[k] });
      }
    });
    return indexed.sort((a, b) => a.index - b.index).map((entry) => entry.value).filter(Boolean);
  };
};

const extractImageUrls = buildIndexedArrayExtractor("imageUrls");
const extractFacilities = buildIndexedArrayExtractor("facilities");
const extractTags = buildIndexedArrayExtractor("tags");
const extractTypes = buildIndexedArrayExtractor("type");

const parseJSONField = <T>(value: unknown): T | undefined => {
  if (!value) return undefined;
  if (typeof value === "object") return value as T;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const coerceNumber = (value: unknown, fallback?: number) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const coerceBoolean = (value: unknown, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lowered = value.toLowerCase();
    if (["true", "1", "yes", "on"].includes(lowered)) return true;
    if (["false", "0", "no", "off"].includes(lowered)) return false;
  }
  if (typeof value === "number") return value === 1;
  return fallback;
};

const coerceString = (value: unknown) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  return undefined;
};

const buildContact = (body: any): ContactInfo | undefined => {
  const parsed = parseJSONField<ContactInfo>(body.contact) || {};
  type ContactScalarKey = Exclude<keyof ContactInfo, "socials">;
  const contact: ContactInfo = { ...parsed };
  const assign = (key: ContactScalarKey, ...sources: string[]) => {
    for (const source of sources) {
      const value = coerceString(body?.[source]);
      if (!isEmpty(value)) {
        contact[key] = value;
        break;
      }
    }
  };
  assign("email", "contactEmail", "contact.email");
  assign("phone", "contactPhone", "contact.phone");
  assign("website", "contactWebsite", "contact.website");
  assign("whatsapp", "contactWhatsapp", "contact.whatsapp");

  type SocialLinks = NonNullable<ContactInfo["socials"]>;
  const socialsInput = parseJSONField<ContactInfo["socials"]>(body.contactSocials);
  const socials: SocialLinks = { ...(contact.socials || {}), ...(socialsInput || {}) };
  const socialSourceMap: Array<{ key: keyof SocialLinks; sources: string[] }> = [
    { key: "facebook", sources: ["contact.facebook", "contactSocials.facebook"] },
    { key: "instagram", sources: ["contact.instagram", "contactSocials.instagram"] },
    { key: "twitter", sources: ["contact.twitter", "contactSocials.twitter"] },
    { key: "linkedin", sources: ["contact.linkedin", "contactSocials.linkedin"] },
  ];
  socialSourceMap.forEach(({ key, sources }) => {
    for (const source of sources) {
      const value = coerceString(body?.[source]);
      if (!isEmpty(value)) {
        socials[key] = value;
        break;
      }
    }
  });
  if (Object.keys(socials).length) contact.socials = socials;
  return Object.keys(contact).length ? contact : undefined;
};

const buildLocation = (body: any): LocationInfo | undefined => {
  const parsed = parseJSONField<LocationInfo>(body.location) || {};
  const location: LocationInfo = { ...parsed };
  const assign = (key: keyof LocationInfo, ...sources: string[]) => {
    for (const source of sources) {
      const value = body?.[source];
      if (!isEmpty(value)) {
        if (key === "latitude" || key === "longitude") {
          const num = coerceNumber(value);
          if (num !== undefined) {
            location[key] = num;
            break;
          }
        } else {
          location[key] = value;
          break;
        }
      }
    }
  };
  assign("addressLine1", "location.addressLine1", "addressLine1");
  assign("addressLine2", "location.addressLine2", "addressLine2");
  assign("city", "location.city", "city");
  assign("state", "location.state", "state");
  assign("postalCode", "location.postalCode", "postalCode");
  assign("country", "location.country", "country");
  assign("landmark", "location.landmark", "landmark");
  assign("latitude", "location.latitude", "latitude");
  assign("longitude", "location.longitude", "longitude");
  return Object.keys(location).length ? location : undefined;
};

const buildPolicies = (body: any): PolicyInfo | undefined => {
  const parsed = parseJSONField<PolicyInfo>(body.policies) || {};
  const policies: PolicyInfo = { ...parsed };
  const map: Array<[keyof PolicyInfo, string[]]> = [
    ["checkInFrom", ["policies.checkInFrom", "checkInFrom", "checkInTime"]],
    ["checkOutUntil", ["policies.checkOutUntil", "checkOutUntil", "checkOutTime"]],
    ["cancellationPolicy", ["policies.cancellationPolicy", "cancellationPolicy"]],
    ["petPolicy", ["policies.petPolicy", "petPolicy"]],
    ["smokingPolicy", ["policies.smokingPolicy", "smokingPolicy"]],
    ["childrenPolicy", ["policies.childrenPolicy", "childrenPolicy"]],
    ["damagePolicy", ["policies.damagePolicy", "damagePolicy"]],
  ];
  map.forEach(([key, sources]) => {
    for (const source of sources) {
      const value = coerceString(body?.[source]);
      if (!isEmpty(value)) {
        policies[key] = value;
        break;
      }
    }
  });
  return Object.keys(policies).length ? policies : undefined;
};

const buildAmenities = (body: any): AmenityGroups | undefined => {
  const parsed = parseJSONField<AmenityGroups>(body.amenitiesDetail) || {};
  const details: AmenityGroups = { ...parsed };
  const sections = ["general", "room", "dining", "wellness", "business", "accessibility", "safety", "technology", "services"] as const;
  sections.forEach((section) => {
    const values = normalizeArray(body?.[`amenities.${section}`]);
    if (values.length) {
      details[section] = values;
    }
  });
  return Object.keys(details).length ? details : undefined;
};

const buildHighlights = (body: any): HighlightInfo[] | undefined => {
  const parsed = parseJSONField<HighlightInfo[]>(body.highlights);
  if (Array.isArray(parsed) && parsed.length) return parsed;
  const titles = buildIndexedArrayExtractor("highlights")(body);
  if (!titles.length) return undefined;
  return titles.map((title) => ({ title }));
};

const buildFacilitySpaces = (body: any): FacilitySpace[] | undefined => {
  const parsed = parseJSONField<FacilitySpace[]>(body.facilitySpaces);
  if (Array.isArray(parsed) && parsed.length) return parsed;
  return undefined;
};

const buildHotelPayload = (body: any) => {
  const location = buildLocation(body);
  const contact = buildContact(body);
  const policies = buildPolicies(body);
  const amenitiesDetail = buildAmenities(body);
  const facilitySpaces = buildFacilitySpaces(body);
  const highlights = buildHighlights(body);
  const facilities = extractFacilities(body);
  const tags = extractTags(body);
  const type = extractTypes(body);

  const payload: any = {
    name: coerceString(body.name),
    description: coerceString(body.description),
    type: type.length ? type : normalizeArray(body.type),
    city: coerceString(body.city) || location?.city,
    country: coerceString(body.country) || location?.country,
    adultCount: coerceNumber(body.adultCount, 1) ?? 1,
    childCount: coerceNumber(body.childCount, 0) ?? 0,
    facilities,
    pricePerNight: coerceNumber(body.pricePerNight, 0) ?? 0,
    starRating: coerceNumber(body.starRating, 0) ?? 0,
    tags,
    heroImage: coerceString(body.heroImage),
    isFeatured: coerceBoolean(body.isFeatured, false),
    contact,
    policies,
    location,
    amenitiesDetail,
    facilitySpaces,
    highlights,
  };

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
