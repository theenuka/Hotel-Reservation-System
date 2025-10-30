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

// Helper to extract imageUrls array from multipart fields like imageUrls[0], imageUrls[1]
const extractImageUrls = (body: any): string[] => {
  const direct = body.imageUrls;
  if (Array.isArray(direct)) return direct;
  if (typeof direct === "string" && direct.length > 0) return [direct];
  const urls: { index: number; url: string }[] = [];
  Object.keys(body || {}).forEach((key) => {
    const m = key.match(/^imageUrls\[(\d+)\]$/);
    if (m) {
      urls.push({ index: parseInt(m[1], 10), url: body[key] });
    }
  });
  return urls.sort((a, b) => a.index - b.index).map((x) => x.url).filter(Boolean);
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
  const hotel = await new Hotel({ ...req.body, imageUrls, userId: req.userId, lastUpdated: new Date() }).save();
  res.json(hotel);
});

app.put("/my-hotels/:id", verifyToken, requireOwner, upload.array("imageFiles", 6), async (req: Request & { userId?: string }, res: Response) => {
  const uploaded = await uploadToCloudinary((req.files as Express.Multer.File[]) || []);
  let imageUrls = uploaded.length > 0 ? uploaded : extractImageUrls(req.body);
  if (!Array.isArray(imageUrls)) imageUrls = imageUrls ? [imageUrls as any] : [];
  const updated = await Hotel.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { ...req.body, imageUrls, lastUpdated: new Date() },
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
