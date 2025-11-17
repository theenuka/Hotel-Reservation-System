import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import "dotenv/config";
import mongoosePkg from "mongoose";

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

const Hotel =
  mongoosePkg.models.Hotel ||
  mongoosePkg.model(
    "Hotel",
    new mongoosePkg.Schema(
      {
        city: String,
        country: String,
        pricePerNight: Number,
        starRating: Number,
        facilities: [String],
        type: [String],
      },
      { strict: false }
    ),
    "hotels"
  );

const Booking =
  mongoosePkg.models.Booking ||
  mongoosePkg.model(
    "Booking",
    new mongoosePkg.Schema(
      {
        hotelId: String,
        checkIn: Date,
        checkOut: Date,
        status: String,
      },
      { strict: false }
    ),
    "bookings"
  );

const Maintenance =
  mongoosePkg.models.Maintenance ||
  mongoosePkg.model(
    "Maintenance",
    new mongoosePkg.Schema(
      {
        hotelId: String,
        startDate: Date,
        endDate: Date,
      },
      { strict: false }
    ),
    "maintenances"
  );

type CacheEntry = {
  timestamp: number;
  payload: any;
};

const SEARCH_CACHE_ENABLED = process.env.SEARCH_CACHE_ENABLED !== "false";
const SEARCH_CACHE_TTL_MS = Number(process.env.SEARCH_CACHE_TTL_MS || 60_000);
const SEARCH_CACHE_MAX = Number(process.env.SEARCH_CACHE_MAX || 250);
const cacheStore = new Map<string, CacheEntry>();

const stableKey = (params: Record<string, unknown>) => {
  const sorted: Record<string, unknown> = {};
  Object.keys(params)
    .sort()
    .forEach((key) => {
      const value = params[key];
      if (Array.isArray(value)) {
        sorted[key] = [...value].sort();
      } else if (value && typeof value === "object") {
        sorted[key] = stableKey(value as Record<string, unknown>);
      } else {
        sorted[key] = value;
      }
    });
  return JSON.stringify(sorted);
};

const getCached = (key: string) => {
  if (!SEARCH_CACHE_ENABLED) return undefined;
  const entry = cacheStore.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > SEARCH_CACHE_TTL_MS) {
    cacheStore.delete(key);
    return undefined;
  }
  return entry.payload;
};

const setCache = (key: string, payload: any) => {
  if (!SEARCH_CACHE_ENABLED) return;
  if (cacheStore.size >= SEARCH_CACHE_MAX) {
    const firstKey = cacheStore.keys().next().value;
    if (firstKey) cacheStore.delete(firstKey);
  }
  cacheStore.set(key, { timestamp: Date.now(), payload });
};

const normalizeArrayParam = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    if (value.includes(",")) return value.split(",").map((v) => v.trim()).filter(Boolean);
    return [value.trim()].filter(Boolean);
  }
  return [];
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const AMENITY_SECTIONS = [
  "general",
  "room",
  "dining",
  "wellness",
  "business",
  "accessibility",
  "safety",
  "technology",
  "services",
] as const;

const buildAmenitiesFilter = (values: string[]) => {
  if (!values.length) return [];
  return values.map((amenity) => ({
    $or: AMENITY_SECTIONS.map((section) => ({ [`amenitiesDetail.${section}`]: amenity })),
  }));
};

