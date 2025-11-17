import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Compass,
  Plane,
  Headphones,
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

  const assuranceCards = [
    {
      title: "Journey sync",
      description: "Saved itineraries + loyalty IDs stay in lockstep across every device.",
      icon: Compass,
    },
    {
      title: "Member lounges",
      description: "Priority check-in and late checkout windows auto-apply on arrival.",
      icon: Plane,
    },
    {
      title: "Concierge thread",
      description: "Chat with curators 24/7 for upgrades, drivers, or wellness holds.",
      icon: Headphones,
    },
  ];

  return (
    <div className={authTheme.pageBackground}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-24 w-[28rem] h-[28rem] bg-gradient-to-br from-brand-400/35 via-brand-500/20 to-transparent blur-[120px]" />
        <div className="absolute -bottom-32 -left-16 w-[24rem] h-[24rem] bg-gradient-to-br from-accentGlow/30 via-brand-300/10 to-transparent blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.05),transparent_40%)]" />
      </div>

      <div className="relative max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1.05fr_minmax(0,0.95fr)] items-center">
        <div className="hidden lg:flex flex-col gap-6 text-white/90">
          <div className="glass-panel rounded-[32px] p-8 border border-white/15 bg-white/5 backdrop-blur-3xl">
            <p className="text-xs uppercase tracking-[0.6em] text-white/50 mb-3">
              Members Lounge
            </p>
            <h2 className="text-4xl font-display leading-tight">
              Sign in once, keep every stay, tasting, and spa hold in sync
            </h2>
            <p className="text-white/75 mt-4 text-base">
              Your Phoenix ID keeps private chauffeurs, curated residences, and concierge chats threaded together. Return guests see upgrades unlocked automatically.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[0.65rem] uppercase tracking-[0.4em] text-white/50">Guest score</p>
                <p className="text-3xl font-semibold mt-1">4.8/5</p>
                <p className="text-xs text-white/60">Avg. service rating once signed in</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[0.65rem] uppercase tracking-[0.4em] text-white/50">Instant perks</p>
                <p className="text-3xl font-semibold mt-1">+16</p>
                <p className="text-xs text-white/60">Exclusive lounges + curated stays</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className={authTheme.cardWrapper}>
            <Card className={`${authTheme.card} border-white/5`}>
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-accentGlow" />
              <CardHeader className="text-center pb-8">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF8F70] via-[#F86EB6] to-[#6C63FF] flex items-center justify-center shadow-lg shadow-[#1b1039]/60">
                  <LogIn className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-semibold text-white mt-4">
                  Welcome Back
                  <span className="block text-base font-normal text-white/60 mt-2">
                    Continue curating your journeys in two taps.
                  </span>
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
                <div className="grid gap-3 text-sm text-white/75 sm:grid-cols-3">
                  {assuranceCards.map(({ title, description, icon: Icon }) => (
                    <div
                      key={title}
                      className="p-3 rounded-2xl border border-white/10 bg-white/5 h-full"
                    >
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
                        <Icon className="w-4 h-4 text-white/80" />
                        {title}
                      </div>
                      <p className="text-white mt-2 text-sm leading-snug">{description}</p>
                    </div>
                  ))}
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

                  <div className="text-center space-y-2">
                    <p className="text-sm text-white/70">
                      Don't have an account?{" "}
                      <Link to="/register" className={authTheme.link}>
                        Create one here
                      </Link>
                    </p>
                    <Link to="/" className="text-xs text-white/50 hover:text-white">
                      Return to search
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

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
