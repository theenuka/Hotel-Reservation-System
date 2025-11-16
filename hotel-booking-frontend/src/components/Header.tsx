import { Link, useNavigate } from "react-router-dom";
import useAppContext from "../hooks/useAppContext";
import useSearchContext from "../hooks/useSearchContext";
import SignOutButton from "./SignOutButton";
import { Building2, Calendar, LogIn } from "lucide-react";

const Header = () => {
  const { isLoggedIn } = useAppContext();
  const search = useSearchContext();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    // Clear search context when going to home page
    search.clearSearchValues();
    navigate("/");
  };

  return (
    <>
      {/* Development Banner */}
      {/* {!import.meta.env.PROD && (
        <div className="bg-yellow-500 text-black text-center py-1 text-xs font-medium">
          🚧 Development Mode - Auth state persists between sessions
        </div>
      )} */}
      <header className="sticky top-0 z-50 bg-night-900/85 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <button
              onClick={handleLogoClick}
              className="flex items-center space-x-3 group"
            >
              <div className="p-2 rounded-2xl bg-white/10 border border-white/10 group-hover:border-white/40 transition-colors">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <span className="text-lg uppercase tracking-[0.4em] text-white/60 block">
                  Phoenix
                </span>
                <span className="text-2xl font-display leading-none text-white">
                  Booking
                </span>
              </div>
            </button>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1 text-white/80">
              <Link
                className="px-4 py-2 rounded-full transition-colors hover:bg-white/10 hover:text-white"
                to="/search"
              >
                Discover
              </Link>
              <Link
                className="px-4 py-2 rounded-full transition-colors hover:bg-white/10 hover:text-white"
                to="/api-docs"
              >
                API Docs
              </Link>
              <Link
                className="px-4 py-2 rounded-full transition-colors hover:bg-white/10 hover:text-white"
                to="/api-status"
              >
                Status
              </Link>
              {isLoggedIn && (
                <>
                  <Link
                    className="px-4 py-2 rounded-full transition-colors hover:bg-white/10 hover:text-white"
                    to="/analytics"
                  >
                    Insights
                  </Link>
                  <Link
                    className="px-4 py-2 rounded-full transition-colors hover:bg-white/10 hover:text-white"
                    to="/my-hotels"
                  >
                    Host Hub
                  </Link>
                </>
              )}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  <Link
                    to="/my-bookings"
                    className="hidden sm:inline-flex items-center px-4 py-2 rounded-full border border-white/20 text-sm text-white/80 hover:border-white/60"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Trips
                  </Link>
                  <SignOutButton />
                </>
              ) : (
                <Link
                  to="/sign-in"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white text-night-900 font-semibold shadow-glow hover:-translate-y-0.5 transition-transform"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button aria-label="Open menu" className="text-white p-2 rounded-2xl border border-white/15">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
