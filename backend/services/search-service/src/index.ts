import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import "dotenv/config";

const app = express();
app.use(cors({ origin: [process.env.FRONTEND_URL || "http://localhost:5174"], credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

const MONGO_URI = process.env.MONGODB_CONNECTION_STRING as string;
if (!MONGO_URI) { console.error("MONGODB_CONNECTION_STRING missing"); process.exit(1); }
const connectWithRetry = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("search-service connected to MongoDB");
  } catch (e: any) {
    console.error("Mongo connect failed, retrying in 5s:", e?.message || e);
    setTimeout(connectWithRetry, 5000);
  }
};
connectWithRetry();

// Define light Hotel model here for querying
import mongoosePkg from "mongoose";
const Hotel = mongoosePkg.model("Hotel", new mongoosePkg.Schema({
  city: String,
  country: String,
  pricePerNight: Number,
  starRating: Number,
  facilities: [String],
  type: [String],
}, { strict: false }), "hotels");

// Light Booking model for availability checks
const Booking = mongoosePkg.model("Booking", new mongoosePkg.Schema({
  hotelId: String,
  checkIn: Date,
  checkOut: Date,
  status: String,
}, { strict: false }), "bookings");

// Maintenance model lightweight for availability
const Maintenance = mongoosePkg.model("Maintenance", new mongoosePkg.Schema({
  hotelId: String,
  startDate: Date,
  endDate: Date,
}, { strict: false }), "maintenances");

app.get("/hotels/search", async (req, res) => {
  const q: any = {};
  const { destination, adultCount, childCount, facilities, types, stars, maxPrice, sortOption, page, checkIn, checkOut } = req.query as any;
  if (destination && destination.trim() !== "") {
    q.$or = [
      { city: { $regex: destination, $options: "i" } },
      { country: { $regex: destination, $options: "i" } },
    ];
  }
  if (adultCount) q.adultCount = { $gte: parseInt(adultCount) };
  if (childCount) q.childCount = { $gte: parseInt(childCount) };
  if (facilities) q.facilities = { $all: Array.isArray(facilities) ? facilities : [facilities] };
  if (types) q.type = { $in: Array.isArray(types) ? types : [types] };
  if (stars) q.starRating = { $in: (Array.isArray(stars) ? stars : [stars]).map((s: string) => parseInt(s)) };
  if (maxPrice) q.pricePerNight = { $lte: parseInt(maxPrice) };

  let sort: any = {};
  switch (sortOption) {
    case "starRating": sort = { starRating: -1 }; break;
    case "pricePerNightAsc": sort = { pricePerNight: 1 }; break;
    case "pricePerNightDesc": sort = { pricePerNight: -1 }; break;
  }

  const pageSize = 5;
  const pageNumber = parseInt(page || "1");
  const skip = (pageNumber - 1) * pageSize;

  // Availability: exclude hotels that have overlapping bookings in the requested window
  let unavailableHotelIds: string[] = [];
  if (checkIn && checkOut) {
    const ci = new Date(checkIn);
    const co = new Date(checkOut);
    if (!isNaN(ci.getTime()) && !isNaN(co.getTime()) && ci < co) {
      const overlaps = await Booking.distinct("hotelId", {
        status: { $in: ["pending", "confirmed"] },
        checkIn: { $lt: co },
        checkOut: { $gt: ci },
      });
      const maintenanceBlocks = await Maintenance.distinct("hotelId", {
        startDate: { $lt: co },
        endDate: { $gt: ci },
      });
      unavailableHotelIds = [
        ...new Set([...(overlaps as string[]), ...(maintenanceBlocks as string[])]),
      ];
      if (unavailableHotelIds.length > 0) {
        q._id = { $nin: unavailableHotelIds.map((id) => new mongoosePkg.Types.ObjectId(id)) };
      }
    }
  }

  const [data, total] = await Promise.all([
    Hotel.find(q).sort(sort).skip(skip).limit(pageSize),
    Hotel.countDocuments(q),
  ]);

  res.json({ data, pagination: { total, page: pageNumber, pages: Math.ceil(total / pageSize) } });
});

app.get("/health", (_req, res) => res.json({ status: "ok", service: "search-service" }));

const port = process.env.PORT || 7105;
app.listen(port, () => console.log(`search-service listening on :${port}`));
