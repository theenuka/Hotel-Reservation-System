import { Link, useLocation, useNavigate } from "react-router-dom";
import useAppContext from "../hooks/useAppContext";
import useSearchContext from "../hooks/useSearchContext";
import SignOutButton from "./SignOutButton";
import { Calendar, LogIn } from "lucide-react";
import BrandLogo from "./BrandLogo";

const Header = () => {
  const { isLoggedIn } = useAppContext();
  const search = useSearchContext();
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (sectionId: string) => {
    const attemptScroll = () => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    if (location.pathname !== "/") {
      navigate("/", { state: { section: sectionId } });
      return;
    }

    attemptScroll();
  };

  const navItems = [
    { label: "Home", type: "route" as const, href: "/" },
    { label: "Stays", type: "route" as const, href: "/search" },
    { label: "Collections", type: "section" as const, target: "collections" },
    { label: "Experiences", type: "section" as const, target: "experiences" },
    { label: "Stories", type: "section" as const, target: "testimonials" },
  ];

  const hostCtaHref = isLoggedIn ? "/add-hotel" : "/register";
  const hostCtaLabel = isLoggedIn ? "List your stay" : "Become a host";

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
            <BrandLogo onClick={handleLogoClick} className="shrink-0" />

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1 text-white/80">
              {navItems.map((item) =>
                item.type === "route" ? (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="px-4 py-2 rounded-full transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => scrollToSection(item.target)}
                    className="px-4 py-2 rounded-full transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {item.label}
                  </button>
                )
              )}
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
                <>
                  <Link
                    to={hostCtaHref}
                    className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-sm text-white/80 hover:border-white/60"
                  >
                    {hostCtaLabel}
                  </Link>
                  <Link
                    to="/sign-in"
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/15 bg-[#0B1424] text-white font-semibold shadow-[0_18px_30px_rgba(1,3,10,0.65)] hover:border-white/35 hover:-translate-y-0.5 transition"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Link>
                </>
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
