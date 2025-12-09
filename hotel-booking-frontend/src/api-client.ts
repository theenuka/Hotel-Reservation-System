import axiosInstance from "./lib/api-client";
import {
  HotelSearchResponse,
  HotelType,
  PaymentIntentResponse,
  UserType,
  HotelWithBookingsType,
  BookingType,
} from "../../shared/types";
import { BookingFormData } from "./forms/BookingForm/BookingForm";

// NOTE: We removed 'register' and 'signIn' functions because Asgardeo handles auth now.

export const fetchCurrentUser = async (): Promise<UserType> => {
  const response = await axiosInstance.get("/api/users/me");
  return response.data;
};

// Development utility to clear all browser storage
export const clearAllStorage = () => {
  localStorage.clear();
  sessionStorage.clear();
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
};

export const addMyHotel = async (hotelFormData: FormData) => {
  const response = await axiosInstance.post("/api/my-hotels", hotelFormData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const fetchMyHotels = async (): Promise<HotelType[]> => {
  const response = await axiosInstance.get("/api/my-hotels");
  return response.data;
};

export const fetchMyHotelById = async (hotelId: string): Promise<HotelType> => {
  const response = await axiosInstance.get(`/api/my-hotels/${hotelId}`);
  return response.data;
};

export const updateMyHotelById = async (hotelFormData: FormData) => {
  const hotelId = hotelFormData.get("hotelId");
  const response = await axiosInstance.put(
    `/api/my-hotels/${hotelId}`,
    hotelFormData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const deleteMyHotelById = async (hotelId: string) => {
  const response = await axiosInstance.delete(`/api/my-hotels/${hotelId}`);
  return response.data;
};

export type SearchParams = {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  adultCount?: string;
  childCount?: string;
  page?: string;
  facilities?: string[];
  types?: string[];
  stars?: string[];
  maxPrice?: string;
  sortOption?: string;
};

export const searchHotels = async (
  searchParams: SearchParams
): Promise<HotelSearchResponse> => {
  const queryParams = new URLSearchParams();

  if (searchParams.destination && searchParams.destination.trim() !== "") {
    queryParams.append("destination", searchParams.destination.trim());
  }

  if (searchParams.checkIn) queryParams.append("checkIn", searchParams.checkIn);
  if (searchParams.checkOut) queryParams.append("checkOut", searchParams.checkOut);
  if (searchParams.adultCount) queryParams.append("adultCount", searchParams.adultCount);
  if (searchParams.childCount) queryParams.append("childCount", searchParams.childCount);
  if (searchParams.page) queryParams.append("page", searchParams.page);
  if (searchParams.maxPrice) queryParams.append("maxPrice", searchParams.maxPrice);
  if (searchParams.sortOption) queryParams.append("sortOption", searchParams.sortOption);

  searchParams.facilities?.forEach((facility) =>
    queryParams.append("facilities", facility)
  );

  searchParams.types?.forEach((type) => queryParams.append("types", type));
  searchParams.stars?.forEach((star) => queryParams.append("stars", star));

  const response = await axiosInstance.get(`/api/hotels/search?${queryParams}`);
  return response.data;
};

export const fetchHotels = async (): Promise<HotelType[]> => {
  const response = await axiosInstance.get("/api/hotels");
  return response.data;
};

export const fetchHotelById = async (hotelId: string): Promise<HotelType> => {
  const response = await axiosInstance.get(`/api/hotels/${hotelId}`);
  return response.data;
};

export const createPaymentIntent = async (
  hotelId: string,
  numberOfNights: string,
  roomCount: number = 1
): Promise<PaymentIntentResponse> => {
  const response = await axiosInstance.post(
    `/api/hotels/${hotelId}/bookings/payment-intent`,
    { numberOfNights, roomCount }
  );
  return response.data;
};

export const createRoomBooking = async (formData: BookingFormData) => {
  const response = await axiosInstance.post(
    `/api/hotels/${formData.hotelId}/bookings`,
    formData
  );
  return response.data;
};

export const fetchMyBookings = async (): Promise<HotelWithBookingsType[]> => {
  const response = await axiosInstance.get("/api/my-bookings");
  return response.data;
};

export const fetchHotelBookings = async (
  hotelId: string
): Promise<BookingType[]> => {
  const response = await axiosInstance.get(`/api/bookings/hotel/${hotelId}`);
  return response.data;
};

// Business Insights API functions
export const fetchBusinessInsightsDashboard = async () => {
  const response = await axiosInstance.get("/api/business-insights/dashboard");
  return response.data;
};

export const fetchBusinessInsightsForecast = async () => {
  const response = await axiosInstance.get("/api/business-insights/forecast");
  return response.data;
};

export const fetchBusinessInsightsPerformance = async () => {
  const response = await axiosInstance.get(
    "/api/business-insights/performance"
  );
  return response.data;
};

// User Profile API functions
export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
}

export const updateUserProfile = async (data: UpdateProfileData): Promise<UserType> => {
  const response = await axiosInstance.patch("/api/users/me", data);
  return response.data;
};

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  bookingConfirmation: boolean;
  bookingReminder: boolean;
  promotions: boolean;
  newsletter: boolean;
}

export const updateNotificationPreferences = async (
  preferences: NotificationPreferences
): Promise<{ success: boolean }> => {
  const response = await axiosInstance.patch("/api/users/me/notifications", preferences);
  return response.data;
};

export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const response = await axiosInstance.get("/api/users/me/notifications");
  return response.data;
};

// Loyalty Program API functions
export interface LoyaltyInfo {
  tier: "bronze" | "silver" | "gold" | "platinum";
  points: number;
  totalBookings: number;
  memberSince: string;
  nextTierPoints?: number;
  benefits: string[];
}

export const getLoyaltyInfo = async (): Promise<LoyaltyInfo> => {
  const response = await axiosInstance.get("/api/users/me/loyalty");
  return response.data;
};

// Booking Cancellation API
export const cancelBooking = async (
  bookingId: string,
  reason?: string
): Promise<{ success: boolean; refundAmount?: number }> => {
  const response = await axiosInstance.post(`/api/bookings/${bookingId}/cancel`, {
    reason,
  });
  return response.data;
};

// Update a room booking
export const updateBooking = async (
  bookingId: string,
  updates: Partial<{
    checkIn: Date | string;
    checkOut: Date | string;
    adultCount: number;
    childCount: number;
  }>
): Promise<BookingType> => {
  const formattedUpdates = {
    ...updates,
    checkIn: updates.checkIn instanceof Date ? updates.checkIn.toISOString() : updates.checkIn,
    checkOut: updates.checkOut instanceof Date ? updates.checkOut.toISOString() : updates.checkOut,
  };
  const response = await axiosInstance.patch(`/api/bookings/${bookingId}`, formattedUpdates);
  return response.data;
};

// Join a hotel waitlist
export const joinWaitlist = async (
  hotelId: string,
  data: {
    checkIn: string;
    checkOut: string;
    roomCount: number;
    email: string;
    phone?: string;
  }
): Promise<{ success: boolean; message: string }> => {
  const response = await axiosInstance.post(
    `/api/hotels/${hotelId}/waitlist`,
    data
  );
  return response.data;
};

// Notifications API
export interface Notification {
  _id: string;
  type: "booking" | "reminder" | "promotion" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await axiosInstance.get("/api/notifications");
  return response.data;
};

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  await axiosInstance.patch(`/api/notifications/${notificationId}/read`);
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await axiosInstance.patch("/api/notifications/read-all");
};

