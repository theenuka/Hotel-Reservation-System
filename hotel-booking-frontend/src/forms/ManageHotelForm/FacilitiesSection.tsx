import { Check } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { hotelFacilities } from "../../config/hotel-options-config";
import { HotelFormData } from "./ManageHotelForm";

const FacilitiesSection = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<HotelFormData>();

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg shadow-slate-900/5">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-400">
          03 · Amenities
        </p>
        <h2 className="text-3xl font-semibold text-slate-900">Amenities guests rave about</h2>
        <p className="text-base text-slate-500">
          Toggle as many as apply. Popular picks surface your stay in curated search collections.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hotelFacilities.map((facility) => (
          <label key={facility} className="block cursor-pointer">
            <input
              type="checkbox"
              value={facility}
              className="peer hidden"
              {...register("facilities", {
                validate: (facilities) => {
                  if (facilities && facilities.length > 0) {
                    return true;
                  }
                  return "At least one facility is required";
                },
              })}
            />
            <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-600 transition peer-checked:border-indigo-500 peer-checked:bg-indigo-50">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 bg-white text-transparent transition peer-checked:border-indigo-500 peer-checked:bg-indigo-600 peer-checked:text-white">
                <Check className="h-4 w-4" />
              </span>
              {facility}
            </span>
          </label>
        ))}
      </div>
      {errors.facilities && (
        <span className="mt-3 block text-sm font-semibold text-rose-500">
          {errors.facilities.message}
        </span>
      )}
    </section>
  );
};

export default FacilitiesSection;
