import { Phone, Mail, Globe } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Input } from "../../components/ui/input";
import { HotelFormData } from "./ManageHotelForm";

const ContactSection = () => {
  const { register } = useFormContext<HotelFormData>();

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg shadow-slate-900/5">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-400">
          05 · Contact
        </p>
        <h2 className="text-3xl font-semibold text-slate-900">Guest support touchpoints</h2>
        <p className="text-base text-slate-500">
          These details appear on booking confirmations so travelers know how to reach you.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
          <span className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4 text-indigo-500" /> Phone
          </span>
          <Input
            type="text"
            placeholder="+44 20 1234 5678"
            className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 text-base"
            {...register("contact.phone")}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
          <span className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4 text-indigo-500" /> Email
          </span>
          <Input
            type="email"
            placeholder="hello@aurorastay.com"
            className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 text-base"
            {...register("contact.email")}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
          <span className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-indigo-500" /> Website
          </span>
          <Input
            type="url"
            placeholder="https://aurorastay.com"
            className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 text-base"
            {...register("contact.website")}
          />
        </label>
      </div>
    </section>
  );
};

export default ContactSection;
