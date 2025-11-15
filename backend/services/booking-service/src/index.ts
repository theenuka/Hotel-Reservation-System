import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import Stripe from "stripe";
import "dotenv/config";
import Booking from "./models/booking";
import Waitlist, { WaitlistStatus } from "./models/waitlist";
import Maintenance from "./models/maintenance";
import mongoosePkg from "mongoose";
import jwt from "jsonwebtoken";

const app = express();
app.use(cors({ origin: [process.env.FRONTEND_URL || "http://localhost:5174"], credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:7101";
const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL || "http://localhost:7102";
const INTERNAL_SERVICE_API_KEY = process.env.INTERNAL_SERVICE_API_KEY;
const LOYALTY_POINTS_PER_CURRENCY = Number(process.env.LOYALTY_POINTS_PER_CURRENCY || "0.1");

const MONGO_URI = process.env.MONGODB_CONNECTION_STRING as string;
if (!MONGO_URI) { console.error("MONGODB_CONNECTION_STRING missing"); process.exit(1); }
const connectWithRetry = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("booking-service connected to MongoDB");
  } catch (e: any) {
    console.error("Mongo connect failed, retrying in 5s:", e?.message || e);
    setTimeout(connectWithRetry, 5000);
  }
};
connectWithRetry();

const HotelModel =
  mongoosePkg.models.Hotel ||
  mongoosePkg.model("Hotel", new mongoosePkg.Schema({}, { strict: false }), "hotels");

const STRIPE_KEY = process.env.STRIPE_API_KEY;
const stripe = STRIPE_KEY ? new Stripe(STRIPE_KEY) : undefined;

// Health
app.get("/health", (_req, res) => res.json({ status: "ok", service: "booking-service" }));
// Simple auth: accept either gateway header x-user-id or Authorization token
const JWT_SECRET = process.env.JWT_SECRET_KEY || "dev_secret";
const attachUser = (req: Request & { userId?: string }, _res: Response, next: NextFunction) => {
  const headerUserId = req.headers["x-user-id"] as string | undefined;
  if (headerUserId) { req.userId = headerUserId; return next(); }
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.split(" ")[1] : undefined;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      req.userId = decoded.userId;
    } catch {
      // ignore
    }
  }
  next();
};

// Utility to check overlapping bookings for a hotel
const hasOverlap = async (hotelId: string, checkIn: Date, checkOut: Date) => {
  const overlapping = await Booking.findOne({
    hotelId,
    status: { $in: ["pending", "confirmed"] },
    $or: [
      { checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } },
    ],
  });
  return !!overlapping;
};

// Business insights (simple computed/mock data for dashboard/forecast/performance)
app.get("/business-insights/dashboard", async (_req, res) => {
  const totalBookings = await Booking.countDocuments();
  const recentBookings = await Booking.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7*24*3600*1000) } });
  const totals = await Booking.aggregate([
    { $group: { _id: null, totalRevenue: { $sum: "$totalCost" } } }
  ]);
  const totalRevenue = totals[0]?.totalRevenue || 0;
  // For simplicity, mock other metrics; could be enhanced to query hotels/users collections via separate services
  res.json({
    overview: {
      totalHotels: 12,
      totalUsers: 42,
      totalBookings,
      recentBookings,
      totalRevenue,
      recentRevenue: Math.round(totalRevenue * 0.1),
      revenueGrowth: 5.6,
    },
    popularDestinations: [
      { _id: "London", count: 24, avgPrice: 180 },
      { _id: "New York", count: 18, avgPrice: 220 },
      { _id: "Tokyo", count: 14, avgPrice: 160 },
    ],
    dailyBookings: Array.from({ length: 14 }).map((_, i) => ({
      date: new Date(Date.now() - (13 - i) * 24*3600*1000).toISOString(),
      bookings: Math.floor(5 + Math.random() * 15),
    })),
    hotelPerformance: Array.from({ length: 10 }).map((_, i) => ({
      name: `Hotel ${i+1}`,
      city: ["London","Paris","NYC","Tokyo"][i % 4],
      starRating: 3 + (i % 3),
      pricePerNight: 100 + i * 15,
      bookingCount: 20 + i * 3,
      totalRevenue: 5000 + i * 500,
    })),
    lastUpdated: new Date().toISOString(),
  });
});

