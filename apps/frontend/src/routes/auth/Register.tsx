// app/components/login/login-register.tsx
"use client";

import React, { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import api from "@/lib/api";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Mail,
  ShieldCheck,
  Globe2,
  User2,
  Lock,
  Hash,
  Calendar,
} from "lucide-react";
import { isAxiosError } from "axios";

// Validation
const registerSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  name: z.string().min(2, "Enter full name"),
  age: z
    .string()
    .refine(
      (v) => !Number.isNaN(Number(v)) && Number(v) >= 13 && Number(v) <= 120,
      "Enter a valid age (13–120)"
    ),
  gender: z.enum(["male", "female", "other"]),
  country: z.string().optional().or(z.literal("")),
});

const verifySchema = z.object({
  email: z.string().email("Enter a valid email"),
  code: z.string().min(4, "Enter the code sent to email"),
});

type RegisterForm = z.infer<typeof registerSchema>;
type VerifyForm = z.infer<typeof verifySchema>;

export default function AuthRegister() {
  const [step, setStep] = useState<"register" | "verify" | "done">("register");
  const [loading, setLoading] = useState(false);

  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    email: "",
    password: "",
    name: "",
    age: "",
    gender: "other",
    country: "",
  });

  const [verifyForm, setVerifyForm] = useState<VerifyForm>({
    email: "",
    code: "",
  });

  type RegisterErrors = Partial<Record<keyof RegisterForm, string[]>>;
  type VerifyErrors = Partial<Record<keyof VerifyForm, string[]>>;

  const registerErrors = useMemo<RegisterErrors>(() => {
    const parsed = registerSchema.safeParse(registerForm);
    if (parsed.success) return {};
    const { fieldErrors } = parsed.error.flatten();
    return fieldErrors as RegisterErrors;
  }, [registerForm]);

  const verifyErrors = useMemo<VerifyErrors>(() => {
    const parsed = verifySchema.safeParse(verifyForm);
    if (parsed.success) return {};
    const { fieldErrors } = parsed.error.flatten();
    return fieldErrors as VerifyErrors;
  }, [verifyForm]);

  // Handlers
  const onRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterForm((s) => ({ ...s, [name]: value }));
  };

  const onVerifyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVerifyForm((s) => ({ ...s, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = registerSchema.safeParse(registerForm);
    if (!parsed.success) {
      toast.error("Please fix validation errors");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/auth/register", {
        email: registerForm.email,
        password: registerForm.password,
        name: registerForm.name,
        age: Number(registerForm.age),
        gender: registerForm.gender,
        country: registerForm.country || undefined,
      });
      if (res.status === 200) {
        toast.success("Verification code sent to email");
        setStep("verify");
        setVerifyForm({ email: registerForm.email, code: "" });
      } else {
        toast.error(res.data?.message || "Registration failed");
      }
    } catch (error: unknown) {
      let message = "Registration error";
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

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = verifySchema.safeParse(verifyForm);
    if (!parsed.success) {
      toast.error("Please fix validation errors");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/auth/verify", {
        email: verifyForm.email,
        code: verifyForm.code,
      });
      if (res.status === 200) {
        toast.success("User verified!");
        setStep("done");
      } else {
        toast.error(res.data?.message || "Verification failed");
      }
    } catch (error: unknown) {
      let message = "Verification error";
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

  // const handleFacebookLogin = () => {
  //   toast.info("Facebook login coming soon!");
  // };

  return (
    <div className="mx-auto w-full p-4 sm:max-w-2xl">
      <Card className="border-none shadow-lg ring-1 ring-border bg-white">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl tracking-tight">
            {step === "register" && "Create your account"}
            {step === "verify" && "Verify your email"}
            {step === "done" && "All set"}
          </CardTitle>
          <CardDescription>
            {step === "register" && "Join with a few details to get started."}
            {step === "verify" && "Enter the code sent to your inbox."}
            {step === "done" &&
              "Your account is verified. You can now sign in."}
          </CardDescription>
        </CardHeader>

        {step === "register" && (
          <form onSubmit={handleRegister} className="space-y-6">
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User2 className="h-4 w-4 text-muted-foreground" />
                    Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={registerForm.name}
                    onChange={onRegisterChange}
                    placeholder="Full name"
                    autoComplete="name"
                  />
                  {registerErrors.name && (
                    <p className="text-sm text-destructive">
                      {registerErrors.name[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Age
                  </Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    inputMode="numeric"
                    value={registerForm.age}
                    onChange={onRegisterChange}
                    placeholder="e.g. 24"
                  />
                  {registerErrors.age && (
                    <p className="text-sm text-destructive">
                      {registerErrors.age[0]}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={registerForm.email}
                  onChange={onRegisterChange}
                  placeholder="name@example.com"
                  autoComplete="email"
                />
                {registerErrors.email && (
                  <p className="text-sm text-destructive">
                    {registerErrors.email[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={registerForm.password}
                  onChange={onRegisterChange}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
                {registerErrors.password && (
                  <p className="text-sm text-destructive">
                    {registerErrors.password[0]}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    Gender
                  </Label>
                  <Select
                    value={registerForm.gender}
                    onValueChange={(v) =>
                      setRegisterForm((s) => ({
                        ...s,
                        gender: v as RegisterForm["gender"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {registerErrors.gender && (
                    <p className="text-sm text-destructive">
                      {registerErrors.gender[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-muted-foreground" />
                    Country
                  </Label>
                  <Input
                    id="country"
                    name="country"
                    value={registerForm.country}
                    onChange={onRegisterChange}
                    placeholder="Optional"
                    autoComplete="country-name"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-3 text-black">
                <Button
                  type="submit"
                  disabled={loading}
                  className="border cursor-pointer"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2 text-black">
                      <Loader2 className="h-4 w-4 animate-spin text-black" />
                      Creating account...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-">
                      <ShieldCheck className="h-4 w-4" />
                      Register
                    </span>
                  )}
                </Button>

                {/* <Button
                  type="button"
                  variant="secondary"
                  onClick={handleFacebookLogin}
                >
                  <span className="inline-flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Continue with Facebook
                  </span>
                </Button> */}
              </div>
            </CardContent>

            <CardFooter className="text-xs text-muted-foreground">
              By continuing, an email verification will be required.
            </CardFooter>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={handleVerify} className="space-y-6">
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="verify-email"
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="verify-email"
                  name="email"
                  type="email"
                  value={verifyForm.email}
                  onChange={onVerifyChange}
                  placeholder="name@example.com"
                  autoComplete="email"
                />
                {verifyErrors.email && (
                  <p className="text-sm text-destructive">
                    {verifyErrors.email[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="code" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  Verification code
                </Label>
                <Input
                  id="code"
                  name="code"
                  value={verifyForm.code}
                  onChange={onVerifyChange}
                  placeholder="Enter the 6‑digit code"
                  inputMode="numeric"
                  maxLength={10}
                />
                {verifyErrors.code && (
                  <p className="text-sm text-destructive">
                    {verifyErrors.code[0]}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  "Verify"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="text-xs"
                onClick={() => setStep("register")}
              >
                Back to registration
              </Button>
            </CardContent>
          </form>
        )}

        {step === "done" && (
          <CardContent className="py-10 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Account verified
            </div>
            <p className="mt-4 text-muted-foreground">
              You can now sign in to your account.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
