import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import Stripe from "stripe";
import "dotenv/config";
import Booking from "./models/booking";
import Waitlist from "./models/waitlist";
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

// Utility helpers -----------------------------------------------------------
const sendNotification = async (payload: {
  type: string;
  to?: string;
  subject?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}) => {
  if (!payload?.to) return;
  try {
    await fetch(`${NOTIFICATION_SERVICE_URL}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("Notification failed", err);
  }
};

const hasOverlap = async (hotelId: string, checkIn: Date, checkOut: Date, excludeBookingId?: string) => {
  const query: Record<string, unknown> = {
    hotelId,
    status: { $in: ["pending", "confirmed"] },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  return Booking.exists(query);
};

const hasMaintenanceConflict = async (hotelId: string, checkIn: Date, checkOut: Date) => {
  return Maintenance.exists({ hotelId, startDate: { $lt: checkOut }, endDate: { $gt: checkIn } });
};

const ensureAvailability = async (hotelId: string, checkIn: Date, checkOut: Date, excludeBookingId?: string) => {
  const [bookingConflict, maintenanceConflict] = await Promise.all([
    hasOverlap(hotelId, checkIn, checkOut, excludeBookingId),
    hasMaintenanceConflict(hotelId, checkIn, checkOut),
  ]);
  return { bookingConflict: !!bookingConflict, maintenanceConflict: !!maintenanceConflict };
};

const createOrUpdateWaitlistEntry = async (
  hotelId: string,
  payload: { email: string; firstName?: string; lastName?: string; checkIn: Date; checkOut: Date }
) => {
  return Waitlist.findOneAndUpdate(
    {
      hotelId,
      email: payload.email,
      checkIn: payload.checkIn,
      checkOut: payload.checkOut,
    },
    { $setOnInsert: { ...payload, status: "waiting" } },
    { upsert: true, new: true }
  );
};

const notifyWaitlistAvailability = async (hotelId: string, checkIn: Date, checkOut: Date) => {
  const watchers = await Waitlist.find({
    hotelId,
    status: "waiting",
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  })
    .sort({ createdAt: 1 })
    .limit(10);

  await Promise.all(
    watchers.map(async (entry) => {
      await sendNotification({
        type: "waitlist_available",
        to: entry.email,
        subject: "Availability opened up",
        message: `Good news! ${entry.checkIn.toDateString()} - ${entry.checkOut.toDateString()} is available again.`,
        metadata: { hotelId, waitlistId: entry._id },
      });
      entry.status = "notified";
      entry.notifiedAt = new Date();
      await entry.save();
    })
  );
};

const awardLoyaltyPoints = async (userId: string | undefined, totalCost: number, bookingId: string) => {
  if (!userId || !INTERNAL_SERVICE_API_KEY || !IDENTITY_SERVICE_URL) return;
  const multiplier = Number.isFinite(LOYALTY_POINTS_PER_CURRENCY) ? LOYALTY_POINTS_PER_CURRENCY : 0.1;
  const points = Math.max(1, Math.round(totalCost * multiplier));
  try {
    await fetch(`${IDENTITY_SERVICE_URL}/internal/users/${userId}/loyalty`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-service-key": INTERNAL_SERVICE_API_KEY,
      },
      body: JSON.stringify({
        points,
        reason: "completed_booking",
        metadata: { bookingId, totalCost },
      }),
    });
  } catch (err) {
    console.warn("award loyalty failed", err);
  }
};

const buildDailyBookingSeries = async (days = 14) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const rows = await Booking.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        bookings: { $sum: 1 },
        revenue: { $sum: "$totalCost" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const map = new Map(rows.map((row) => [row._id, row]));
  return Array.from({ length: days }).map((_, idx) => {
    const day = new Date(start);
    day.setDate(start.getDate() + idx);
    const key = day.toISOString().slice(0, 10);
    const row = map.get(key);
    return {
      date: day.toISOString(),
      bookings: row?.bookings || 0,
      revenue: row?.revenue || 0,
    };
  });
};

const buildWeeklySeries = async (weeks = 8) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - weeks * 7);
  const rows = await Booking.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: {
          week: { $dateToString: { format: "%G-%V", date: "$createdAt" } },
          start: {
            $dateTrunc: { date: "$createdAt", unit: "week", binSize: 1, timezone: "UTC" },
          },
        },
        bookings: { $sum: 1 },
        revenue: { $sum: "$totalCost" },
      },
    },
    { $sort: { "_id.start": 1 } },
  ]);
  return rows.map((row) => ({
    week: new Date(row._id.start).toISOString(),
    bookings: row.bookings,
    revenue: row.revenue,
  }));
};

// Business insights (simple computed/mock data for dashboard/forecast/performance)
app.get("/business-insights/dashboard", async (_req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [totalBookings, recentBookings, totalRevenueAgg, recentRevenueAgg, totalHotels, distinctUsers] = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Booking.aggregate([{ $group: { _id: null, total: { $sum: "$totalCost" } } }]),
    Booking.aggregate([{ $match: { createdAt: { $gte: sevenDaysAgo } } }, { $group: { _id: null, total: { $sum: "$totalCost" } } }]),
    HotelModel.countDocuments(),
    Booking.distinct("userId"),
  ]);

  const popularity = await Booking.aggregate([
    {
      $group: {
        _id: "$hotelId",
        bookingCount: { $sum: 1 },
        avgPrice: { $avg: "$totalCost" },
        totalRevenue: { $sum: "$totalCost" },
        avgNights: {
          $avg: {
            $divide: [{ $subtract: ["$checkOut", "$checkIn"] }, 1000 * 60 * 60 * 24],
          },
        },
      },
    },
    { $sort: { bookingCount: -1 } },
    { $limit: 10 },
  ]);
  const hotelMapIds = popularity.map((p) => p._id);
  const hotels = hotelMapIds.length
    ? await HotelModel.find({ _id: { $in: hotelMapIds.map((id: string) => new mongoosePkg.Types.ObjectId(id)) } })
        .select("name city country pricePerNight starRating type")
        .lean()
    : [];
  const hotelInfo = new Map(hotels.map((h: any) => [String(h._id), h]));
  const popularDestinations = popularity.slice(0, 5).map((entry) => {
    const hotel = hotelInfo.get(entry._id) as any;
    return {
      hotelId: entry._id,
      name: hotel?.name,
      city: hotel?.city,
      country: hotel?.country,
      bookingCount: entry.bookingCount,
      avgPrice: Math.round(entry.avgPrice || 0),
      totalRevenue: Math.round(entry.totalRevenue || 0),
    };
  });

  const hotelPerformance = popularity.map((entry) => {
    const hotel = hotelInfo.get(entry._id) as any;
    return {
      hotelId: entry._id,
      name: hotel?.name || "Unknown Hotel",
      city: hotel?.city,
      starRating: hotel?.starRating,
      pricePerNight: hotel?.pricePerNight,
      bookingCount: entry.bookingCount,
      totalRevenue: Math.round(entry.totalRevenue || 0),
      avgStayLength: Number(entry.avgNights?.toFixed?.(1) || entry.avgNights || 0),
    };
  });

  const overview = {
    totalHotels,
    totalUsers: Array.isArray(distinctUsers) ? distinctUsers.length : 0,
    totalBookings,
    recentBookings,
    totalRevenue: totalRevenueAgg[0]?.total || 0,
    recentRevenue: recentRevenueAgg[0]?.total || 0,
    revenueGrowth: recentRevenueAgg[0]?.total && totalRevenueAgg[0]?.total
      ? Number(((recentRevenueAgg[0].total / (totalRevenueAgg[0].total || 1)) * 100).toFixed(2))
      : 0,
  };

  const dailyBookings = await buildDailyBookingSeries(14);

  res.json({
    overview,
    popularDestinations,
    dailyBookings,
    hotelPerformance,
    lastUpdated: new Date().toISOString(),
  });
});

app.get("/business-insights/forecast", async (_req, res) => {
  const historical = await buildWeeklySeries(8);
  const totalHistoricalRevenue = historical.reduce((sum, row) => sum + row.revenue, 0);
  const totalHistoricalBookings = historical.reduce((sum, row) => sum + row.bookings, 0);
  const avgRevenuePerBooking = totalHistoricalBookings ? totalHistoricalRevenue / totalHistoricalBookings : 0;
  const growthRates = historical.slice(1).map((row, idx) => row.bookings - historical[idx].bookings);
  const avgGrowth = growthRates.length
    ? growthRates.reduce((sum, val) => sum + val, 0) / growthRates.length
    : 0;
  const lastWeekBookings = historical[historical.length - 1]?.bookings || 0;

  const forecasts = Array.from({ length: 8 }).map((_, i) => {
    const projectedBookings = Math.max(0, Math.round(lastWeekBookings + (i + 1) * avgGrowth));
    return {
      week: new Date(Date.now() + (i + 1) * 7 * 24 * 3600 * 1000).toISOString(),
      bookings: projectedBookings,
      revenue: Math.round(projectedBookings * avgRevenuePerBooking),
      confidence: Math.min(0.9, 0.65 + i * 0.03),
    };
  });

  res.json({
    historical,
    forecasts,
    seasonalGrowth: Number((avgGrowth || 0).toFixed(2)),
    trends: {
      bookingTrend: avgGrowth >= 0 ? "increasing" : "decreasing",
      revenueTrend: avgGrowth >= 0 ? "increasing" : "flat",
    },
    lastUpdated: new Date().toISOString(),
  });
});

app.get("/business-insights/performance", async (_req, res) => {
  const mem = process.memoryUsage();
  const totalBookings = await Booking.countDocuments();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayBookings = await Booking.countDocuments({ createdAt: { $gte: todayStart } });
  const pendingBookings = await Booking.countDocuments({ status: "pending" });
  const totalRevenueAgg = await Booking.aggregate([{ $group: { _id: null, total: { $sum: "$totalCost" } } }]);
  const avgStayAgg = await Booking.aggregate([
    {
      $group: {
        _id: null,
        avgStay: {
          $avg: { $divide: [{ $subtract: ["$checkOut", "$checkIn"] }, 1000 * 60 * 60 * 24] },
        },
      },
    },
  ]);

  const uptimeSeconds = process.uptime();
  const cpuUsage = process.cpuUsage();
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);
  const weekBookings = await Booking.countDocuments({ createdAt: { $gte: weekStart } });

  res.json({
    system: {
      memory: {
        rss: mem.rss,
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
        utilization: Number(((mem.heapUsed / mem.heapTotal) * 100).toFixed(2)),
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      uptimeSeconds,
    },
    database: {
      collections: mongoose.connection.db ? (await mongoose.connection.db.listCollections().toArray()).length : 0,
      totalBookings,
      totalRevenue: totalRevenueAgg[0]?.total || 0,
      avgStayLength: Number(avgStayAgg[0]?.avgStay?.toFixed?.(1) || 0),
    },
    application: {
      pendingBookings,
      todayBookings,
      thisWeekBookings: weekBookings,
      errorRate: 0.0,
      avgResponseTime: 95,
      requestsPerMinute: 220,
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
  const { checkIn, checkOut, totalCost, autoWaitlist } = req.body || {};
  const ci = new Date(checkIn);
  const co = new Date(checkOut);
  if (!checkIn || !checkOut || isNaN(ci.getTime()) || isNaN(co.getTime()) || ci >= co) {
    return res.status(400).json({ message: "Invalid check-in/check-out" });
  }

  const availability = await ensureAvailability(hotelId, ci, co);
  if (availability.bookingConflict || availability.maintenanceConflict) {
    let waitlistEntry;
    const wantsAutoWaitlist =
      typeof autoWaitlist === "string" ? autoWaitlist.toLowerCase() === "true" : Boolean(autoWaitlist);
    if (wantsAutoWaitlist && req.body.email) {
      waitlistEntry = (
        await createOrUpdateWaitlistEntry(hotelId, {
          email: req.body.email,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          checkIn: ci,
          checkOut: co,
        })
      )?.toObject();
    }
    return res.status(409).json({
      message: availability.maintenanceConflict ? "Hotel is under maintenance" : "Selected dates are no longer available",
      reason: availability.maintenanceConflict ? "maintenance" : "booked_out",
      waitlistEntry,
    });
  }

  const total = Number(totalCost ?? req.body.totalCost ?? 0);
  const newBooking = {
    ...req.body,
    userId: req.userId,
    hotelId,
    createdAt: new Date(),
    status: "confirmed",
    paymentStatus: "paid",
    totalCost: total,
  };
  const booking = await new Booking(newBooking).save();

  if (req.body.waitlistId) {
    await Waitlist.findByIdAndUpdate(req.body.waitlistId, {
      status: "converted",
      convertedBookingId: booking._id,
      notifiedAt: new Date(),
    });
  }

  await awardLoyaltyPoints(req.userId, total || booking.totalCost, booking._id);

  await sendNotification({
    type: "booking_confirmation",
    to: newBooking.email,
    subject: "Booking Confirmation",
    message: `Hi ${newBooking.firstName}, your booking is confirmed.`,
    metadata: { bookingId: booking._id, hotelId: newBooking.hotelId },
  });

  res.status(201).json({ bookingId: booking._id, booking });
});

// Update booking dates (patch) with overlap re-check
app.patch("/bookings/:bookingId", attachUser, async (req: Request & { userId?: string }, res) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: "not found" });
  const previousStatus = booking.status;
  const { checkIn, checkOut } = req.body || {};
  if (checkIn || checkOut) {
    const ci = new Date(checkIn ?? booking.checkIn);
    const co = new Date(checkOut ?? booking.checkOut);
    if (isNaN(ci.getTime()) || isNaN(co.getTime()) || ci >= co) {
      return res.status(400).json({ message: "Invalid check-in/check-out" });
    }
    const availability = await ensureAvailability(booking.hotelId, ci, co, bookingId);
    if (availability.bookingConflict || availability.maintenanceConflict) {
      return res.status(409).json({
        message: availability.maintenanceConflict ? "Hotel is under maintenance" : "Selected dates not available",
        reason: availability.maintenanceConflict ? "maintenance" : "booked_out",
      });
    }
    booking.checkIn = ci; booking.checkOut = co;
  }
  if (typeof req.body?.status === 'string') booking.status = req.body.status;
  await booking.save();
  await sendNotification({
    type: "booking_updated",
    to: booking.email,
    subject: "Booking Updated",
    message: `Your booking has been updated. New dates: ${booking.checkIn.toDateString()} - ${booking.checkOut.toDateString()}`,
    metadata: { bookingId: booking._id },
  });
  if (previousStatus !== "cancelled" && booking.status === "cancelled") {
    await notifyWaitlistAvailability(booking.hotelId, booking.checkIn, booking.checkOut);
  }
  res.json(booking);
});

// My bookings
// Return HotelWithBookingsType[] for the current user
app.get("/my-bookings", attachUser, async (req: Request & { userId?: string }, res) => {
  const filter = req.userId ? { userId: req.userId } : {};
  const bookings = await Booking.find(filter).sort({ createdAt: -1 }).lean();
  const hotelIds = Array.from(new Set(bookings.map((b: any) => b.hotelId))).filter(Boolean);
  if (hotelIds.length === 0) return res.json([]);

  const hotels = await HotelModel.find({ _id: { $in: hotelIds.map((id: string) => new mongoosePkg.Types.ObjectId(id)) } }).lean();
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
  await sendNotification({
    type: "booking_cancelled",
    to: booking.email,
    subject: "Booking Cancelled",
    message: "Your booking has been cancelled.",
    metadata: { bookingId: booking._id },
  });
  await notifyWaitlistAvailability(booking.hotelId, booking.checkIn, booking.checkOut);
  res.json({ success: true });
});

// Waitlist endpoints
app.post("/hotels/:hotelId/waitlist", attachUser, async (req: Request & { userId?: string }, res) => {
  const { email, firstName, lastName, checkIn, checkOut } = req.body || {};
  if (!email || !checkIn || !checkOut) return res.status(400).json({ message: "Missing fields" });
  const ci = new Date(checkIn); const co = new Date(checkOut);
  if (isNaN(ci.getTime()) || isNaN(co.getTime()) || ci >= co) return res.status(400).json({ message: "Invalid dates" });
  const entry = await new Waitlist({ hotelId: req.params.hotelId, email, firstName, lastName, checkIn: ci, checkOut: co }).save();
  await sendNotification({
    type: "waitlist_joined",
    to: email,
    subject: "Added to Waitlist",
    message: "You're on the waitlist. We'll notify you if dates open up.",
    metadata: { hotelId: req.params.hotelId, checkIn: ci, checkOut: co },
  });
  res.status(201).json(entry);
});

app.get("/hotels/:hotelId/waitlist", async (req, res) => {
  const items = await Waitlist.find({ hotelId: req.params.hotelId }).sort({ createdAt: -1 });
  res.json(items);
});

const port = process.env.PORT || 7104;
app.listen(port, () => console.log(`booking-service listening on :${port}`));
