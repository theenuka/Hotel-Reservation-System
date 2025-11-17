import useSearchContext from "../hooks/useSearchContext";
import { useQueryWithLoading } from "../hooks/useLoadingHooks";
import * as apiClient from "../api-client";
import { useState } from "react";
import SearchResultsCard from "../components/SearchResultsCard";
import Pagination from "../components/Pagination";
import StarRatingFilter from "../components/StarRatingFilter";
import HotelTypesFilter from "../components/HotelTypesFilter";
import FacilitiesFilter from "../components/FacilitiesFilter";
import PriceFilter from "../components/PriceFilter";
import SearchBar from "../components/SearchBar";
import { Sparkles, SlidersHorizontal } from "lucide-react";

const Search = () => {
  const search = useSearchContext();
  const [page, setPage] = useState<number>(1);
  const [selectedStars, setSelectedStars] = useState<string[]>([]);
  const [selectedHotelTypes, setSelectedHotelTypes] = useState<string[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>();
  const [sortOption, setSortOption] = useState<string>("");

  const searchParams = {
    destination: search.destination?.trim() || "",
    checkIn: search.checkIn.toISOString(),
    checkOut: search.checkOut.toISOString(),
    adultCount: search.adultCount.toString(),
    childCount: search.childCount.toString(),
    page: page.toString(),
    stars: selectedStars,
    types: selectedHotelTypes,
    facilities: selectedFacilities,
    maxPrice: selectedPrice?.toString(),
    sortOption,
  };

  const { data: hotelData } = useQueryWithLoading(
    ["searchHotels", searchParams],
    () => apiClient.searchHotels(searchParams),
    {
      loadingMessage: "Searching for perfect hotels...",
    }
  );

  const handleStarsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const starRating = event.target.value;

    setSelectedStars((prevStars) =>
      event.target.checked
        ? [...prevStars, starRating]
        : prevStars.filter((star) => star !== starRating)
    );
  };

  const handleHotelTypeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const hotelType = event.target.value;

    setSelectedHotelTypes((prevHotelTypes) =>
      event.target.checked
        ? [...prevHotelTypes, hotelType]
        : prevHotelTypes.filter((hotel) => hotel !== hotelType)
    );
  };

  const handleFacilityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const facility = event.target.value;

    setSelectedFacilities((prevFacilities) =>
      event.target.checked
        ? [...prevFacilities, facility]
        : prevFacilities.filter((prevFacility) => prevFacility !== facility)
    );
  };

  return (
    <div className="relative min-h-screen py-10 sm:py-12 lg:py-16 overflow-hidden">
      <div className="absolute inset-0 bg-night-900" />
      <div className="absolute -top-40 right-0 w-[32rem] h-[32rem] bg-brand-500/20 blur-[160px]" />
      <div className="absolute bottom-0 left-0 w-[28rem] h-[28rem] bg-accentGlow/15 blur-[140px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Search Module */}
        <section className="glass-panel rounded-[32px] border border-white/10 p-6 md:p-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/50 mb-2">
                Phoenix Collection
              </p>
              <h1 className="text-3xl md:text-4xl font-display text-white">
                Tailor tonight&apos;s escape
              </h1>
              <p className="text-white/70 mt-2 max-w-2xl">
                Refine the city, dates, and party size – the platform syncs
                live availability across our partners in real time.
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-3 text-sm text-white/70">
              <Sparkles className="w-5 h-5 text-accentGlow" />
              <span>
                {hotelData?.pagination.total ?? "All"} curated stays ready to
                book
              </span>
            </div>
          </div>

          <div className="mt-6">
            <SearchBar />
          </div>
        </section>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 lg:gap-8">
          <aside className="glass-panel rounded-[32px] border border-white/10 p-6 lg:sticky lg:top-8 h-fit order-2 lg:order-1 text-white">
            <div className="flex items-center gap-2 pb-4 border-b border-white/10 mb-4">
              <div className="p-2 rounded-2xl bg-white/5">
                <SlidersHorizontal className="w-4 h-4 text-accentGlow" />
              </div>
              <div>
                <p className="text-sm text-white/60">Refine</p>
                <p className="text-lg font-semibold">Your stay</p>
              </div>
            </div>
            <div className="space-y-6">
              <StarRatingFilter
                selectedStars={selectedStars}
                onChange={handleStarsChange}
              />
              <HotelTypesFilter
                selectedHotelTypes={selectedHotelTypes}
                onChange={handleHotelTypeChange}
              />
              <FacilitiesFilter
                selectedFacilities={selectedFacilities}
                onChange={handleFacilityChange}
              />
              <PriceFilter
                selectedPrice={selectedPrice}
                onChange={(value?: number) => setSelectedPrice(value)}
              />
            </div>
          </aside>

          <section className="flex flex-col gap-5 order-1 lg:order-2 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/50">
                  Results
                </p>
                <h2 className="text-2xl font-bold text-white">
                  {hotelData?.pagination.total || 0} stays
                  {search.destination ? ` in ${search.destination}` : ""}
                </h2>
                <p className="text-white/60 text-sm">
                  Updated live with current availability
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-white/60">Sort</label>
                <select
                  value={sortOption}
                  onChange={(event) => setSortOption(event.target.value)}
                  aria-label="Sort results"
                  className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  <option value="" className="text-night-900">
                    Featured
                  </option>
                  <option value="starRating" className="text-night-900">
                    Star Rating
                  </option>
                  <option value="pricePerNightAsc" className="text-night-900">
                    Price (low to high)
                  </option>
                  <option value="pricePerNightDesc" className="text-night-900">
                    Price (high to low)
                  </option>
                </select>
              </div>
            </div>

            {hotelData?.data.length === 0 ? (
              <div className="glass-panel rounded-[28px] border border-white/10 text-center py-16 px-6">
                <div className="text-white/50 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-2">No stays match</h3>
                <p className="text-white/70 max-w-2xl mx-auto">
                  {search.destination ? (
                    <>
                      We couldn&apos;t find any hotels in <span className="font-medium">{search.destination}</span>
                      {selectedStars.length > 0 && (
                        <>
                          {" "}with {selectedStars.length === 1 ? "a" : ""}{" "}
                          {selectedStars.join(", ")} star rating
                        </>
                      )}
                      {selectedPrice && <> under ${selectedPrice} per night</>}.
                    </>
                  ) : (
                    <>
                      We couldn&apos;t find any hotels matching your filters
                      {selectedStars.length > 0 && (
                        <>
                          {" "}with {selectedStars.length === 1 ? "a" : ""}{" "}
                          {selectedStars.join(", ")} star rating
                        </>
                      )}
                      {selectedPrice && <> under ${selectedPrice} per night</>}.
                    </>
                  )}
                </p>
                <div className="mt-8 space-y-3 text-sm text-white/60">
                  <p>Try widening your dates, guest count, or filters.</p>
                  {selectedStars.length > 0 ||
                  selectedHotelTypes.length > 0 ||
                  selectedFacilities.length > 0 ||
                  selectedPrice ? (
                    <button
                      onClick={() => {
                        setSelectedStars([]);
                        setSelectedHotelTypes([]);
                        setSelectedFacilities([]);
                        setSelectedPrice(undefined);
                        setSortOption("");
                      }}
                      className="text-brand-300 hover:text-brand-200 font-semibold"
                    >
                      Clear all filters
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <>
                {hotelData?.data.map(
                  (hotel: import("../../../shared/types").HotelType) => (
                    <SearchResultsCard key={hotel._id} hotel={hotel} />
                  )
                )}
                <div className="mt-4">
                  <Pagination
                    page={hotelData?.pagination.page || 1}
                    pages={hotelData?.pagination.pages || 1}
                    onPageChange={(page) => setPage(page)}
                  />
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Search;
