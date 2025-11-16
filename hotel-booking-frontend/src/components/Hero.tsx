import {
  ArrowRight,
  Compass,
  Plane,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
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
  return (
    <section className="relative overflow-hidden bg-night-900 text-white">
      <div className="absolute inset-0 aurora-veil opacity-60 animate-aurora" />
      <div className="absolute inset-0 bg-gradient-to-br from-night-900/70 via-night-800/40 to-night-900" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_minmax(0,0.95fr)] items-center">
          {/* Copy */}
          <div className="space-y-8">
            <div className="inline-flex items-center border border-white/10 rounded-full px-4 py-1.5 text-sm uppercase tracking-wide text-white/80">
              <Sparkles className="w-4 h-4 mr-2 text-accentGlow" />
              Bespoke stays crafted for dreamers
            </div>

            <div className="space-y-4">
              <p className="text-white/70 text-lg font-semibold">Phoenix Booking</p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display leading-tight">
                Design-led hotels curated
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accentGlow via-brand-400 to-white">
                  for the way you wander
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-white/80 max-w-2xl">
                Glide through inspired stays, chef-led tasting menus, and skyline spas. We pair refined aesthetics with seamless technology so every booking feels like a concierge upgrade.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-white/80">
              <span className="glass-panel px-4 py-2 rounded-full flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-300" />
                Flexible cancellation on 90% of homes
              </span>
              <span className="glass-panel px-4 py-2 rounded-full flex items-center gap-2">
                <Plane className="w-4 h-4 text-brand-300" />
                Jetsetter perks unlocked instantly
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {heroStats.map((stat) => (
                <div key={stat.label} className="glass-panel rounded-2xl p-4">
                  <p className="text-2xl font-semibold text-white">{stat.value}</p>
                  <p className="text-sm text-white/70">{stat.label}</p>
                  <p className="text-xs text-white/50 mt-1">{stat.detail}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button className="inline-flex items-center px-6 py-3 rounded-full bg-white text-night-900 font-semibold shadow-glow hover:-translate-y-0.5 transition-transform">
                Plan a curated escape
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
              <button className="inline-flex items-center px-5 py-3 rounded-full border border-white/20 text-white/90 hover:border-white/50 transition-colors">
                <Waves className="w-4 h-4 mr-2" />
                Explore coastal villas
              </button>
            </div>
          </div>

          {/* Visual */}
          <div className="relative h-full">
            <div className="relative h-[420px] rounded-[36px] overflow-hidden shadow-glow">
              <img
                src={floatingDestinations[0].image}
                alt={`${floatingDestinations[0].city} skyline`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-night-900/70 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6">
                <p className="text-white font-semibold text-xl">
                  {floatingDestinations[0].city}, {floatingDestinations[0].country}
                </p>
                <p className="text-white/80 text-sm">Private riad with desert rituals</p>
                <p className="text-accentGlow font-semibold mt-2">
                  {floatingDestinations[0].price}
                </p>
              </div>
            </div>

            <div className="absolute -bottom-10 -left-6 glass-panel p-4 rounded-3xl w-64 shadow-large animate-float">
              <Compass className="w-5 h-5 text-brand-300" />
              <p className="mt-3 text-white font-semibold">Sunset tasting flight</p>
              <p className="text-white/70 text-sm">Four-course pairing over the Medina</p>
              <div className="mt-4 flex items-center justify-between text-sm text-white/80">
                <span>Tonight</span>
                <span>7:45 PM</span>
              </div>
            </div>

            <div className="absolute -top-8 right-0 glass-panel p-4 rounded-3xl w-56 shadow-large animate-float [animation-delay:1s]">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Member spotlight</p>
              <p className="text-white text-lg font-semibold mt-1">Maison Cyan</p>
              <p className="text-accentGlow text-sm">Santorini</p>
              <p className="text-white/80 text-sm mt-2">{floatingDestinations[1].price}</p>
            </div>
          </div>
        </div>

        <div className="mt-14">
          <div className="glass-panel rounded-[32px] p-4 sm:p-6">
            <AdvancedSearch onSearch={onSearch} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
