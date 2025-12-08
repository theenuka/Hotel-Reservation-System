import Booking from "../models/booking";
import Maintenance from "../models/maintenance";
import Waitlist from "../models/waitlist";
import { sendNotification } from "./notification";

export const hasOverlap = async (hotelId: string, checkIn: Date, checkOut: Date, excludeBookingId?: string) => {
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

export const hasMaintenanceConflict = async (hotelId: string, checkIn: Date, checkOut: Date) => {
  return Maintenance.exists({ hotelId, startDate: { $lt: checkOut }, endDate: { $gt: checkIn } });
};

export const ensureAvailability = async (hotelId: string, checkIn: Date, checkOut: Date, excludeBookingId?: string) => {
  const [bookingConflict, maintenanceConflict] = await Promise.all([
    hasOverlap(hotelId, checkIn, checkOut, excludeBookingId),
    hasMaintenanceConflict(hotelId, checkIn, checkOut),
  ]);
  return { bookingConflict: !!bookingConflict, maintenanceConflict: !!maintenanceConflict };
};

export const createOrUpdateWaitlistEntry = async (
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

export const notifyWaitlistAvailability = async (hotelId: string, checkIn: Date, checkOut: Date) => {
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
        metadata: {
          hotelId,
          waitlistId: entry._id,
          checkIn: entry.checkIn?.toISOString?.() || entry.checkIn,
          checkOut: entry.checkOut?.toISOString?.() || entry.checkOut,
        },
      });
      entry.status = "notified";
      entry.notifiedAt = new Date();
      await entry.save();
    })
  );
};
