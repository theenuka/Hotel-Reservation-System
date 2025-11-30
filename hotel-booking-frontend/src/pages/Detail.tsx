import { useParams } from "react-router-dom";
import { useQueryWithLoading } from "../hooks/useLoadingHooks";
import * as apiClient from "./../api-client";
import { AiFillStar } from "react-icons/ai";
import GuestInfoForm from "../forms/GuestInfoForm/GuestInfoForm";
import FacilityBooking from "../components/FacilityBooking";
import { Badge } from "../components/ui/badge";
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  Car,
  Wifi,
  Waves,
  Dumbbell,
  Sparkles,
  Plane,
  Building2,
} from "lucide-react";

const Detail = () => {
  const { hotelId } = useParams();

  const { data: hotel } = useQueryWithLoading(
    "fetchHotelById",
    () => apiClient.fetchHotelById(hotelId || ""),
    {
      enabled: !!hotelId,
      loadingMessage: "Loading hotel details...",
    }
  );

  if (!hotel) {
    return (
      <div className="text-center text-lg text-gray-400 py-10">
        No hotel found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="flex">
          {Array.from({ length: hotel.starRating }).map((_, i) => (
            <AiFillStar key={i} className="fill-yellow-400" />
          ))}
        </span>
        <h1 className="text-3xl font-bold text-white">{hotel.name}</h1>

        {/* Location and Contact Info */}
        <div className="flex items-center gap-4 mt-2 text-gray-400">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>
              {hotel.city}, {hotel.country}
            </span>
          </div>
          {hotel.contact?.phone && (
            <div className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              <span>{hotel.contact.phone}</span>
            </div>
          )}
          {hotel.contact?.website && (
            <div className="flex items-center gap-1">
              <Globe className="w-4 h-4" />
              <a
                href={hotel.contact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                Website
              </a>
            </div>
          )}
        </div>

        {/* Hotel Stats */}
        {((hotel.totalBookings && hotel.totalBookings > 0) ||
          (hotel.totalRevenue && hotel.totalRevenue > 0) ||
          hotel.isFeatured) && (
          <div className="flex gap-4 mt-4">
            {hotel.totalBookings && hotel.totalBookings > 0 && (
              <Badge variant="outline">{hotel.totalBookings} bookings</Badge>
            )}
            {hotel.totalRevenue && hotel.totalRevenue > 0 && (
              <Badge variant="outline">
                £{hotel.totalRevenue.toLocaleString()} revenue
              </Badge>
            )}
            {/* Rating Badge - Always show with appropriate message */}
            <Badge variant="outline" className="text-gray-400 border-white/20">
              {hotel.averageRating && hotel.averageRating > 0
                ? `${hotel.averageRating.toFixed(1)} avg rating`
                : "Rating feature not yet implemented"}
            </Badge>
            {hotel.isFeatured && (
              <Badge className="bg-yellow-900/30 text-yellow-400 border-yellow-500/30">Featured</Badge>
            )}
          </div>
        )}

        {/* Hotel Types */}
        {hotel.type && hotel.type.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {hotel.type.map((type, index) => (
              <Badge
                key={index}
                variant="outline"
                className="bg-blue-900/20 text-blue-400 border-blue-500/30"
              >
                {type}
              </Badge>
            ))}
          </div>
        )}

        {/* Hotel Images */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          {hotel.imageUrls.map((image: string, i: number) => (
            <div key={i} className="h-[300px]">
              <img
                src={image}
                alt={hotel.name}
                className="rounded-md w-full h-full object-cover object-center"
              />
            </div>
          ))}
        </div>

        {/* Price and Guest Info */}
        <div className="flex items-center justify-between mt-4 p-4 bg-night-800 rounded-lg border border-white/10">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                £{hotel.pricePerNight}
              </p>
              <p className="text-sm text-gray-400">per night</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-lg font-semibold text-white">
                  {hotel.adultCount}
                </p>
                <p className="text-sm text-gray-400">Adults</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-white">
                  {hotel.childCount}
                </p>
                <p className="text-sm text-gray-400">Children</p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-white">
              {hotel.starRating}
            </p>
            <p className="text-sm text-gray-400">Star Rating</p>
          </div>
        </div>

        {/* Hotel Description */}
        {hotel.description && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-3 text-white">About This Hotel</h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
              {hotel.description}
            </p>
          </div>
        )}
      </div>

      {/* Contact Information */}
      {hotel.contact && (
        <div className="border border-white/10 rounded-lg p-4 bg-night-800">
          <h3 className="text-xl font-semibold mb-3 text-white">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-300">
            {hotel.contact.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>
                  <strong>Phone:</strong> {hotel.contact.phone}
                </span>
              </div>
            )}
            {hotel.contact.email && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <span>
                  <strong>Email:</strong> {hotel.contact.email}
                </span>
              </div>
            )}
            {hotel.contact.website && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <span>
                  <strong>Website:</strong>{" "}
                  <a
                    href={hotel.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Visit Website
                  </a>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hotel Policies */}
      {hotel.policies && (
        <div className="border border-white/10 rounded-lg p-4 bg-night-800">
          <h3 className="text-xl font-semibold mb-3 text-white">Hotel Policies</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
            {hotel.policies.checkInTime && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>
                  <strong>Check-in:</strong> {hotel.policies.checkInTime}
                </span>
              </div>
            )}
            {hotel.policies.checkOutTime && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>
                  <strong>Check-out:</strong> {hotel.policies.checkOutTime}
                </span>
              </div>
            )}
            {hotel.policies.cancellationPolicy && (
              <div>
                <strong>Cancellation:</strong>{" "}
                {hotel.policies.cancellationPolicy}
              </div>
            )}
            {hotel.policies.petPolicy && (
              <div>
                <strong>Pet Policy:</strong> {hotel.policies.petPolicy}
              </div>
            )}
            {hotel.policies.smokingPolicy && (
              <div>
                <strong>Smoking:</strong> {hotel.policies.smokingPolicy}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Facilities */}
      <div className="border border-white/10 rounded-lg p-4 bg-night-800">
        <h3 className="text-xl font-semibold mb-3 text-white">Facilities</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-gray-300">
          {hotel.facilities.map((facility) => (
            <div key={facility} className="flex items-center gap-2">
              <div className="w-4 h-4 text-green-500">
                {facility === "Free WiFi" && <Wifi className="w-4 h-4" />}
                {facility === "Parking" && <Car className="w-4 h-4" />}
                {facility === "Airport Shuttle" && (
                  <Plane className="w-4 h-4" />
                )}
                {facility === "Outdoor Pool" && <Waves className="w-4 h-4" />}
                {facility === "Spa" && <Sparkles className="w-4 h-4" />}
                {facility === "Fitness Center" && (
                  <Dumbbell className="w-4 h-4" />
                )}
                {facility === "Family Rooms" && (
                  <Building2 className="w-4 h-4" />
                )}
                {facility === "Non-Smoking Rooms" && (
                  <Building2 className="w-4 h-4" />
                )}
                {![
                  "Free WiFi",
                  "Parking",
                  "Airport Shuttle",
                  "Outdoor Pool",
                  "Spa",
                  "Fitness Center",
                  "Family Rooms",
                  "Non-Smoking Rooms",
                ].includes(facility) && <Building2 className="w-4 h-4" />}
              </div>
              <span>{facility}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Facility Booking (Spa, Gym, Conference Rooms) */}
      {hotel.facilitySpaces && hotel.facilitySpaces.length > 0 && (
        <FacilityBooking hotelId={hotel._id} facilitySpaces={hotel.facilitySpaces} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr]">
        <div className="h-fit">
          <GuestInfoForm
            pricePerNight={hotel.pricePerNight}
            hotelId={hotel._id}
          />
        </div>
      </div>
    </div>
  );
};

export default Detail;
