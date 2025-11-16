import { useId } from "react";
import { cn } from "../lib/utils";

type BrandLogoProps = {
  onClick?: () => void;
  className?: string;
  showWordmark?: boolean;
};

const BrandLogo = ({ onClick, className = "", showWordmark = true }: BrandLogoProps) => {
  const dropletGradientId = useId();
  const haloGradientId = useId();

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
        <div className="size-12 sm:size-14 rounded-3xl border border-white/20 bg-night-900/70 shadow-[0_15px_40px_rgba(5,7,17,0.55)] flex items-center justify-center">
          <svg
            viewBox="0 0 64 64"
            className="w-9 h-9"
            role="presentation"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={dropletGradientId} x1="0%" y1="10%" x2="100%" y2="90%">
                <stop offset="0%" stopColor="#FF9E6E" />
                <stop offset="35%" stopColor="#FF6D86" />
                <stop offset="70%" stopColor="#C266FF" />
                <stop offset="100%" stopColor="#6C63FF" />
              </linearGradient>
              <radialGradient id={haloGradientId} cx="50%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#FFF4EB" stopOpacity="0.9" />
                <stop offset="55%" stopColor="#FDC6AF" stopOpacity="0.2" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="28" fill={`url(#${haloGradientId})`} opacity="0.35" />
            <path
              d="M32 8c-6.5 8.8-13 17.8-13 27.2C19 46.2 24.7 56 32 56s13-9.8 13-20.8C45 25.8 38.5 16.8 32 8z"
              fill={`url(#${dropletGradientId})`}
              stroke="white"
              strokeWidth="0.5"
              strokeOpacity="0.4"
            />
            <path
              d="M32 20c-3.5 4.6-7 9.1-7 13.7 0 5.5 3.2 9.7 7 9.7s7-4.3 7-9.7C39 29.1 35.5 24.6 32 20z"
              fill="#fff"
              opacity="0.25"
            />
            <path
              d="M27 34c0.8 2.4 2.9 4 5 4s4.2-1.6 5-4"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeOpacity="0.8"
            />
            <circle cx="27.5" cy="25" r="3" fill="#fff" opacity="0.45" />
          </svg>
        </div>
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#FF8F70]/60 via-[#F86EB6]/40 to-[#6C63FF]/45 blur-2xl opacity-0 group-hover:opacity-100 transition" />
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