app.get("/hotels/search", async (req: Request, res: Response) => {
  const start = Date.now();
  const {
    destination,
    adultCount,
    childCount,
    facilities,
    types,
    stars,
    maxPrice,
    minPrice,
    sortOption,
    page,
    checkIn,
    checkOut,
    tags,
    featured,
    amenities,
  } = req.query as Record<string, unknown>;

  const facilityFilters = normalizeArrayParam(facilities);
  const typeFilters = normalizeArrayParam(types);
  const starFilters = normalizeArrayParam(stars).map((s) => Number(s)).filter(Number.isFinite);
  const tagFilters = normalizeArrayParam(tags);
  const amenityFilters = normalizeArrayParam(amenities);
  const pageSize = Number(process.env.SEARCH_PAGE_SIZE || 6);
  const pageNumber = Math.max(1, Number(page) || 1);
  const skip = (pageNumber - 1) * pageSize;

  const query: Record<string, unknown> = {};
  if (destination && typeof destination === "string" && destination.trim()) {
    const regex = { $regex: destination.trim(), $options: "i" };
    query.$or = [
      { city: regex },
      { country: regex },
      { "location.city": regex },
      { "location.country": regex },
    ];
  }
  if (adultCount) query.adultCount = { $gte: Number(adultCount) };
  if (childCount) query.childCount = { $gte: Number(childCount) };
  if (facilityFilters.length) query.facilities = { $all: facilityFilters };
  if (typeFilters.length) query.type = { $in: typeFilters };
  if (starFilters.length) query.starRating = { $in: starFilters };
  const priceConditions: Record<string, number> = {};
  const parsedMin = toNumber(minPrice);
  const parsedMax = toNumber(maxPrice);
  if (parsedMin !== undefined) priceConditions.$gte = parsedMin;
  if (parsedMax !== undefined) priceConditions.$lte = parsedMax;
  if (Object.keys(priceConditions).length) query.pricePerNight = priceConditions;
  if ((featured as string)?.toLowerCase() === "true") query.isFeatured = true;
  if (tagFilters.length) query.tags = { $all: tagFilters };
  if (amenityFilters.length) {
    const clauses = buildAmenitiesFilter(amenityFilters);
    query.$and = [...((query.$and as any[]) || []), ...clauses];
  }

  let sort: Record<string, 1 | -1> = {};
  switch (sortOption) {
    case "starRating":
      sort = { starRating: -1 };
      break;
    case "pricePerNightAsc":
      sort = { pricePerNight: 1 };
      break;
    case "pricePerNightDesc":
      sort = { pricePerNight: -1 };
      break;
    case "updated":
      sort = { lastUpdated: -1 };
      break;
    case "popular":
      sort = { totalBookings: -1 };
      break;
    default:
      sort = { starRating: -1, pricePerNight: 1 };
  }

  const cacheKeyPayload = {
    destination: typeof destination === "string" ? destination.trim().toLowerCase() : undefined,
    adultCount: query.adultCount,
    childCount: query.childCount,
    facilityFilters,
    typeFilters,
    starFilters,
    tagFilters,
    amenityFilters,
    priceConditions,
    sort,
    pageNumber,
    pageSize,
    checkIn,
    checkOut,
    featured: query.isFeatured,
  };

  const cacheEligible = !(checkIn && checkOut);
  const cacheKey = cacheEligible ? stableKey(cacheKeyPayload as Record<string, unknown>) : undefined;
  const cached = cacheEligible && cacheKey ? getCached(cacheKey) : undefined;
  if (cached) {
    res.setHeader("x-cache", "HIT");
    return res.json({ ...cached, meta: { ...(cached.meta || {}), servedFromCache: true } });
  }

  let unavailableHotelIds: string[] = [];
  let maintenanceBlocked: string[] = [];
  let bookingBlocked: string[] = [];
  if (checkIn && checkOut) {
    const ci = new Date(String(checkIn));
    const co = new Date(String(checkOut));
    if (!isNaN(ci.getTime()) && !isNaN(co.getTime()) && ci < co) {
      [bookingBlocked, maintenanceBlocked] = await Promise.all([
        Booking.distinct("hotelId", {
          status: { $in: ["pending", "confirmed"] },
          checkIn: { $lt: co },
          checkOut: { $gt: ci },
        }) as Promise<string[]>,
        Maintenance.distinct("hotelId", {
          startDate: { $lt: co },
          endDate: { $gt: ci },
        }) as Promise<string[]>,
      ]);
      unavailableHotelIds = [...new Set([...(bookingBlocked || []), ...(maintenanceBlocked || [])])];
      if (unavailableHotelIds.length) {
        query._id = { $nin: unavailableHotelIds.map((id) => new mongoosePkg.Types.ObjectId(id)) };
      }
    }
  }

  const facetsPromise = Hotel.aggregate([
    { $match: query },
    {
      $facet: {
        starBuckets: [{ $group: { _id: "$starRating", count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
        typeBuckets: [
          { $unwind: { path: "$type", preserveNullAndEmptyArrays: false } },
          { $group: { _id: "$type", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        priceRange: [{ $group: { _id: null, min: { $min: "$pricePerNight" }, max: { $max: "$pricePerNight" } } }],
      },
    },
  ]).then((result) => {
    const [facets] = result;
    return {
      stars: facets?.starBuckets || [],
      types: facets?.typeBuckets || [],
      priceRange: facets?.priceRange?.[0] || { min: null, max: null },
    };
  });

  const [data, total, facets] = await Promise.all([
    Hotel.find(query).sort(sort).skip(skip).limit(pageSize).lean(),
    Hotel.countDocuments(query),
    facetsPromise,
  ]);

  const response = {
    data,
    pagination: { total, page: pageNumber, pages: Math.ceil(total / pageSize), pageSize },
    facets,
    availability: {
      requestedWindow: checkIn && checkOut ? { checkIn, checkOut } : null,
      excludedHotelCount: unavailableHotelIds.length,
      maintenanceBlocked: maintenanceBlocked.length,
      bookingBlocked: bookingBlocked.length,
    },
    meta: {
      durationMs: Date.now() - start,
      servedFromCache: false,
    },
  };

  if (cacheEligible && cacheKey) {
    setCache(cacheKey, response);
    res.setHeader("x-cache", "MISS");
  } else {
    res.setHeader("x-cache", "SKIP");
  }
  res.json(response);
});

app.get("/health", (_req: Request, res: Response) => res.json({ status: "ok", service: "search-service" }));

const port = process.env.PORT || 7105;
app.listen(port, () => console.log(`search-service listening on :${port}`));
