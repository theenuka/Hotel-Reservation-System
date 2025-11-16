import { Clock, Ban, PawPrint, CigaretteOff } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { HotelFormData } from "./ManageHotelForm";

const PoliciesSection = () => {
  const { register } = useFormContext<HotelFormData>();

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg shadow-slate-900/5">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-400">
          06 · Policies
        </p>
        <h2 className="text-3xl font-semibold text-slate-900">Stay guidelines</h2>
        <p className="text-base text-slate-500">
          Clear policies help guests feel confident booking and reduce support follow-up.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
          <span className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-indigo-500" /> Check-in time
          </span>
          <Input
            type="text"
            placeholder="3:00 PM"
            className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 text-base"
            {...register("policies.checkInTime")}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
          <span className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-indigo-500" /> Check-out time
          </span>
          <Input
            type="text"
            placeholder="11:00 AM"
            className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 text-base"
            {...register("policies.checkOutTime")}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
          <span className="flex items-center gap-2 text-base">
            <Ban className="h-4 w-4 text-indigo-500" /> Cancellation policy
          </span>
          <Textarea
            rows={3}
            placeholder="Free cancellation up to 7 days before arrival..."
            className="rounded-2xl border-slate-200 bg-slate-50/80 text-base"
            {...register("policies.cancellationPolicy")}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
          <span className="flex items-center gap-2 text-base">
            <PawPrint className="h-4 w-4 text-indigo-500" /> Pet policy
          </span>
          <Textarea
            rows={3}
            placeholder="Small pets welcome with a €25 cleaning fee..."
            className="rounded-2xl border-slate-200 bg-slate-50/80 text-base"
            {...register("policies.petPolicy")}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
          <span className="flex items-center gap-2 text-base">
            <CigaretteOff className="h-4 w-4 text-indigo-500" /> Smoking policy
          </span>
          <Textarea
            rows={3}
            placeholder="All indoor areas are smoke-free..."
            className="rounded-2xl border-slate-200 bg-slate-50/80 text-base"
            {...register("policies.smokingPolicy")}
          />
        </label>
      </div>
    </section>
  );
};

export default PoliciesSection;