export const getUnreadNotificationCount = async (): Promise<{ count: number }> => {
  const response = await axiosInstance.get("/api/notifications/unread-count");
  return response.data;
};

// ============================================================================
// FACILITY BOOKING API FUNCTIONS (Spa, Gym, Conference Rooms)
// ============================================================================

export interface FacilityBooking {
  _id: string;
  userId: string;
  hotelId: string;
  facilityName: string;
  facilityType: "spa" | "gym" | "conference" | "pool" | "restaurant" | "other";
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  guestCount: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalCost: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FacilityAvailability {
  date: string;
  facilityName: string;
  bookedSlots: Array<{
    startTime: string;
    endTime: string;
    guestCount: number;
  }>;
}

export interface FacilityBookingInput {
  facilityName: string;
  facilityType: "spa" | "gym" | "conference" | "pool" | "restaurant" | "other";
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  guestCount: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalCost: number;
  specialRequests?: string;
}

// Get facility availability for a specific date
export const getFacilityAvailability = async (
  hotelId: string,
  facilityName: string,
  date: string
): Promise<FacilityAvailability> => {
  const response = await axiosInstance.get(
    `/api/hotels/${hotelId}/facilities/${encodeURIComponent(facilityName)}/availability`,
    { params: { date } }
  );
  return response.data;
};

// Book a facility (spa, gym, conference room, etc.)
export const bookFacility = async (
  hotelId: string,
  bookingData: FacilityBookingInput
): Promise<{ bookingId: string; booking: FacilityBooking }> => {
  const response = await axiosInstance.post(
    `/api/hotels/${hotelId}/facilities/book`,
    bookingData
  );
  return response.data;
};

// Get user's facility bookings
export const getMyFacilityBookings = async (): Promise<FacilityBooking[]> => {
  const response = await axiosInstance.get("/api/my-facility-bookings");
  return response.data;
};

// Get facility bookings for a hotel (hotel owner)
export const getHotelFacilityBookings = async (
  hotelId: string,
  filters?: {
    facilityName?: string;
    status?: string;
    date?: string;
  }
): Promise<FacilityBooking[]> => {
  const response = await axiosInstance.get(
    `/api/hotels/${hotelId}/facility-bookings`,
    { params: filters }
  );
  return response.data;
};

// Cancel a facility booking
export const cancelFacilityBooking = async (
  bookingId: string,
  reason?: string
): Promise<{ success: boolean }> => {
  const response = await axiosInstance.post(
    `/api/facility-bookings/${bookingId}/cancel`,
    { reason }
  );
  return response.data;
};

// Update a facility booking
export const updateFacilityBooking = async (
  bookingId: string,
  updates: Partial<{
    bookingDate: string;
    startTime: string;
    endTime: string;
    guestCount: number;
    specialRequests: string;
  }>
): Promise<FacilityBooking> => {
  const response = await axiosInstance.patch(
    `/api/facility-bookings/${bookingId}`,
    updates
  );
  return response.data;
};

// ============================================================================
// ALL BOOKINGS API (ADMIN/STAFF)
// ============================================================================

export interface AllBookingsFilters {
  status?: "pending" | "confirmed" | "cancelled" | "completed" | "refunded";
  hotelId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export const fetchAllBookings = async (
  filters?: AllBookingsFilters
): Promise<BookingType[]> => {
  const queryParams = new URLSearchParams();

  if (filters?.status) queryParams.append("status", filters.status);
  if (filters?.hotelId) queryParams.append("hotelId", filters.hotelId);
  if (filters?.startDate) queryParams.append("startDate", filters.startDate);
  if (filters?.endDate) queryParams.append("endDate", filters.endDate);
  if (filters?.limit) queryParams.append("limit", filters.limit.toString());

  const queryString = queryParams.toString();
  const url = queryString ? `/api/bookings/all?${queryString}` : "/api/bookings/all";

  const response = await axiosInstance.get(url);
  return response.data;
};
