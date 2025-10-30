// app/components/login/login-login.tsx
"use client";

import React, { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";

// shadcn/ui
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Mail, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { isAxiosError } from "axios";

// Validation schema
const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;
type LoginErrors = Partial<Record<keyof LoginForm, string[]>>;

export default function AuthLogin() {
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState<LoginForm>({
    email: "jane@example.com",
    password: "password123",
    remember: true,
  });
  const login = useAppStore((s) => s.login);

  const navigate = useNavigate();

  const errors = useMemo<LoginErrors>(() => {
    const parsed = loginSchema.safeParse(form);
    if (parsed.success) return {};
    const { fieldErrors } = parsed.error.flatten();
    return fieldErrors as LoginErrors;
  }, [form]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm((s) => ({
      ...s,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const onToggleRemember = (checked: boolean) => {
    setForm((s) => ({ ...s, remember: checked }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      toast.error("Please fix validation errors");
      return;
    }

    setLoading(true);
    try {
      await login(form);
      const dest = "/";
      navigate(dest, { replace: true });
    } catch (error: unknown) {
      let message = "Login error";
      if (isAxiosError<{ message?: string }>(error)) {
        message = error.response?.data?.message ?? error.message ?? message;
      } else if (error instanceof Error) {
        message = error.message ?? message;
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full p-4 sm:max-w-md">
      <Card className="border-none shadow-lg ring-1 ring-border bg-white">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl tracking-tight">
            Welcome back
          </CardTitle>
          <CardDescription>
            Sign in to continue to the dashboard.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin} className="space-y-6">
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 " />
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="name@example.com"
                autoComplete="email"
                style={{
                  background: "white",
                }}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4 " />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={onChange}
                  placeholder="Your password"
                  autoComplete="current-password"
                  style={{
                    background: "white",
                  }}
                />
                <button
                  type="button"
                  aria-label={showPass ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-2 flex items-center px-1  hover:text-foreground"
                  onClick={() => setShowPass((s) => !s)}
                >
                  {showPass ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password[0]}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  id="remember"
                  checked={!!form.remember}
                  onCheckedChange={(c) => onToggleRemember(Boolean(c))}
                />
                <span>Remember me</span>
              </label>
              <a
                href="/forgot-password"
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </a>
            </div>

            <Separator />

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-200 border border-slate-300 hover:bg-slate-100 cursor-pointer"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign in
                </span>
              )}
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 text-xs ">
            <p>
              By signing in, you agree to the Terms and acknowledge the Privacy
              Policy.
            </p>
            <p>
              New here?{" "}
              <a
                href="/register"
                className="text-primary underline-offset-4 hover:underline"
              >
                Create an account
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
