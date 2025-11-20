import { FC } from "react";

const spotlightCard = {
  heroImage:
    "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?auto=format&fit=crop&w=1600&q=80",
  locationLabel: "Marrakech skyline",
  location: "Marrakech, Morocco",
  description: "Private riad with desert rituals",
  price: "$340 / night",
  featured: {
    title: "Maison Cyan",
    destination: "Santorini",
    rate: "$520 / night",
  },
};

const MemberSpotlightCard: FC = () => {
  return (
    <article className="relative flex min-h-[320px] w-full flex-col justify-end overflow-hidden rounded-[42px] border border-white/8 bg-night-800 p-8 text-white shadow-[0_40px_140px_rgba(3,2,20,0.65)]">
      <img
        src={spotlightCard.heroImage}
        alt={spotlightCard.locationLabel}
        className="absolute inset-0 h-full w-full object-cover object-center brightness-[1.1] contrast-[1.1]"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(140,161,255,0.2),_transparent_65%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#040619]/90 via-[#040619]/40 to-transparent" />

      <div className="relative z-10 space-y-3">
        <span className="text-xs uppercase tracking-[0.38em] text-white/60">
          {spotlightCard.locationLabel}
        </span>
        <h3 className="text-3xl font-semibold tracking-tight">
          {spotlightCard.location}
        </h3>
        <p className="text-white/70">{spotlightCard.description}</p>
        <p className="text-xl font-semibold text-[#FF9B5C]">
          {spotlightCard.price}
        </p>
      </div>

      <div className="absolute right-4 top-4 z-10 rounded-[26px] border border-white/15 bg-black/50 px-5 py-4 text-right text-white/90 backdrop-blur-xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/60">
          Member Spotlight
        </p>
        <p className="mt-2 text-lg font-semibold text-white">
          {spotlightCard.featured.title}
        </p>
        <p className="text-sm text-[#FF8FA2]">
          {spotlightCard.featured.destination}
        </p>
        <p className="mt-2 text-sm text-white/75">
          {spotlightCard.featured.rate}
        </p>
      </div>
    </article>
  );
};

export default MemberSpotlightCard;
