"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterFormValues } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAuthRedirectUrl } from "@/lib/auth/urls";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            username: data.username,
          },
          emailRedirectTo: getAuthRedirectUrl("/auth/callback"),
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Registration successful! Please check your email for verification.");
      router.push("/auth/login");
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <Link href="/" className="flex flex-col items-center group">
            <div className="relative h-20 w-20 rounded-full overflow-hidden border-4 border-upsa-gold/20 shadow-lg transition-transform group-hover:scale-105 mb-3">
              <Image
                src="/logo.jpg"
                alt="Voice of UPSA"
                fill sizes="120px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black tracking-widest text-upsa-gold uppercase leading-none">Voice of</span>
              <span className="text-2xl font-black tracking-tight text-upsa-navy uppercase leading-tight">UPSA</span>
            </div>
          </Link>
          <h2 className="mt-6 text-3xl font-black text-upsa-navy tracking-tight">
            Join the Community
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Create an account to stay updated with UPSA news
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                {...register("fullName")}
                className={errors.fullName ? "border-red-500" : ""}
              />
              {errors.fullName && (
                <p className="text-xs text-red-500 font-medium">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="johndoe"
                {...register("username")}
                className={errors.username ? "border-red-500" : ""}
              />
              {errors.username && (
                <p className="text-xs text-red-500 font-medium">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className={errors.password ? "border-red-500" : ""}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-upsa-navy"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy py-6 text-lg font-bold transition-all"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : (
                <>
                  Register
                  <UserPlus className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="text-center pt-2">
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-bold text-upsa-gold hover:underline">
              Sign in instead
              <ArrowRight className="inline-block ml-1 h-4 w-4" />
            </Link>
          </p>
        </div>
      </div>
      
      <div className="mt-8 text-center text-xs text-gray-400">
        <p>© 2025 Voice of UPSA. Official Communications Hub.</p>
      </div>
    </div>
  );
}
