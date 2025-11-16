import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { useMutationWithLoading } from "../hooks/useLoadingHooks";
import * as apiClient from "../api-client";
import useAppContext from "../hooks/useAppContext";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  UserPlus,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { authTheme } from "../styles/authTheme";

export type RegisterFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: "user" | "admin" | "hotel_owner";
};

const Register = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useAppContext();
  const [registerAsOwner, setRegisterAsOwner] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch("password");

  const mutation = useMutationWithLoading(apiClient.register, {
    onSuccess: async () => {
      await queryClient.invalidateQueries("validateToken");
      showToast({
        title: "Account created",
        description: registerAsOwner
          ? "Host toolkit unlocked. Let's curate your listing."
          : "Welcome to Phoenix Booking. Redirecting you home...",
        type: "SUCCESS",
      });
      navigate("/");
    },
    onError: (error: Error) => {
      showToast({
        title: "Registration failed",
        description: error.message,
        type: "ERROR",
      });
    },
    loadingMessage: "Creating your profile...",
  });

  const onSubmit = handleSubmit((data) => {
    const role: RegisterFormData["role"] = registerAsOwner
      ? "hotel_owner"
      : "user";
    const payload: RegisterFormData = {
      ...data,
      role,
    };
    mutation.mutate(payload);
  });

  const hostBoosters = [
    {
      title: "Profile ready",
      description: "Add story-driven copy, amenities, and concierge rules in one flow.",
    },
    {
      title: "Editorial imagery",
      description: "Upload 6+ hero shots, we auto-balance contrast + compress for mobile.",
    },
    {
      title: "Payout sync",
      description: "Connect Stripe once, manage deposits + holds from the Host Hub.",
    },
  ];

  return (
    <div className={authTheme.pageBackground}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-0 w-[22rem] h-[22rem] bg-gradient-to-br from-brand-400/30 via-brand-500/20 to-transparent blur-[120px]" />
        <div className="absolute bottom-[-4rem] right-0 w-[26rem] h-[26rem] bg-gradient-to-br from-accentGlow/25 via-brand-400/10 to-transparent blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.06),transparent_45%)]" />
      </div>

      <div className="relative max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1.05fr_minmax(0,0.95fr)] items-center">
        <div className="hidden lg:flex glass-panel rounded-[32px] p-10 border border-white/15 flex-col gap-6 text-white/85 bg-white/5 backdrop-blur-3xl">
          <p className="text-xs uppercase tracking-[0.6em] text-white/50">Host Collective</p>
          <h2 className="text-4xl font-display leading-tight">
            Share architectural stays, wellness retreats, or favorite lofts with a global waitlist
          </h2>
          <p className="text-white/75">
            Phoenix Booking pairs boutique hosts with the right guests, handles concierge chat, and keeps payouts aligned across time zones.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[0.65rem] uppercase tracking-[0.4em] text-white/50">Avg. occupancy</p>
              <p className="text-3xl font-semibold mt-1">89%</p>
              <p className="text-xs text-white/60">For hosts who complete onboarding</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[0.65rem] uppercase tracking-[0.4em] text-white/50">Launch time</p>
              <p className="text-3xl font-semibold mt-1">48 hrs</p>
              <p className="text-xs text-white/60">Average listing approval window</p>
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className={authTheme.cardWrapper}>
            <Card className={`${authTheme.card} border-white/5`}>
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accentGlow via-brand-500 to-brand-600" />
              <CardHeader className="text-center pb-8">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30">
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-semibold text-white mt-4">
                  Join Phoenix Booking
                  <span className="block text-base font-normal text-white/60 mt-2">
                    Build your traveler profile or open the Host Hub in minutes.
                  </span>
                </CardTitle>
                <CardDescription className="text-white/70 text-base">
                  Create your profile, unlock curated bookings, or launch a boutique stay.
                </CardDescription>
                <div className="flex flex-wrap justify-center gap-3 mt-5">
                  <span className={authTheme.pill}>
                    <Sparkles className="w-4 h-4 text-accentGlow" /> Curated guests
                  </span>
                  <span className={authTheme.pill}>
                    <CheckCircle className="w-4 h-4 text-brand-200" /> Instant payouts
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-7 pt-0">
                <div className="grid gap-3 text-sm text-white/75 sm:grid-cols-3">
                  {hostBoosters.map((card, idx) => (
                    <div key={card.title} className="p-3 rounded-2xl border border-white/10 bg-white/5">
                      <p className="text-xs tracking-[0.3em] uppercase text-white/45">Step 0{idx + 1}</p>
                      <p className="text-white mt-1 font-semibold">{card.title}</p>
                      <p className="text-white/70 text-xs mt-1 leading-snug">{card.description}</p>
                    </div>
                  ))}
                </div>

                <form className="space-y-6" onSubmit={onSubmit}>
                <div className="flex items-start gap-3 p-4 rounded-2xl border border-white/15 bg-white/5 text-sm text-white/80">
                  <input
                    id="registerAsOwner"
                    type="checkbox"
                    className="mt-1 size-4 rounded border-white/30 bg-transparent text-brand-200 focus:ring-brand-300/60"
                    checked={registerAsOwner}
                    onChange={(e) => setRegisterAsOwner(e.target.checked)}
                    aria-describedby="host-mode-caption"
                  />
                  <div>
                    <label
                      htmlFor="registerAsOwner"
                      className="font-semibold text-white"
                    >
                      Enable host workspace
                    </label>
                    <p id="host-mode-caption" className={`${authTheme.helper} mt-1`}>
                      Toggle this to unlock the Host Hub, hotel onboarding, and real-time earnings dashboards. Leave unchecked if you only plan to book stays.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[{
                    id: "firstName",
                    label: "First Name",
                    placeholder: "Enter first name",
                    error: errors.firstName?.message,
                  }, {
                    id: "lastName",
                    label: "Last Name",
                    placeholder: "Enter last name",
                    error: errors.lastName?.message,
                  }].map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id} className={authTheme.label}>
                        {field.label}
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-white/50" />
                        </div>
                        <Input
                          id={field.id}
                          type="text"
                          className={`${authTheme.input} pl-10 pr-3`}
                          placeholder={field.placeholder}
                          {...register(field.id as "firstName" | "lastName", {
                            required: `${field.label} is required`,
                          })}
                        />
                      </div>
                      {field.error && (
                        <Badge variant="outline" className={authTheme.errorBadge}>
                          <Sparkles className="w-4 h-4 mr-1" />
                          {field.error}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className={authTheme.label}>
                    Email Address
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-white/50" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      className={`${authTheme.input} pl-10 pr-3`}
                      placeholder="Enter your email"
                      {...register("email", { required: "Email is required" })}
                    />
                  </div>
                  {errors.email && (
                    <Badge variant="outline" className={authTheme.errorBadge}>
                      <Sparkles className="w-4 h-4 mr-1" />
                      {errors.email.message}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className={authTheme.label}>
                    Password
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-white/50" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className={`${authTheme.input} pl-10 pr-12`}
                      placeholder="Create a password"
                      {...register("password", {
                        required: "Password is required",
                        minLength: {
                          value: 6,
                          message: "Password must be at least 6 characters",
                        },
                      })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 pr-3 text-white/60"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                  {errors.password && (
                    <Badge variant="outline" className={authTheme.errorBadge}>
                      <Sparkles className="w-4 h-4 mr-1" />
                      {errors.password.message}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className={authTheme.label}>
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-white/50" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      className={`${authTheme.input} pl-10 pr-12`}
                      placeholder="Confirm your password"
                      {...register("confirmPassword", {
                        validate: (val) => {
                          if (!val) {
                            return "Please confirm your password";
                          } else if (password !== val) {
                            return "Passwords do not match";
                          }
                        },
                      })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 pr-3 text-white/60"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <Badge variant="outline" className={authTheme.errorBadge}>
                      <Sparkles className="w-4 h-4 mr-1" />
                      {errors.confirmPassword.message}
                    </Badge>
                  )}
                  {password && !errors.confirmPassword && watch("confirmPassword") === password && (
                    <Badge variant="outline" className={authTheme.successBadge}>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Passwords match
                    </Badge>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={mutation.isLoading}
                  className={authTheme.primaryButton}
                >
                  {mutation.isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Creating account...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <UserPlus className="w-5 h-5 mr-2" />
                      Create Account
                    </div>
                  )}
                </Button>

                <div className="relative text-center">
                  <Separator className={authTheme.separator} />
                  <span className={authTheme.separatorLabel}>or</span>
                </div>

                <div className="text-center">
                  <p className="text-sm text-white/70">
                    Already have an account?{" "}
                    <Link to="/sign-in" className={authTheme.link}>
                      Sign in here
                    </Link>
                  </p>
                </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <p className="mt-6 text-center text-xs text-white/60">
            By creating an account, you agree to our{" "}
            <a href="#" className="text-brand-200 hover:text-white">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-brand-200 hover:text-white">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
