import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import Stripe from "stripe";
import "dotenv/config";
import Booking from "./models/booking";

const app = express();
app.use(cors({ origin: [process.env.FRONTEND_URL || "http://localhost:5174"], credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

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

const STRIPE_KEY = process.env.STRIPE_API_KEY;
const stripe = STRIPE_KEY ? new Stripe(STRIPE_KEY) : undefined;

// Health
app.get("/health", (_req, res) => res.json({ status: "ok", service: "booking-service" }));

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
app.post("/hotels/:hotelId/bookings", async (req, res) => {
  const newBooking = {
    ...req.body,
    hotelId: req.params.hotelId,
    createdAt: new Date(),
    status: "confirmed",
    paymentStatus: "paid",
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

// My bookings
app.get("/my-bookings", async (req, res) => {
  const userId = req.headers["x-user-id"] as string | undefined; // gateway can add this later
  const bookings = await Booking.find(userId ? { userId } : {}).sort({ createdAt: -1 });
  res.json(bookings);
});

// Hotel bookings
app.get("/bookings/hotel/:hotelId", async (req, res) => {
  const bookings = await Booking.find({ hotelId: req.params.hotelId }).sort({ createdAt: -1 });
  res.json(bookings);
});

const port = process.env.PORT || 7104;
app.listen(port, () => console.log(`booking-service listening on :${port}`));
