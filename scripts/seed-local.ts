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
  type: String,
  adultCount: Number,
  childCount: Number,
  facilities: [String],
  pricePerNight: Number,
  starRating: Number,
  imageUrls: [String],
  lastUpdated: Date
});
const Hotel = mongoose.model("Hotel", hotelSchema);

const run = async () => {
  const MONGO = process.env.MONGODB_CONNECTION_STRING || "mongodb://localhost:27018/hotel-booking";
  await mongoose.connect(MONGO);
  console.log("Connected to", MONGO);

  const dataDir = path.resolve(process.cwd(), "data");
  const usersPath = path.join(dataDir, "test-users.json");
  const hotelPath = path.join(dataDir, "test-hotel.json");

  const userDoc = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
  const hotelDoc = JSON.parse(fs.readFileSync(hotelPath, "utf-8"));

  // Transform $oid/$numberInt/$date if present
  const unwrap = (v: any) => {
    if (!v || typeof v !== "object") return v;
    if (v.$oid) return v.$oid;
    if (v.$numberInt) return Number(v.$numberInt);
    if (v.$date?.$numberLong) return new Date(Number(v.$date.$numberLong));
    return v;
  };

  // normalize user
  const user = {
    _id: unwrap(userDoc._id),
    email: userDoc.email,
    password: userDoc.password, // already hashed in fixture
    firstName: userDoc.firstName,
    lastName: userDoc.lastName,
  } as any;

  await User.deleteMany({ email: user.email });
  await User.create(user);
  console.log("Seeded user:", user.email);

  const hotel = {
    _id: unwrap(hotelDoc._id),
    userId: unwrap(hotelDoc.userId),
    name: hotelDoc.name,
    city: hotelDoc.city,
    country: hotelDoc.country,
    description: hotelDoc.description,
    type: hotelDoc.type,
    adultCount: unwrap(hotelDoc.adultCount),
    childCount: unwrap(hotelDoc.childCount),
    facilities: hotelDoc.facilities,
    pricePerNight: unwrap(hotelDoc.pricePerNight),
    starRating: unwrap(hotelDoc.starRating),
    // Normalize image URLs to https (avoid mixed-content issues)
    imageUrls: (hotelDoc.imageUrls || []).map((u: string) =>
      typeof u === "string" ? u.replace(/^http:\/\//, "https://") : u
    ),
    lastUpdated: unwrap(hotelDoc.lastUpdated)
  } as any;

  await Hotel.deleteMany({ name: hotel.name });
  await Hotel.create(hotel);
  console.log("Seeded hotel:", hotel.name);

  await mongoose.disconnect();
  console.log("Done.");
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
