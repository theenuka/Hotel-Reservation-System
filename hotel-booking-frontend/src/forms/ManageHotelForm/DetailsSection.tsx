import { useFormContext } from "react-hook-form";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { HotelFormData } from "./ManageHotelForm";

const DetailsSection = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<HotelFormData>();

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg shadow-slate-900/5">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-400">
          01 · Essentials
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">
          Tell guests about your property
        </h2>
        <p className="mt-3 text-base text-slate-500">
          This is the first impression guests see across search results and recommendation cards.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        <div>
          <Label className="text-sm font-semibold text-slate-700">Property name</Label>
          <Input
            type="text"
            placeholder="Aurora Boutique Suites"
            className="mt-2 h-12 rounded-xl border-slate-200 bg-slate-50/80 text-base text-slate-900"
            {...register("name", { required: "This field is required" })}
          />
          {errors.name && (
            <span className="mt-1 block text-sm font-medium text-rose-500">
              {errors.name.message}
            </span>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Label className="text-sm font-semibold text-slate-700">City</Label>
            <Input
              type="text"
              placeholder="Lisbon"
              className="mt-2 h-12 rounded-xl border-slate-200 bg-slate-50/80 text-base"
              {...register("city", { required: "This field is required" })}
            />
            {errors.city && (
              <span className="mt-1 block text-sm font-medium text-rose-500">
                {errors.city.message}
              </span>
            )}
          </div>
          <div>
            <Label className="text-sm font-semibold text-slate-700">Country</Label>
            <Input
              type="text"
              placeholder="Portugal"
              className="mt-2 h-12 rounded-xl border-slate-200 bg-slate-50/80 text-base"
              {...register("country", { required: "This field is required" })}
            />
            {errors.country && (
              <span className="mt-1 block text-sm font-medium text-rose-500">
                {errors.country.message}
              </span>
            )}
          </div>
        </div>

        <div>
          <Label className="text-sm font-semibold text-slate-700">Story & highlights</Label>
          <Textarea
            rows={6}
            placeholder="Share what makes this stay unforgettable..."
            className="mt-2 rounded-2xl border-slate-200 bg-slate-50/80 text-base leading-relaxed"
            {...register("description", { required: "This field is required" })}
          />
          {errors.description && (
            <span className="mt-1 block text-sm font-medium text-rose-500">
              {errors.description.message}
            </span>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Label className="text-sm font-semibold text-slate-700">Price per night</Label>
            <Input
              type="number"
              min={1}
              placeholder="180"
              className="mt-2 h-12 rounded-xl border-slate-200 bg-slate-50/80 text-base"
              {...register("pricePerNight", { required: "This field is required" })}
            />
            {errors.pricePerNight && (
              <span className="mt-1 block text-sm font-medium text-rose-500">
                {errors.pricePerNight.message}
              </span>
            )}
          </div>
          <div>
            <Label className="text-sm font-semibold text-slate-700">Star rating</Label>
            <select
              {...register("starRating", {
                required: "This field is required",
              })}
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a rating</option>
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num} star{num > 1 ? "s" : ""}
                </option>
              ))}
            </select>
            {errors.starRating && (
              <span className="mt-1 block text-sm font-medium text-rose-500">
                {errors.starRating.message}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DetailsSection;
