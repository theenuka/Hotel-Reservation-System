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
    const payload = {
      ...data,
      role: registerAsOwner ? "hotel_owner" : "user",
    };
    mutation.mutate(payload);
  });

  return (
    <div className="relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-night-900 via-night-900 to-[#050f28]">
      <div className="absolute inset-0 opacity-50">
        <div className="absolute -top-24 left-4 w-72 h-72 bg-gradient-to-br from-brand-400/40 to-accentGlow/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-br from-brand-700/30 to-night-700/60 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1.05fr_minmax(0,0.95fr)] items-center">
        <div className="hidden lg:flex glass-panel rounded-[32px] p-10 border border-white/10 flex-col gap-6 text-white/85">
          <p className="text-sm uppercase tracking-[0.4em] text-white/60">Host Collective</p>
          <h2 className="text-4xl font-display leading-tight">
            Claim your host profile and share spaces guests obsess over
          </h2>
          <p className="text-white/75">
            Whether you manage a mountainside ryokan or an architectural loft, Phoenix Booking gives you concierge tools, loyalty perks, and international reach.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-white/60">What you get</p>
              <ul className="mt-2 space-y-2 text-sm">
                <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-accentGlow" />Curated guest matching</li>
                <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-brand-300" />Integrated waitlists & perks</li>
                <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-white/80" />Real-time concierge chat</li>
              </ul>
            </div>
            <div>
              <p className="text-sm text-white/60">Launch checklist</p>
              <ul className="mt-2 space-y-2 text-sm">
                <li>Upload at least 6 editorial photos</li>
                <li>Set availability windows up to 18 months</li>
                <li>Optional: connect Stripe payouts</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="w-full">
          <Card className="relative overflow-hidden border border-white/5 bg-white text-night-900 rounded-[32px] shadow-[0_30px_80px_rgba(3,7,18,0.28)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accentGlow via-brand-500 to-brand-700" />
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 flex items-center justify-center shadow-lg">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-semibold text-night-900 mt-4">
                Join Phoenix Booking
              </CardTitle>
              <CardDescription className="text-slate-500">
                Create your account to start booking or hosting
              </CardDescription>
              {!import.meta.env.PROD && (
                <div className="mt-4 p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-left">
                  <p className="text-sm text-yellow-800">
                    <strong>Development Note:</strong> Authentication state persists between sessions. If you're seeing a logged-in state unexpectedly, use the "Clear Auth" button in the header.
                  </p>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6 pt-2">
              <form className="space-y-6" onSubmit={onSubmit}>
                <div className="flex items-start gap-3 p-4 rounded-2xl border border-brand-100 bg-brand-50/70 text-sm text-night-900">
                  <input
                    id="registerAsOwner"
                    type="checkbox"
                    className="mt-1 rounded border-brand-300 text-brand-600 focus:ring-brand-400"
                    checked={registerAsOwner}
                    onChange={(e) => setRegisterAsOwner(e.target.checked)}
                    aria-describedby="host-mode-caption"
                  />
                  <div>
                    <label
                      htmlFor="registerAsOwner"
                      className="font-semibold text-brand-700"
                    >
                      Enable host workspace
                    </label>
                    <p id="host-mode-caption" className="text-xs text-slate-600 mt-1">
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
                      <Label htmlFor={field.id} className="text-sm font-semibold text-slate-700">
                        {field.label}
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-slate-400" />
                        </div>
                        <Input
                          id={field.id}
                          type="text"
                          className="pl-10 pr-3 py-3 rounded-2xl border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-300"
                          placeholder={field.placeholder}
                          {...register(field.id as "firstName" | "lastName", {
                            required: `${field.label} is required`,
                          })}
                        />
                      </div>
                      {field.error && (
                        <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                          <Sparkles className="w-4 h-4 mr-1" />
                          {field.error}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      className="pl-10 pr-3 py-3 rounded-2xl border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-300"
                      placeholder="Enter your email"
                      {...register("email", { required: "Email is required" })}
                    />
                  </div>
                  {errors.email && (
                    <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                      <Sparkles className="w-4 h-4 mr-1" />
                      {errors.email.message}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                    Password
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="pl-10 pr-12 py-3 rounded-2xl border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-300"
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
                      className="absolute inset-y-0 right-0 pr-3 text-slate-400"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                  {errors.password && (
                    <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                      <Sparkles className="w-4 h-4 mr-1" />
                      {errors.password.message}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      className="pl-10 pr-12 py-3 rounded-2xl border-slate-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-300"
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
                      className="absolute inset-y-0 right-0 pr-3 text-slate-400"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                      <Sparkles className="w-4 h-4 mr-1" />
                      {errors.confirmPassword.message}
                    </Badge>
                  )}
                  {password && !errors.confirmPassword && watch("confirmPassword") === password && (
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Passwords match
                    </Badge>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={mutation.isLoading}
                  className="w-full py-3 rounded-2xl text-white font-semibold bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700 shadow-[0_15px_30px_rgba(32,56,97,0.35)] hover:translate-y-[-1px] transition-transform"
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
                  <Separator className="bg-slate-200" />
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 text-xs uppercase tracking-[0.3em] text-slate-400 bg-white">
                    or
                  </span>
                </div>

                <div className="text-center">
                  <p className="text-sm text-slate-600">
                    Already have an account?{" "}
                    <Link to="/sign-in" className="font-semibold text-brand-600 hover:text-brand-700">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-white/60">
            By creating an account, you agree to our{" "}
            <a href="#" className="text-brand-300 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-brand-300 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
