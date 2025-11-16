import {
  Building2,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="mt-auto bg-night-900 border-t border-white/5 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr_0.7fr]">
          <div className="space-y-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-2xl bg-white/10 border border-white/10">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                  Phoenix
                </p>
                <p className="text-2xl font-display">Booking</p>
              </div>
            </div>
            <p className="text-white/70 max-w-lg">
              Boutique stays, crafted experiences, and a concierge-inspired platform. We pair intentional design with tech that anticipates what you need before wheels up.
            </p>
            <div className="flex gap-4">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon) => (
                <a key={Icon.name} href="#" className="p-2 border border-white/10 rounded-full hover:border-white/50 transition-colors" aria-label={Icon.name}>
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm uppercase tracking-[0.3em] text-white/60 mb-4">
              Stay inspired
            </h3>
            <form className="space-y-3">
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 focus:outline-none focus:border-white/40"
              />
              <button type="submit" className="w-full rounded-2xl bg-white text-night-900 font-semibold py-3">
                Join the travel letter
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm uppercase tracking-[0.3em] text-white/60">
              Concierge desk
            </h3>
            <div className="space-y-3 text-white/70">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-accentGlow" />
                support@phoenixbooking.com
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-accentGlow" />
                +1 (415) 555-0199
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-accentGlow" />
                205 Mercer Street, NYC
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col lg:flex-row lg:items-center lg:justify-between text-sm text-white/60 gap-4">
          <p>© {new Date().getFullYear()} Phoenix Booking. Crafted for modern travelers.</p>
          <div className="flex flex-wrap gap-4">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Cookies</a>
            <a href="#">Press</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
