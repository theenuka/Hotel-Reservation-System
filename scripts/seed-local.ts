import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// minimal schemas compatible with services
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ["user", "admin", "hotel_owner"], default: "user" }
});
const User = mongoose.model("User", userSchema);

const hotelSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: String,
  city: String,
  country: String,
  description: String,
  type: [String],
  adultCount: Number,
  childCount: Number,
  facilities: [String],
  pricePerNight: Number,
  starRating: Number,
  imageUrls: [String],
  lastUpdated: Date
});
const Hotel = mongoose.model("Hotel", hotelSchema);

// Transform $oid/$numberInt/$date if present
const unwrap = (v: any) => {
  if (!v || typeof v !== "object") return v;
  if (v.$oid) return v.$oid;
  if (v.$numberInt) return Number(v.$numberInt);
  if (v.$date?.$numberLong) return new Date(Number(v.$date.$numberLong));
  return v;
};

const toArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(Boolean) as string[];
  }
  if (typeof value === "string") {
    return [value];
  }
  return [];
};

const toNumber = (value: unknown, fallback: number): number => {
  const unwrapped = unwrap(value);
  if (typeof unwrapped === "number") return unwrapped;
  if (typeof unwrapped === "string") {
    const parsed = Number(unwrapped);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
};

const normalizeImage = (url: string) =>
  typeof url === "string" ? url.replace(/^http:\/\//, "https://") : url;

const run = async () => {
  const MONGO =
    process.env.MONGODB_CONNECTION_STRING || "mongodb://localhost:27018/hotel-booking";
  await mongoose.connect(MONGO);
  console.log("Connected to", MONGO);

  const dataDir = path.resolve(process.cwd(), "data");
  const usersPath = path.join(dataDir, "test-users.json");
  const legacyHotelPath = path.join(dataDir, "test-hotel.json");
  const sampleHotelsPath = path.join(dataDir, "sample-hotels.json");

  const userDoc = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
  const sampleHotelsRaw = fs.existsSync(sampleHotelsPath)
    ? JSON.parse(fs.readFileSync(sampleHotelsPath, "utf-8"))
    : [];
  const legacyHotelDoc = JSON.parse(fs.readFileSync(legacyHotelPath, "utf-8"));
  const hotelsSource = Array.isArray(sampleHotelsRaw)
    ? [...sampleHotelsRaw, legacyHotelDoc]
    : [sampleHotelsRaw, legacyHotelDoc];

  // normalize user
  const user = {
    _id: unwrap(userDoc._id),
    email: userDoc.email,
    password: userDoc.password, // already hashed in fixture
    firstName: userDoc.firstName,
    lastName: userDoc.lastName,
    role: userDoc.role || "hotel_owner",
  } as any;

  const upsertedUser = await User.findOneAndUpdate({ email: user.email }, user, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
  if (!upsertedUser) {
    throw new Error("Unable to seed base user");
  }
  console.log("Seeded user:", upsertedUser.email);

  let seededHotels = 0;
  for (const doc of hotelsSource) {
    if (!doc || !doc.name) continue;
    const normalized = {
      userId: unwrap(doc.userId) || upsertedUser._id?.toString(),
      name: doc.name,
      city: doc.city,
      country: doc.country,
      description: doc.description,
      type: toArray(doc.type),
      adultCount: toNumber(doc.adultCount, 2),
      childCount: toNumber(doc.childCount, 0),
      facilities: toArray(doc.facilities),
      pricePerNight: toNumber(doc.pricePerNight, 100),
      starRating: toNumber(doc.starRating, 4),
      imageUrls: toArray(doc.imageUrls).map((u) => normalizeImage(u)),
      lastUpdated: unwrap(doc.lastUpdated) || new Date(),
      location: doc.location,
      contact: doc.contact,
      policies: doc.policies,
      tags: doc.tags,
      heroImage: doc.heroImage || doc.imageUrls?.[0],
      isFeatured: typeof doc.isFeatured === "boolean" ? doc.isFeatured : false,
    } as any;

    await Hotel.findOneAndUpdate(
      { name: normalized.name },
      normalized,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log("Upserted hotel:", normalized.name);
    seededHotels += 1;
  }
  console.log(`Seeded ${seededHotels} hotels.`);

  await mongoose.disconnect();
  console.log("Done.");
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
