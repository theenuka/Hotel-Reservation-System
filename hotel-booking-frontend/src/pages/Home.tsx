import { useQuery } from "react-query";
import * as apiClient from "../api-client";
import LatestDestinationCard from "../components/LastestDestinationCard";
// import AdvancedSearch from "../components/AdvancedSearch";
import Hero from "../components/Hero";

const Home = () => {
  const { data: hotels } = useQuery("fetchQuery", () =>
    apiClient.fetchHotels()
  );

  const handleSearch = (searchData: any) => {
    console.log("Search initiated with:", searchData);
  };

  return (
    <>
      <Hero onSearch={handleSearch} />
      <div className="space-y-8">
        {/* Latest Destinations Section */}
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Latest Destinations
            </h2>
            <p className="text-gray-600">
              Most recent destinations added by our hosts
            </p>
          </div>

          {(!hotels || hotels.length === 0) ? (
            <div className="text-center text-gray-500 py-8">No hotels found yet. Add one from My Hotels or seed the database.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {hotels.map((hotel) => (
                <LatestDestinationCard key={hotel._id} hotel={hotel} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
