import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from "lucide-react";
import BrandLogo from "./BrandLogo";

const socialLinks = [
  { id: "facebook", Icon: Facebook, href: "https://facebook.com/phoenix-booking" },
  { id: "twitter", Icon: Twitter, href: "https://twitter.com/phoenix-booking" },
  { id: "instagram", Icon: Instagram, href: "https://instagram.com/phoenix-booking" },
  { id: "linkedin", Icon: Linkedin, href: "https://linkedin.com/company/phoenix-booking" },
];

const Footer = () => {
  return (
    <footer className="mt-auto bg-ivory-dark border-t border-gray-200/80 text-charcoal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr_0.7fr]">
          <div className="space-y-5">
            <BrandLogo interactive={false} />
            <p className="text-charcoal-light max-w-lg">
              Boutique stays, crafted experiences, and a concierge-inspired platform. We pair intentional design with tech that anticipates what you need before wheels up.
            </p>
            <div className="flex gap-4">
              {socialLinks.map(({ id, Icon, href }) => (
                <a key={id} href={href} className="p-2 border border-charcoal/20 rounded-full hover:border-charcoal/50 hover:bg-white transition-colors" aria-label={id} target="_blank" rel="noreferrer">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm uppercase tracking-[0.3em] text-charcoal/60 mb-4">
              Stay inspired
            </h3>
            <form className="space-y-3">
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-navy/50"
              />
              <button type="submit" className="w-full rounded-lg bg-navy text-ivory font-semibold py-3 hover:bg-navy-light transition-colors">
                Join the travel letter
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm uppercase tracking-[0.3em] text-charcoal/60">
              Concierge desk
            </h3>
            <div className="space-y-3 text-charcoal-light">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-navy" />
                support@phoenixbooking.com
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-navy" />
                +1 (415) 555-0199
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-navy" />
                205 Mercer Street, NYC
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-charcoal/10 pt-6 flex flex-col lg:flex-row lg:items-center lg:justify-between text-sm text-charcoal/60 gap-4">
          <p>© {new Date().getFullYear()} Phoenix Booking. Crafted for modern travelers.</p>
          <div className="flex flex-wrap gap-4">
            <a href="#" className="hover:text-charcoal">Privacy</a>
            <a href="#" className="hover:text-charcoal">Terms</a>
            <a href="#" className="hover:text-charcoal">Cookies</a>
            <a href="#" className="hover:text-charcoal">Press</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
