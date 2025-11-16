import { Link } from "react-router-dom";
import { HotelType } from "../../../shared/types";
import { AiFillStar } from "react-icons/ai";
import {
  MapPin,
  Building2,
  Users,
  Wifi,
  Car,
  Waves,
  Dumbbell,
  Sparkles,
  UtensilsCrossed,
  Coffee,
  Plane,
  Building,
} from "lucide-react";
import { Badge } from "./ui/badge";

type Props = {
  hotel: HotelType;
};

const SearchResultsCard = ({ hotel }: Props) => {
  const getFacilityIcon = (facility: string) => {
    const iconMap: { [key: string]: any } = {
      "Free WiFi": Wifi,
      "Free Parking": Car,
      "Swimming Pool": Waves,
      "Fitness Center": Dumbbell,
      Spa: Sparkles,
      Restaurant: UtensilsCrossed,
      "Bar/Lounge": Coffee,
      "Airport Shuttle": Plane,
      "Business Center": Building,
    };
    return iconMap[facility] || Building2;
  };

  return (
    <div className="group rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-[0_25px_80px_rgba(2,6,23,0.45)] transition hover:border-white/30">
      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1.5fr]">
        {/* Image Section */}
        <div className="relative h-64 xl:h-full overflow-hidden">
          <img
            src={hotel.imageUrls[0]}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night-900/80 via-night-900/20 to-transparent" />

          <div className="absolute top-4 left-4 flex flex-col gap-2 text-white">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20">
              {hotel.isFeatured ? "Spotlight" : "Collection"}
            </span>
            <div className="flex items-center gap-2 text-sm">
              <AiFillStar className="text-yellow-300" />
              <span>{hotel.starRating}.0 rating</span>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 text-white">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">
              From
            </p>
            <p className="text-3xl font-semibold">
              ${hotel.pricePerNight}
              <span className="text-sm text-white/70"> / night</span>
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-8 flex flex-col gap-6 text-white">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 text-accentGlow">
                {Array.from({ length: hotel.starRating }).map((_, i) => (
                  <AiFillStar key={i} className="w-4 h-4" />
                ))}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {Array.isArray(hotel.type)
                  ? hotel.type.slice(0, 3).map((type) => (
                      <Badge
                        key={type}
                        variant="outline"
                        className="border-white/20 bg-white/5 text-white"
                      >
                        {type}
                      </Badge>
                    ))
                  : (
                      <Badge
                        variant="outline"
                        className="border-white/20 bg-white/5 text-white"
                      >
                        {hotel.type}
                      </Badge>
                    )}
              </div>
            </div>

            <Link
              to={`/detail/${hotel._id}`}
              className="text-3xl font-semibold font-display hover:text-brand-300 transition-colors"
            >
              {hotel.name}
            </Link>

            <div className="flex items-center text-white/70 text-sm">
              <MapPin className="w-4 h-4 mr-2" />
              {hotel.city}, {hotel.country}
            </div>
            <p className="text-white/70 leading-relaxed line-clamp-3">
              {hotel.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-white/70">
            {hotel.totalBookings && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{hotel.totalBookings} hosted stays</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <AiFillStar className="text-yellow-300" />
              <span>
                {hotel.averageRating && hotel.averageRating > 0
                  ? `${hotel.averageRating.toFixed(1)} guest score`
                  : "Awaiting first review"}
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-[0.35em] text-white/50 mb-3">
              Key amenities
            </h4>
            <div className="flex flex-wrap gap-2">
              {hotel.facilities.slice(0, 6).map((facility) => {
                const IconComponent = getFacilityIcon(facility);
                return (
                  <Badge
                    key={facility}
                    variant="outline"
                    className="flex items-center gap-2 border-white/15 bg-white/5 text-white/80 px-3 py-1.5"
                  >
                    <IconComponent className="w-3.5 h-3.5 text-accentGlow" />
                    <span>{facility}</span>
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-white/10 pt-6">
            <div className="text-sm text-white/70">
              Instant confirmation • Secure checkout
            </div>
            <Link
              to={`/detail/${hotel._id}`}
              className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700 font-semibold shadow-glow hover:-translate-y-0.5 transition"
            >
              View details & book
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsCard;
