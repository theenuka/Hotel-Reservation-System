import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search as SearchIcon,
  Filter,
  MapPin,
  Calendar,
  Users,
} from "lucide-react";
import useSearchContext from "../hooks/useSearchContext";

interface AdvancedSearchProps {
  onSearch: (searchData: any) => void;
  isExpanded?: boolean;
}

type SearchFormState = {
  destination: string;
  checkIn: Date;
  checkOut: Date;
  adultCount: number;
  childCount: number;
  minPrice: string;
  maxPrice: string;
  starRating: string;
  hotelType: string;
  facilities: string[];
  sortBy: "relevance" | "priceLow" | "priceHigh" | "rating" | "distance";
  radius: "10" | "25" | "50" | "100";
  instantBooking: boolean;
  freeCancellation: boolean;
  breakfast: boolean;
  wifi: boolean;
  parking: boolean;
  pool: boolean;
  gym: boolean;
  spa: boolean;
};

const formatDateInput = (value: Date): string => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return "";
  }
  return value.toISOString().split("T")[0];
};

const buildClearedState = (): SearchFormState => ({
  destination: "",
  checkIn: new Date(),
  checkOut: new Date(),
  adultCount: 1,
  childCount: 0,
  minPrice: "",
  maxPrice: "",
  starRating: "",
  hotelType: "",
  facilities: [],
  sortBy: "relevance",
  radius: "50",
  instantBooking: false,
  freeCancellation: false,
  breakfast: false,
  wifi: false,
  parking: false,
  pool: false,
  gym: false,
  spa: false,
});

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  isExpanded = false,
}) => {
  const navigate = useNavigate();
  const search = useSearchContext();
  const inputIds = {
    destination: "advanced-destination",
    checkIn: "advanced-check-in",
    checkOut: "advanced-check-out",
    guests: "advanced-guests",
    minPrice: "advanced-min-price",
    maxPrice: "advanced-max-price",
    starRating: "advanced-star-rating",
    hotelType: "advanced-hotel-type",
    sortBy: "advanced-sort-by",
    radius: "advanced-radius",
  } as const;
  const [showAdvanced, setShowAdvanced] = useState(isExpanded);
  const [searchData, setSearchData] = useState<SearchFormState>({
    ...buildClearedState(),
    destination: search.destination,
    checkIn: search.checkIn,
    checkOut: search.checkOut,
    adultCount: search.adultCount,
    childCount: search.childCount,
  });

  // Dropdown functionality for destination
  const [showDropdown, setShowDropdown] = useState(false);
  const [places, setPlaces] = useState<string[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<string[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const hasFetchedRef = useRef(false);

  // Fetch hotel places on mount
  useEffect(() => {
    // Prevent multiple API calls - use a ref to track if we've already fetched
    if (isLoadingPlaces || hasFetchedRef.current) return;

    const fetchPlaces = async () => {
      try {
        setIsLoadingPlaces(true);
        hasFetchedRef.current = true;

        // Check if we have cached places data
        const cachedPlaces = localStorage.getItem("hotelPlaces");
        if (cachedPlaces) {
          const parsedPlaces = JSON.parse(cachedPlaces);
          const cacheTime = localStorage.getItem("hotelPlacesTime");
          const now = Date.now();

          // Cache is valid for 5 minutes
          if (cacheTime && now - parseInt(cacheTime) < 5 * 60 * 1000) {
            setPlaces(parsedPlaces);
            setIsLoadingPlaces(false);
            return;
          }
        }

        const apiBaseUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:7002";
        const response = await fetch(`${apiBaseUrl}/api/hotels`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: { city?: string; place?: string; name?: string }[] =
          await response.json();
        const uniquePlaces: string[] = Array.from(
          new Set(
            data
              .map((hotel) => hotel.city || hotel.place || hotel.name)
              .filter(
                (place): place is string =>
                  typeof place === "string" && place.length > 0
              )
          )
        );

        // Cache the places data
        localStorage.setItem("hotelPlaces", JSON.stringify(uniquePlaces));
        localStorage.setItem("hotelPlacesTime", Date.now().toString());

        setPlaces(uniquePlaces);
      } catch (error) {
        console.error("Error fetching hotels:", error);
        setPlaces([]);
      } finally {
        setIsLoadingPlaces(false);
      }
    };

    fetchPlaces();
  }, []); // Remove all dependencies to run only once on mount

  // Clear dropdown state when component mounts
  useEffect(() => {
    setShowDropdown(false);
    setFilteredPlaces([]);
  }, []);

  // Filter places as user types
  useEffect(() => {
    if (searchData.destination.length > 0) {
      const filtered = places.filter((place) =>
        place.toLowerCase().includes(searchData.destination.toLowerCase())
      );
      setFilteredPlaces(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setShowDropdown(false);
    }
  }, [searchData.destination, places]);

  const hotelTypes = [
    "Hotel",
    "Resort",
    "Motel",
    "Hostel",
    "Apartment",
    "Villa",
    "Cottage",
    "B&B",
  ];

  const facilityOptions = [
    { id: "wifi", label: "Free WiFi", icon: "📶" },
    { id: "parking", label: "Free Parking", icon: "🚗" },
    { id: "pool", label: "Swimming Pool", icon: "🏊" },
    { id: "gym", label: "Fitness Center", icon: "💪" },
    { id: "spa", label: "Spa", icon: "🧖" },
    { id: "breakfast", label: "Free Breakfast", icon: "🍳" },
    { id: "instantBooking", label: "Instant Booking", icon: "⚡" },
    { id: "freeCancellation", label: "Free Cancellation", icon: "✅" },
  ];

  const handleInputChange = (field: string, value: any) => {
    setSearchData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFacilityToggle = (facilityId: string) => {
    setSearchData((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(facilityId)
        ? prev.facilities.filter((f) => f !== facilityId)
        : [...prev.facilities, facilityId],
    }));
  };

  const handleSearch = () => {
    // Only proceed if destination is not empty
    if (!searchData.destination || searchData.destination.trim() === "") {
      // Show all hotels when destination is empty
      search.saveSearchValues(
        "", // Empty destination to show all hotels
        searchData.checkIn,
        searchData.checkOut,
        searchData.adultCount,
        searchData.childCount
      );

      // Close dropdown before navigation
      setShowDropdown(false);
      setFilteredPlaces([]);

      // Navigate to search page with advanced filters
      const searchParams = new URLSearchParams();
      searchParams.append("destination", ""); // Empty destination
      searchParams.append("checkIn", searchData.checkIn.toISOString());
      searchParams.append("checkOut", searchData.checkOut.toISOString());
      searchParams.append("adultCount", searchData.adultCount.toString());
      searchParams.append("childCount", searchData.childCount.toString());

      // Add advanced filters
      if (searchData.minPrice)
        searchParams.append("minPrice", searchData.minPrice);
      if (searchData.maxPrice)
        searchParams.append("maxPrice", searchData.maxPrice);
      if (searchData.starRating)
        searchParams.append("starRating", searchData.starRating);
      if (searchData.hotelType)
        searchParams.append("hotelType", searchData.hotelType);
      if (searchData.sortBy) searchParams.append("sortBy", searchData.sortBy);
      if (searchData.radius) searchParams.append("radius", searchData.radius);
      searchData.facilities.forEach((facility) =>
        searchParams.append("facilities", facility)
      );

      navigate(`/search?${searchParams.toString()}`);
      onSearch(searchData);

      // Don't clear search values immediately - let the search page use them
      // Only clear the local form state
      setTimeout(() => {
        setSearchData(buildClearedState());
        // Remove this line: search.clearSearchValues();
      }, 100);
      return;
    }

    // Update search context
    search.saveSearchValues(
      searchData.destination.trim(),
      searchData.checkIn,
      searchData.checkOut,
      searchData.adultCount,
      searchData.childCount
    );

    // Close dropdown before navigation
    setShowDropdown(false);
    setFilteredPlaces([]);

    // Navigate to search page with advanced filters
    const searchParams = new URLSearchParams();
    searchParams.append("destination", searchData.destination.trim());
    searchParams.append("checkIn", searchData.checkIn.toISOString());
    searchParams.append("checkOut", searchData.checkOut.toISOString());
    searchParams.append("adultCount", searchData.adultCount.toString());
    searchParams.append("childCount", searchData.childCount.toString());

    // Add advanced filters
    if (searchData.minPrice)
      searchParams.append("minPrice", searchData.minPrice);
    if (searchData.maxPrice)
      searchParams.append("maxPrice", searchData.maxPrice);
    if (searchData.starRating)
      searchParams.append("starRating", searchData.starRating);
    if (searchData.hotelType)
      searchParams.append("hotelType", searchData.hotelType);
    if (searchData.sortBy) searchParams.append("sortBy", searchData.sortBy);
    if (searchData.radius) searchParams.append("radius", searchData.radius);
    searchData.facilities.forEach((facility) =>
      searchParams.append("facilities", facility)
    );

    navigate(`/search?${searchParams.toString()}`);
    onSearch(searchData);

    // Don't clear search values immediately - let the search page use them
    // Only clear the local form state
    setTimeout(() => {
      setSearchData(buildClearedState());
      // Remove this line: search.clearSearchValues();
    }, 100);
  };

  const handleQuickSearch = (destination: string) => {
    if (!destination || destination.trim() === "") {
      // Show all hotels when destination is empty
      setSearchData((prev) => ({ ...prev, destination: "" }));
      setTimeout(() => handleSearch(), 100);
      return;
    }

    setSearchData((prev) => ({ ...prev, destination: destination.trim() }));
    setTimeout(() => handleSearch(), 100);
  };

  // const handleClear = () => {
  //   setSearchData({
  //     destination: "",
  //     checkIn: new Date(),
  //     checkOut: new Date(),
  //     adultCount: 1,
  //     childCount: 0,
  //     minPrice: "",
  //     maxPrice: "",
  //     starRating: "",
  //     hotelType: "",
  //     facilities: [],
  //     sortBy: "relevance",
  //     radius: "50",
  //     instantBooking: false,
  //     freeCancellation: false,
  //     breakfast: false,
  //     wifi: false,
  //     parking: false,
  //     pool: false,
  //     gym: false,
  //     spa: false,
  //   });
  //   search.clearSearchValues();
  // };

  const popularDestinations = [
    "New York",
    "London",
    "Paris",
    "Tokyo",
    "Sydney",
    "Dubai",
    "Singapore",
    "Barcelona",
  ];

  const baseLabel =
    "flex items-center gap-2 text-[0.7rem] font-semibold tracking-[0.35em] uppercase text-slate-500";
  const baseField =
    "w-full h-[54px] rounded-2xl border border-slate-200/70 bg-white/95 text-night-900 placeholder:text-slate-400 shadow-[0_15px_30px_rgba(15,23,42,0.08)] focus:ring-2 focus:ring-brand-400 focus:border-transparent transition";

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-white to-brand-50/70 text-night-900 rounded-[32px] shadow-[0_35px_90px_rgba(8,26,54,0.18)] p-6 sm:p-8 max-w-6xl mx-auto border border-white/70">
      <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 bg-gradient-to-br from-brand-200 to-accentGlow/40 blur-3xl opacity-50" />
      <div className="pointer-events-none absolute -bottom-12 -left-6 w-40 h-40 bg-gradient-to-t from-brand-100 to-accentGlow/30 blur-3xl opacity-60" />
      <div className="relative">
      {/* Basic Search */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        {/* Destination */}
        <div className="space-y-2">
          <label
            htmlFor={inputIds.destination}
            className={baseLabel}
          >
            <MapPin className="w-4 h-4 text-brand-500" />
            Destination
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Where are you going?"
              className={`${baseField} pl-12 pr-4`}
              id={inputIds.destination}
              value={searchData.destination}
              onChange={(e) => handleInputChange("destination", e.target.value)}
              onFocus={() => setShowDropdown(filteredPlaces.length > 0)}
              onBlur={() => setShowDropdown(false)}
            />
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            {showDropdown && (
              <ul className="absolute left-0 z-10 w-full overflow-y-auto bg-white/95 border border-slate-200 rounded-2xl shadow-[0_25px_60px_rgba(15,23,42,0.15)] top-full max-h-48">
                {filteredPlaces.map((place) => (
                  <li
                    key={place}
                    className="px-4 py-2 text-sm border-b border-slate-100 cursor-pointer hover:bg-slate-50 last:border-b-0"
                    onMouseDown={() => {
                      handleInputChange("destination", place);
                      setShowDropdown(false);
                    }}
                  >
                    {place}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Check-in Date */}
        <div className="space-y-2">
          <label
            htmlFor={inputIds.checkIn}
            className={baseLabel}
          >
            <Calendar className="w-4 h-4 text-brand-500" />
            Check-in
          </label>
          <div className="relative">
            <input
              type="date"
              className={`${baseField} pl-12 pr-4`}
              id={inputIds.checkIn}
              value={formatDateInput(searchData.checkIn)}
              onChange={(e) =>
                handleInputChange("checkIn", new Date(e.target.value))
              }
            />
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          </div>
        </div>

        {/* Check-out Date */}
        <div className="space-y-2">
          <label
            htmlFor={inputIds.checkOut}
            className={baseLabel}
          >
            <Calendar className="w-4 h-4 text-brand-500" />
            Check-out
          </label>
          <div className="relative">
            <input
              type="date"
              className={`${baseField} pl-12 pr-4`}
              id={inputIds.checkOut}
              value={formatDateInput(searchData.checkOut)}
              onChange={(e) =>
                handleInputChange("checkOut", new Date(e.target.value))
              }
            />
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          </div>
        </div>

        {/* Guests */}
        <div className="space-y-2">
          <label
            htmlFor={inputIds.guests}
            className={baseLabel}
          >
            <Users className="w-4 h-4 text-brand-500" />
            Guests
          </label>
          <div className="relative">
            <select
              className={`${baseField} pl-12 pr-10 appearance-none`}
              id={inputIds.guests}
              value={`${searchData.adultCount} adults, ${searchData.childCount} children`}
              onChange={(e) => {
                const [adults, children] = e.target.value.split(", ");
                handleInputChange("adultCount", parseInt(adults));
                handleInputChange("childCount", parseInt(children));
              }}
            >
              <option value="1 adults, 0 children">1 adult</option>
              <option value="2 adults, 0 children">2 adults</option>
              <option value="1 adults, 1 children">1 adult, 1 child</option>
              <option value="2 adults, 1 children">2 adults, 1 child</option>
              <option value="2 adults, 2 children">2 adults, 2 children</option>
              <option value="3 adults, 0 children">3 adults</option>
              <option value="4 adults, 0 children">4 adults</option>
            </select>
            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Advanced Search Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-400 hover:text-brand-500"
        >
          <Filter className="w-4 h-4" />
          {showAdvanced ? "Hide" : "Show"} advanced filters
        </button>

        <button
          onClick={handleSearch}
          className="flex items-center gap-2 px-8 py-3 font-semibold text-white transition-transform duration-200 bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700 rounded-2xl shadow-[0_20px_35px_rgba(37,99,235,0.35)] hover:scale-[1.01]"
        >
          <SearchIcon className="w-4 h-4" />
          Search Hotels
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="pt-6 space-y-6 border-t border-slate-200/60">
          {/* Price Range */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block mb-2 text-xs font-semibold tracking-[0.3em] uppercase text-slate-500">
                Price Range
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className={`${baseField} px-4`}
                  aria-label="Minimum price"
                  value={searchData.minPrice}
                  onChange={(e) =>
                    handleInputChange("minPrice", e.target.value)
                  }
                />
                <span className="flex items-center text-slate-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  className={`${baseField} px-4`}
                  aria-label="Maximum price"
                  value={searchData.maxPrice}
                  onChange={(e) =>
                    handleInputChange("maxPrice", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Star Rating */}
            <div>
              <label
                htmlFor={inputIds.starRating}
                className="block mb-2 text-xs font-semibold tracking-[0.3em] uppercase text-slate-500"
              >
                Star Rating
              </label>
              <select
                className={`${baseField} px-4`}
                id={inputIds.starRating}
                value={searchData.starRating}
                onChange={(e) =>
                  handleInputChange("starRating", e.target.value)
                }
              >
                <option value="">Any Rating</option>
                <option value="5">5 Stars</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
              </select>
            </div>

            {/* Hotel Type */}
            <div>
              <label
                htmlFor={inputIds.hotelType}
                className="block mb-2 text-xs font-semibold tracking-[0.3em] uppercase text-slate-500"
              >
                Hotel Type
              </label>
              <select
                className={`${baseField} px-4`}
                id={inputIds.hotelType}
                value={searchData.hotelType}
                onChange={(e) => handleInputChange("hotelType", e.target.value)}
              >
                <option value="">Any Type</option>
                {hotelTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Facilities */}
          <div>
            <label className="block mb-3 text-xs font-semibold tracking-[0.3em] uppercase text-slate-500">
              Facilities
            </label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {facilityOptions.map((facility) => (
                <label
                  key={facility.id}
                  className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 bg-white/80 text-sm text-slate-700 cursor-pointer transition hover:border-brand-400 hover:text-brand-600"
                >
                  <input
                    type="checkbox"
                    className="text-brand-500 border-slate-300 rounded focus:ring-brand-400"
                    checked={searchData.facilities.includes(facility.id)}
                    onChange={() => handleFacilityToggle(facility.id)}
                  />
                  <span>
                    {facility.icon} {facility.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor={inputIds.sortBy}
                className="block mb-2 text-xs font-semibold tracking-[0.3em] uppercase text-slate-500"
              >
                Sort By
              </label>
              <select
                className={`${baseField} px-4`}
                id={inputIds.sortBy}
                value={searchData.sortBy}
                onChange={(e) => handleInputChange("sortBy", e.target.value)}
              >
                <option value="relevance">Relevance</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
                <option value="rating">Rating</option>
                <option value="distance">Distance</option>
              </select>
            </div>

            <div>
              <label
                htmlFor={inputIds.radius}
                className="block mb-2 text-xs font-semibold tracking-[0.3em] uppercase text-slate-500"
              >
                Search Radius (km)
              </label>
              <select
                className={`${baseField} px-4`}
                id={inputIds.radius}
                value={searchData.radius}
                onChange={(e) => handleInputChange("radius", e.target.value)}
              >
                <option value="10">10 km</option>
                <option value="25">25 km</option>
                <option value="50">50 km</option>
                <option value="100">100 km</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Quick Search Destinations */}
      <div className="pt-6 border-t border-slate-200/60">
        <h3 className="mb-3 text-xs font-semibold tracking-[0.3em] uppercase text-slate-500">
          Popular Destinations
        </h3>
        <div className="flex flex-wrap gap-2">
          {popularDestinations.map((destination) => (
            <button
              key={destination}
              onClick={() => handleQuickSearch(destination)}
              className="px-4 py-1.5 text-sm text-slate-700 transition-all rounded-full border border-slate-200 bg-white/90 hover:border-brand-400 hover:text-brand-600 hover:-translate-y-0.5"
            >
              {destination}
            </button>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;
