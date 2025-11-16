import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Mail, Lock, Eye, EyeOff, Sparkles, ShieldCheck, Compass } from "lucide-react";
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
import useAppContext from "../hooks/useAppContext";
import * as apiClient from "../api-client";
import { useMutationWithLoading } from "../hooks/useLoadingHooks";
import { authTheme } from "../styles/authTheme";

export type SignInFormData = {
  email: string;
  password: string;
};

const SignIn = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useAppContext();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>();

  const mutation = useMutationWithLoading(apiClient.signIn, {
    onSuccess: async () => {
      await queryClient.invalidateQueries("validateToken");
      showToast({
        title: "Welcome back",
        description: "You're in. Redirecting to curated stays...",
        type: "SUCCESS",
      });
      navigate("/");
    },
    onError: (error: Error) => {
      showToast({
        title: "Unable to sign in",
        description: error.message,
        type: "ERROR",
      });
    },
    loadingMessage: "Signing you in...",
  });

  const onSubmit = handleSubmit((data) => mutation.mutate(data));

  return (
    <div className={authTheme.pageBackground}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-24 w-[28rem] h-[28rem] bg-gradient-to-br from-brand-400/35 via-brand-500/20 to-transparent blur-[120px]" />
        <div className="absolute -bottom-32 -left-16 w-[24rem] h-[24rem] bg-gradient-to-br from-accentGlow/30 via-brand-300/10 to-transparent blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.05),transparent_40%)]" />
      </div>

      <div className="relative max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1.05fr_minmax(0,0.95fr)] items-center">
        <div className="hidden lg:flex flex-col gap-6 text-white/90">
          <div className="glass-panel rounded-[32px] p-8 border border-white/10 bg-white/5 backdrop-blur-2xl">
            <p className="text-sm uppercase tracking-[0.4em] text-white/60 mb-4">
              Phoenix Circle
            </p>
            <h2 className="text-4xl font-display leading-tight">
              Unlock itineraries curated for the way you travel
            </h2>
            <p className="text-white/80 mt-4 text-lg">
              Keep every stay, tasting, and wellness ritual synced across your profile. Priority upgrades and loyalty perks activate the moment you sign in.
            </p>
            <ul className="mt-6 space-y-3 text-white/80 text-sm">
              <li className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-accentGlow" />
                Sync reservations across devices and guests
              </li>
              <li className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-brand-400" />
                Access member-only residences & lounges
              </li>
              <li className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-white/80" />
                Chat with concierges directly from your itinerary
              </li>
            </ul>
          </div>
        </div>

        <div className="w-full">
          <div className={authTheme.cardWrapper}>
            <Card className={`${authTheme.card} border-white/5`}>
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-accentGlow" />
              <CardHeader className="text-center pb-8">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30">
                  <LogIn className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-semibold text-white mt-4">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-white/70 text-base">
                  Unlock your saved itineraries, member lounges, and curated alerts.
                </CardDescription>
                <div className="flex flex-wrap justify-center gap-3 mt-5">
                  <span className={authTheme.pill}>
                    <Sparkles className="w-4 h-4 text-accentGlow" /> Instant perks
                  </span>
                  <span className={authTheme.pill}>
                    <ShieldCheck className="w-4 h-4 text-brand-200" /> Secure checkout
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-7 pt-0">
                <div className="grid gap-3 text-sm text-white/70 sm:grid-cols-2">
                  <div className="flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-white/5">
                    <Compass className="w-4 h-4 text-brand-200" />
                    Track bespoke journeys
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-white/5">
                    <Plane className="w-4 h-4 text-brand-200" />
                    Sync lounge access & perks
                  </div>
                </div>
              <form className="space-y-6" onSubmit={onSubmit}>
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
                      placeholder="Enter your password"
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
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <Badge variant="outline" className={authTheme.errorBadge}>
                      <Sparkles className="w-4 h-4 mr-1" />
                      {errors.password.message}
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
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <LogIn className="w-5 h-5 mr-2" />
                      Sign In
                    </div>
                  )}
                </Button>

                <div className="relative text-center">
                  <Separator className={authTheme.separator} />
                  <span className={authTheme.separatorLabel}>or</span>
                </div>

                <div className="text-center">
                  <p className="text-sm text-white/70">
                    Don't have an account?{" "}
                    <Link to="/register" className={authTheme.link}>
                      Create one here
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-white/60">
            By signing in, you agree to our{" "}
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

export default SignIn;
