import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Mail, Lock, Eye, EyeOff, Sparkles } from "lucide-react";
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
    <div className="relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-night-900 via-night-900 to-[#0a0f24]">
      <div className="absolute inset-0 opacity-50">
        <div className="absolute -top-32 -right-20 w-80 h-80 bg-gradient-to-br from-brand-400/40 to-accentGlow/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-10 w-72 h-72 bg-gradient-to-br from-brand-600/30 to-night-700/60 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1.05fr_minmax(0,0.95fr)] items-center">
        <div className="hidden lg:flex flex-col gap-6 text-white/90">
          <div className="glass-panel rounded-[32px] p-8 border border-white/10">
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
          <Card className="relative overflow-hidden border border-white/5 bg-white text-night-900 rounded-[32px] shadow-[0_30px_80px_rgba(3,7,18,0.28)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400 via-brand-600 to-accentGlow" />
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 flex items-center justify-center shadow-lg">
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-semibold text-night-900 mt-4">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-slate-500">
                Sign in to your account to continue
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
                      className="absolute inset-y-0 right-0 pr-3 text-slate-400"
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
                    <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                      <Sparkles className="w-4 h-4 mr-1" />
                      {errors.password.message}
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
                  <Separator className="bg-slate-200" />
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 text-xs uppercase tracking-[0.3em] text-slate-400 bg-white">
                    or
                  </span>
                </div>

                <div className="text-center">
                  <p className="text-sm text-slate-600">
                    Don't have an account?{" "}
                    <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
                      Create one here
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-white/60">
            By signing in, you agree to our{" "}
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

export default SignIn;
