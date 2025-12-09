import {
  ArrowRight,
  Compass,
  Plane,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdvancedSearch from "./AdvancedSearch";

const heroStats = [
  { label: "Handpicked escapes", value: "650+", detail: "Design-forward stays" },
  { label: "Cities curated", value: "48", detail: "Across 5 continents" },
  { label: "Avg. rating", value: "4.9/5", detail: "From verified guests" },
];

const floatingDestinations = [
  {
    city: "Marrakech",
    country: "Morocco",
    price: "$340 / night",
    image:
      "https://images.unsplash.com/photo-1501117716987-c8e1ecb210cc?auto=format&fit=crop&w=1200&q=80",
  },
  {
    city: "Santorini",
    country: "Greece",
    price: "$520 / night",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  },
];

const Hero = ({ onSearch }: { onSearch: (searchData: any) => void }) => {
  const navigate = useNavigate();

  const handlePrimaryCta = () => navigate("/search");
  const handleSecondaryCta = () => navigate("/search?hotelType=Resort");

  return (
    <section id="hero" className="relative overflow-hidden bg-ivory text-charcoal">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Copy */}
          <div className="space-y-8">
            <div className="inline-flex items-center border border-charcoal/20 rounded-full px-4 py-1.5 text-sm uppercase tracking-wide text-charcoal-light">
              <Sparkles className="w-4 h-4 mr-2 text-gold" />
              Bespoke stays crafted for dreamers
            </div>

            <div className="space-y-4">
              <p className="text-charcoal-light text-lg font-semibold font-sans">Phoenix Booking</p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display leading-tight text-navy">
                Design-led hotels curated
                <span className="block">
                  for the way you wander
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-charcoal-light max-w-2xl">
                Glide through inspired stays, chef-led tasting menus, and skyline spas. We pair refined aesthetics with seamless technology so every booking feels like a concierge upgrade.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-charcoal-light">
              <span className="bg-ivory-dark/50 px-4 py-2 rounded-full flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-navy" />
                Flexible cancellation on 90% of homes
              </span>
              <span className="bg-ivory-dark/50 px-4 py-2 rounded-full flex items-center gap-2">
                <Plane className="w-4 h-4 text-navy" />
                Jetsetter perks unlocked instantly
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {heroStats.map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
                  <p className="text-2xl font-semibold text-navy">{stat.value}</p>
                  <p className="text-sm text-charcoal-light">{stat.label}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.detail}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={handlePrimaryCta}
                className="inline-flex items-center px-6 py-3 rounded-full bg-navy text-ivory font-semibold shadow-lg hover:-translate-y-0.5 transition-transform"
              >
                Plan a curated escape
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
              <button
                onClick={handleSecondaryCta}
                className="inline-flex items-center px-5 py-3 rounded-full border border-navy/50 text-navy hover:border-navy/80 hover:bg-navy/5 transition-colors"
              >
                <Waves className="w-4 h-4 mr-2" />
                Explore coastal villas
              </button>
            </div>
          </div>

          {/* Visual */}
          <div className="relative h-full">
            <div className="relative h-[420px] rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={floatingDestinations[0].image}
                alt={`${floatingDestinations[0].city} skyline`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6">
                <p className="text-white font-semibold text-xl">
                  {floatingDestinations[0].city}, {floatingDestinations[0].country}
                </p>
                <p className="text-gray-200 text-sm">Private riad with desert rituals</p>
                <p className="text-gold font-semibold mt-2">
                  {floatingDestinations[0].price}
                </p>
              </div>
            </div>

            <div className="absolute -bottom-10 -left-6 bg-white p-4 rounded-2xl w-64 shadow-xl border border-gray-100 animate-float">
              <Compass className="w-5 h-5 text-navy" />
              <p className="mt-3 text-charcoal font-semibold">Sunset tasting flight</p>
              <p className="text-charcoal-light text-sm">Four-course pairing over the Medina</p>
              <div className="mt-4 flex items-center justify-between text-sm text-charcoal-light">
                <span>Tonight</span>
                <span>7:45 PM</span>
              </div>
            </div>

            <div className="absolute -top-8 right-0 bg-white p-3 rounded-2xl w-64 shadow-xl border border-gray-100 animate-float [animation-delay:1s]">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Member spotlight</p>
              <div className="flex items-center gap-3">
                <img src={floatingDestinations[1].image} alt="Santorini" className="w-16 h-16 object-cover rounded-xl"/>
                <div>
                  <p className="text-charcoal font-semibold">Maison Cyan</p>
                  <p className="text-gold-dark text-sm">Santorini</p>
                  <p className="text-charcoal-light text-sm mt-1">{floatingDestinations[1].price}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
            <AdvancedSearch onSearch={onSearch} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
