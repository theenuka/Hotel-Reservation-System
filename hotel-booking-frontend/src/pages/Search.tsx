import { useQuery } from "react-query";
import { useLocation } from "react-router-dom";
import * as apiClient from "../api-client";
import { useState, useEffect } from "react";
import SearchResultsCard from "../components/SearchResultsCard";
import Pagination from "../components/Pagination";
import StarRatingFilter from "../components/StarRatingFilter";
import HotelTypesFilter from "../components/HotelTypesFilter";
import FacilitiesFilter from "../components/FacilitiesFilter";
import PriceFilter from "../components/PriceFilter";
import { SlidersHorizontal } from "lucide-react";
import useSearchContext from "../hooks/useSearchContext";

const Search = () => {
  const location = useLocation();
  const search = useSearchContext();
  
  const [page, setPage] = useState<number>(1);
  const [selectedStars, setSelectedStars] = useState<string[]>([]);
  const [selectedHotelTypes, setSelectedHotelTypes] = useState<string[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>();
  const [sortOption, setSortOption] = useState<string>("");

  const queryParams = new URLSearchParams(location.search);
  const destination = queryParams.get("destination") || search.destination || "";

  // Effect to update context if destination from URL is different
  useEffect(() => {
    if (destination && destination !== search.destination) {
      search.saveSearchValues(destination, search.checkIn, search.checkOut, search.adultCount, search.childCount);
    }
  }, [destination, search]);
  
  const searchParams: apiClient.SearchParams = {
    destination: queryParams.get("destination") || "",
    checkIn: queryParams.get("checkIn") || "",
    checkOut: queryParams.get("checkOut") || "",
    adultCount: queryParams.get("adultCount") || "1",
    childCount: queryParams.get("childCount") || "0",
    page: page.toString(),
    stars: selectedStars,
    types: selectedHotelTypes,
    facilities: selectedFacilities,
    maxPrice: selectedPrice?.toString(),
    sortOption,
  };

  const { data: hotelData } = useQuery(["searchHotels", searchParams], () =>
    apiClient.searchHotels(searchParams)
  );

  const handleStarsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const starRating = event.target.value;
    setSelectedStars((prevStars) =>
      event.target.checked
        ? [...prevStars, starRating]
        : prevStars.filter((star) => star !== starRating)
    );
  };

  const handleHotelTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className="bg-dark text-light-gray">
      <div className="container mx-auto py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          <aside className="rounded-xl border border-white/10 bg-dark/50 p-5 h-fit lg:sticky lg:top-24 backdrop-blur-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10 mb-4">
              <div className="p-2 rounded-lg bg-neon-pink/10">
                <SlidersHorizontal className="w-5 h-5 text-neon-pink" />
              </div>
              <div>
                <p className="text-lg font-display font-semibold text-white">Filter Results</p>
              </div>
            </div>
            <div className="space-y-5">
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

          <main className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-display text-white">
                {destination ? `${destination}` : "All Stays"}
                <span className="block text-sm font-normal text-medium-gray mt-1">
                  {hotelData?.pagination.total} Hotels found
                </span>
              </h1>
              <select
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value)}
                className="p-2 border rounded-md bg-dark/50 border-white/20"
              >
                <option value="">Sort By</option>
                <option value="starRating">Star Rating</option>
                <option value="pricePerNightAsc">Price (low to high)</option>
                <option value="pricePerNightDesc">Price (high to low)</option>
              </select>
            </div>
            {hotelData?.data.map((hotel) => (
              <SearchResultsCard key={hotel._id} hotel={hotel} />
            ))}
            <div>
              <Pagination
                page={hotelData?.pagination.page || 1}
                pages={hotelData?.pagination.pages || 1}
                onPageChange={(page) => setPage(page)}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Search;