app.get("/business-insights/forecast", async (_req, res) => {
  const historical = Array.from({ length: 8 }).map((_, i) => ({
    week: new Date(Date.now() - (7 - i) * 7 * 24*3600*1000).toISOString(),
    bookings: 50 + i * 3,
    revenue: 10000 + i * 800,
  }));
  const forecasts = Array.from({ length: 8 }).map((_, i) => ({
    week: new Date(Date.now() + (i + 1) * 7 * 24*3600*1000).toISOString(),
    bookings: 75 + i * 4,
    revenue: 14000 + i * 900,
    confidence: 0.7 + i * 0.02,
  }));
  res.json({
    historical,
    forecasts,
    seasonalGrowth: 4.2,
    trends: { bookingTrend: "increasing", revenueTrend: "increasing" },
    lastUpdated: new Date().toISOString(),
  });
});

app.get("/business-insights/performance", async (_req, res) => {
  const used = Math.round(512 + Math.random() * 256);
  const total = 2048;
  const totalBookings = await Booking.countDocuments();
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayBookings = await Booking.countDocuments({ createdAt: { $gte: todayStart } });
  res.json({
    system: {
      memory: { used, total, percentage: Math.round((used/total)*100) },
      cpu: { user: Math.random()*1000, system: Math.random()*1000 },
      uptime: process.uptime(),
    },
    database: {
      collections: 3,
      totalHotels: 12,
      totalBookings,
      totalRevenue: (await Booking.aggregate([{ $group: { _id: null, s: { $sum: "$totalCost" } } }]))[0]?.s || 0,
    },
    application: {
      avgResponseTime: Math.round(80 + Math.random()*40),
      requestsPerMinute: Math.round(200 + Math.random()*50),
      errorRate: Math.random()*0.02,
      uptime: `${Math.floor(process.uptime()/3600)}h ${Math.floor((process.uptime()%3600)/60)}m`,
      todayBookings,
      thisWeekBookings: todayBookings + 20,
    },
    lastUpdated: new Date().toISOString(),
  });
});

// Payment intent (mock if Stripe not configured)
app.post("/hotels/:hotelId/bookings/payment-intent", async (req, res) => {
  const { numberOfNights } = req.body;
  const pricePerNight = Number(process.env.DEFAULT_PRICE_PER_NIGHT || 100);
  const totalCost = pricePerNight * Number(numberOfNights || 1);

  if (!stripe) {
    return res.json({ paymentIntentId: "mock_intent", clientSecret: "mock_secret", totalCost });
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalCost * 100,
    currency: "gbp",
    metadata: { hotelId: req.params.hotelId },
  });

  res.json({ paymentIntentId: paymentIntent.id, clientSecret: paymentIntent.client_secret, totalCost });
});

// Confirm booking
app.post("/hotels/:hotelId/bookings", attachUser, async (req: Request & { userId?: string }, res) => {
  const hotelId = req.params.hotelId;
  const { checkIn, checkOut, totalCost } = req.body || {};
  const ci = new Date(checkIn);
  const co = new Date(checkOut);
  if (!checkIn || !checkOut || isNaN(ci.getTime()) || isNaN(co.getTime()) || ci >= co) {
    return res.status(400).json({ message: "Invalid check-in/check-out" });
  }
  // prevent overlapping bookings
  const conflict = await hasOverlap(hotelId, ci, co);
  if (conflict) return res.status(409).json({ message: "Selected dates are no longer available" });

  const newBooking = {
    ...req.body,
    userId: req.userId,
    hotelId,
    createdAt: new Date(),
    status: "confirmed",
    paymentStatus: "paid",
    totalCost,
  };
  const booking = await new Booking(newBooking).save();

  // Notify
  const baseUrl = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:7101";
  try {
    await fetch(`${baseUrl}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "booking_confirmation",
        to: newBooking.email,
        subject: "Booking Confirmation",
        message: `Hi ${newBooking.firstName}, your booking is confirmed.`,
        metadata: { bookingId: booking._id, hotelId: newBooking.hotelId }
      })
    });
  } catch (e) {
    console.warn("Notification failed", e);
  }

  res.status(200).send();
});

// Update booking dates (patch) with overlap re-check
app.patch("/bookings/:bookingId", attachUser, async (req: Request & { userId?: string }, res) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: "not found" });
  const { checkIn, checkOut } = req.body || {};
  if (checkIn || checkOut) {
    const ci = new Date(checkIn ?? booking.checkIn);
    const co = new Date(checkOut ?? booking.checkOut);
    if (isNaN(ci.getTime()) || isNaN(co.getTime()) || ci >= co) {
      return res.status(400).json({ message: "Invalid check-in/check-out" });
    }
    const conflict = await hasOverlap(booking.hotelId, ci, co);
    if (conflict) return res.status(409).json({ message: "Selected dates not available" });
    booking.checkIn = ci; booking.checkOut = co;
  }
  if (typeof req.body?.status === 'string') booking.status = req.body.status;
  await booking.save();
  // Notify update
  try {
    const baseUrl = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:7101";
    await fetch(`${baseUrl}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "booking_updated",
        to: booking.email,
        subject: "Booking Updated",
        message: `Your booking has been updated. New dates: ${booking.checkIn.toDateString()} - ${booking.checkOut.toDateString()}`,
        metadata: { bookingId: booking._id }
      })
    });
  } catch {}
  res.json(booking);
});

