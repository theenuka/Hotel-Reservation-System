import { useId } from "react";
import { cn } from "../lib/utils";

type BrandLogoProps = {
  onClick?: () => void;
  className?: string;
  showWordmark?: boolean;
};

const BrandLogo = ({ onClick, className = "", showWordmark = true }: BrandLogoProps) => {
  const gradientId = useId();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Phoenix Booking home"
      className={cn(
        "flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900",
        className
      )}
    >
      <div className="relative">
        <div className="size-12 sm:size-14 rounded-3xl border border-white/20 bg-night-900/60 shadow-glow flex items-center justify-center">
          <svg
            viewBox="0 0 64 64"
            className="w-9 h-9"
            role="presentation"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFB499" />
                <stop offset="50%" stopColor="#FF8C5F" />
                <stop offset="100%" stopColor="#4F82FF" />
              </linearGradient>
            </defs>
            <path
              d="M32 8c-1.5 5.8-5.4 8.8-8.8 11.8-7 6-11.2 13.5-11.2 20.8C12 50 20.5 56 32 56s20-6 20-15.4c0-7.3-4.2-14.8-11.2-20.8C37.4 16.8 33.5 13.8 32 8z"
              fill={`url(#${gradientId})`}
              opacity="0.85"
            />
            <path
              d="M32 16c-0.9 3.4-3.5 5.1-5.7 6.9-4.5 3.8-7.3 8.5-7.3 13.1C19 42.7 24.4 46 32 46s13-3.3 13-10  -2.8-9.3-7.3-13.1C35.5 21.1 32.9 19.4 32 16z"
              fill="none"
              stroke="#fff"
              strokeOpacity="0.5"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M26 34c1.2 2.4 3.3 3.8 6 3.8s4.8-1.4 6-3.8"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeOpacity="0.8"
            />
          </svg>
        </div>
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accentGlow/40 to-brand-500/40 blur-2xl opacity-0 group-hover:opacity-100 transition" />
      </div>
      {showWordmark && (
        <div className="text-left">
          <span className="text-[10px] uppercase tracking-[0.55em] text-white/50 block">
            Phoenix
          </span>
          <span className="text-2xl font-display leading-none text-white block">
            Booking
          </span>
        </div>
      )}
    </button>
  );
};

export default BrandLogo;
