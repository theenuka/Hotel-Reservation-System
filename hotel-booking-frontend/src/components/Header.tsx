import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import useSearchContext from "../hooks/useSearchContext";
import { Calendar, LogIn, LogOut, Bell, User, Settings, Award, ChevronDown, Sparkles, ClipboardList } from "lucide-react";
import BrandLogo from "./BrandLogo";
import { useAuthContext } from "@asgardeo/auth-react";
import useAppContext from "../hooks/useAppContext";
import * as apiClient from "../api-client";

const Header = () => {
  const { signIn, signOut, state } = useAuthContext();
  const { isLoggedIn, userRoles } = useAppContext();
  const canManage = userRoles.some((role) => role === "hotel_owner" || role === "admin");
  const isStaff = userRoles.some((role) => role === "staff" || role === "admin" || role === "hotel_owner");

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<apiClient.Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  const search = useSearchContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch notifications when logged in
  useEffect(() => {
    if (isLoggedIn) {
      apiClient.getNotifications()
        .then(setNotifications)
        .catch(() => setNotifications([]));
      apiClient.getUnreadNotificationCount()
        .then((data) => setUnreadCount(data.count))
        .catch(() => setUnreadCount(0));
    }
  }, [isLoggedIn]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
        setNotificationDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await apiClient.markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Silent fail
    }
  };

  const userName = state?.displayName || state?.username || "User";

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

  const handleHostClick = () => {
    if (isLoggedIn && canManage) {
      navigate("/add-hotel");
    } else {
      signIn();
    }
  };

  const hostCtaLabel = isLoggedIn && canManage ? "List your stay" : "Become a host";

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
              {isLoggedIn && canManage && (
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
              {isLoggedIn && isStaff && (
                <Link
                  className="px-4 py-2 transition-colors rounded-full hover:bg-white/10 hover:text-white"
                  to="/staff-dashboard"
                >
                  Staff
                </Link>
              )}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  {/* Notifications Bell */}
                  <div className="relative" ref={notificationDropdownRef}>
                    <button
                      onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                      className="relative p-2 transition-colors rounded-full hover:bg-white/10 text-white/80 hover:text-white"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute flex items-center justify-center w-5 h-5 text-xs text-white bg-red-500 rounded-full -top-1 -right-1">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>

                    {notificationDropdownOpen && (
                      <div className="absolute right-0 z-50 mt-2 overflow-hidden border shadow-2xl w-80 bg-night-800 border-white/10 rounded-xl">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                          <h3 className="font-semibold text-white">Notifications</h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="text-xs text-brand-400 hover:text-brand-300"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="overflow-y-auto max-h-80">
                          {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-400">
                              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p>No notifications yet</p>
                            </div>
                          ) : (
                            notifications.slice(0, 5).map((notification) => (
                              <div
                                key={notification._id}
                                className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 cursor-pointer ${
                                  !notification.read ? "bg-brand-500/10" : ""
                                }`}
                                onClick={() => {
                                  if (notification.link) {
                                    navigate(notification.link);
                                  }
                                  setNotificationDropdownOpen(false);
                                }}
                              >
                                <p className="text-sm font-medium text-white">{notification.title}</p>
                                <p className="mt-1 text-xs text-gray-400">{notification.message}</p>
                                <p className="mt-1 text-xs text-gray-500">
                                  {new Date(notification.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                        {notifications.length > 5 && (
                          <Link
                            to="/profile?tab=notifications"
                            className="block px-4 py-3 text-sm text-center border-t text-brand-400 hover:bg-white/5 border-white/10"
                            onClick={() => setNotificationDropdownOpen(false)}
                          >
                            View all notifications
                          </Link>
                        )}
                      </div>
                    )}
                  </div>

                  <Link
                    to="/my-bookings"
                    className="items-center hidden px-4 py-2 text-sm border rounded-full sm:inline-flex border-white/20 text-white/80 hover:border-white/60"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Trips
                  </Link>
                  
                  {/* Profile Dropdown */}
                  <div className="relative" ref={profileDropdownRef}>
                    <button
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-[#0B1424] text-white font-medium hover:border-white/35 transition"
                    >
                      <div className="flex items-center justify-center text-sm font-bold rounded-full w-7 h-7 bg-brand-500">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="hidden truncate sm:inline max-w-24">{userName}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {profileDropdownOpen && (
                      <div className="absolute right-0 z-50 w-56 mt-2 overflow-hidden border shadow-2xl bg-night-800 border-white/10 rounded-xl">
                        <div className="px-4 py-3 border-b border-white/10">
                          <p className="font-semibold text-white truncate">{userName}</p>
                          <p className="text-xs text-gray-400 truncate">{state?.email}</p>
                        </div>
                        <div className="py-2">
                          <Link
                            to="/profile"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <User className="w-4 h-4" />
                            My Profile
                          </Link>
                          <Link
                            to="/my-bookings"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <Calendar className="w-4 h-4" />
                            My Bookings
                          </Link>
                          <Link
                            to="/my-facility-bookings"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <Sparkles className="w-4 h-4" />
                            Facility Bookings
                          </Link>
                          <Link
                            to="/profile?tab=loyalty"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <Award className="w-4 h-4" />
                            Loyalty Program
                          </Link>
                          {isStaff && (
                            <Link
                              to="/staff-dashboard"
                              className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                              onClick={() => setProfileDropdownOpen(false)}
                            >
                              <ClipboardList className="w-4 h-4" />
                              Staff Dashboard
                            </Link>
                          )}
                          <Link
                            to="/profile?tab=notifications"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <Settings className="w-4 h-4" />
                            Settings
                          </Link>
                        </div>
                        <div className="py-2 border-t border-white/10">
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              signOut();
                            }}
                            className="flex items-center w-full gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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