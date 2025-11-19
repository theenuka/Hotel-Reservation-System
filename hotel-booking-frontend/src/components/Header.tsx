import { Link, useLocation, useNavigate } from "react-router-dom";
import useSearchContext from "../hooks/useSearchContext";
import { Calendar, LogIn, LogOut } from "lucide-react";
import BrandLogo from "./BrandLogo";
// 1. Import Asgardeo Hook
import { useAuthContext } from "@asgardeo/auth-react";

const Header = () => {
  // 2. Get Auth State from Asgardeo
  const { state, signIn, signOut } = useAuthContext();
  const isLoggedIn = state.isAuthenticated;

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

  // If not logged in, "Become a host" triggers the login popup
  const handleHostClick = () => {
      if (isLoggedIn) {
          navigate("/add-hotel");
      } else {
          signIn();
      }
  };
  
  const hostCtaLabel = isLoggedIn ? "List your stay" : "Become a host";

  const handleLogoClick = () => {
    search.clearSearchValues();
    navigate("/");
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-night-900/85 backdrop-blur-xl border-white/10">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <BrandLogo onClick={handleLogoClick} className="shrink-0" />

            {/* Navigation */}
            <nav className="items-center hidden space-x-1 md:flex text-white/80">
              {navItems.map((item) =>
                item.type === "route" ? (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="px-4 py-2 transition-colors rounded-full hover:bg-white/10 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => scrollToSection(item.target)}
                    className="px-4 py-2 transition-colors rounded-full hover:bg-white/10 hover:text-white"
                  >
                    {item.label}
                  </button>
                )
              )}
              {isLoggedIn && (
                <>
                  <Link
                    className="px-4 py-2 transition-colors rounded-full hover:bg-white/10 hover:text-white"
                    to="/analytics"
                  >
                    Insights
                  </Link>
                  <Link
                    className="px-4 py-2 transition-colors rounded-full hover:bg-white/10 hover:text-white"
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
                    className="items-center hidden px-4 py-2 text-sm border rounded-full sm:inline-flex border-white/20 text-white/80 hover:border-white/60"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Trips
                  </Link>
                  
                  {/* Sign Out Button (Asgardeo) */}
                  <button 
                    onClick={() => signOut()}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/15 bg-[#0B1424] text-white font-semibold shadow-[0_18px_30px_rgba(1,3,10,0.65)] hover:border-white/35 hover:-translate-y-0.5 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleHostClick}
                    className="items-center hidden gap-2 px-4 py-2 text-sm border rounded-full sm:inline-flex border-white/20 text-white/80 hover:border-white/60"
                  >
                    {hostCtaLabel}
                  </button>
                  
                  {/* Sign In Button (Asgardeo) */}
                  <button
                    onClick={() => signIn()}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/15 bg-[#0B1424] text-white font-semibold shadow-[0_18px_30px_rgba(1,3,10,0.65)] hover:border-white/35 hover:-translate-y-0.5 transition"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button aria-label="Open menu" className="p-2 text-white border rounded-2xl border-white/15">
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