// My bookings
// Return HotelWithBookingsType[] for the current user
app.get("/my-bookings", attachUser, async (req: Request & { userId?: string }, res) => {
  const filter = req.userId ? { userId: req.userId } : {};
  const bookings = await Booking.find(filter).sort({ createdAt: -1 }).lean();
  const hotelIds = Array.from(new Set(bookings.map((b: any) => b.hotelId))).filter(Boolean);
  if (hotelIds.length === 0) return res.json([]);

  // Light Hotel model
  const Hotel = mongoosePkg.model("Hotel", new mongoosePkg.Schema({}, { strict: false }), "hotels");
  const hotels = await Hotel.find({ _id: { $in: hotelIds.map((id: string) => new mongoosePkg.Types.ObjectId(id)) } }).lean();
  const hotelsById = new Map(hotels.map((h: any) => [String(h._id), h]));

  const result = hotelIds
    .map((hid) => {
      const h = hotelsById.get(hid);
      if (!h) return null;
      const hb = bookings.filter((b: any) => String(b.hotelId) === hid);
      return { ...h, bookings: hb };
    })
    .filter(Boolean);

  res.json(result);
});

// Hotel bookings
app.get("/bookings/hotel/:hotelId", async (req, res) => {
  const bookings = await Booking.find({ hotelId: req.params.hotelId }).sort({ createdAt: -1 });
  res.json(bookings);
});

// Cancel a booking (owner or same user ideally; simplified here)
app.post("/bookings/:bookingId/cancel", attachUser, async (req: Request & { userId?: string }, res) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: "not found" });
  // In a full app, verify req.userId is booking.userId or hotel owner; omitted for brevity
  booking.status = "cancelled";
  booking.paymentStatus = booking.paymentStatus === "paid" ? "refunded" : booking.paymentStatus;
  await booking.save();
  // Notify cancellation
  try {
    const baseUrl = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:7101";
    await fetch(`${baseUrl}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "booking_cancelled",
        to: booking.email,
        subject: "Booking Cancelled",
        message: `Your booking has been cancelled.`,
        metadata: { bookingId: booking._id }
      })
    });
  } catch {}
  res.json({ success: true });
});

// Waitlist endpoints
app.post("/hotels/:hotelId/waitlist", attachUser, async (req: Request & { userId?: string }, res) => {
  const { email, firstName, lastName, checkIn, checkOut } = req.body || {};
  if (!email || !checkIn || !checkOut) return res.status(400).json({ message: "Missing fields" });
  const ci = new Date(checkIn); const co = new Date(checkOut);
  if (isNaN(ci.getTime()) || isNaN(co.getTime()) || ci >= co) return res.status(400).json({ message: "Invalid dates" });
  const entry = await new Waitlist({ hotelId: req.params.hotelId, email, firstName, lastName, checkIn: ci, checkOut: co }).save();
  // Notify waitlist join
  try {
    const baseUrl = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:7101";
    await fetch(`${baseUrl}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "waitlist_joined",
        to: email,
        subject: "Added to Waitlist",
        message: `You're on the waitlist. We'll notify you if dates open up.`,
        metadata: { hotelId: req.params.hotelId, checkIn: ci, checkOut: co }
      })
    });
  } catch {}
  res.status(201).json(entry);
});

app.get("/hotels/:hotelId/waitlist", async (req, res) => {
  const items = await Waitlist.find({ hotelId: req.params.hotelId }).sort({ createdAt: -1 });
  res.json(items);
});

const port = process.env.PORT || 7104;
app.listen(port, () => console.log(`booking-service listening on :${port}`));
