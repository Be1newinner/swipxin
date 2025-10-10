import React, { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "sonner";
import api from "../lib/api";

function Auth() {
  const [step, setStep] = useState("register");
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    age: "",
    gender: "",
    country: "",
  });
  const [verify, setVerify] = useState({ email: "", code: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleVerifyChange = (e) => {
    setVerify({ ...verify, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: {
          email: form.email,
          password: form.password,
          name: form.name,
          age: Number(form.age),
          gender: form.gender,
          country: form.country,
        },
      });
      const data = await res.data();
      if (res.status === 200) {
        toast.success("Verification code sent to your email.");
        setStep("verify");
        setVerify({ email: form.email, code: "" });
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch {
      toast.error("Registration error");
    }
    setLoading(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/api/auth/verify", {
        email: verify.email,
        code: verify.code,
      });

      const data = res.data;

      if (res.status === 200) {
        toast.success("User verified!");
        setStep("done");
      } else {
        toast.error(data.message || "Verification failed");
      }
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Verification error";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Facebook login placeholder
  const handleFacebookLogin = () => {
    toast.info("Facebook login coming soon!");
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-gray-50 border border-gray-300 rounded shadow-lg">
      {step === "register" && (
        <form onSubmit={handleRegister} className="space-y-4">
          <h2 className="text-xl font-bold mb-2">Register</h2>
          <Input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <Input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <Input
            name="name"
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <Input
            name="age"
            type="number"
            placeholder="Age"
            value={form.age}
            onChange={handleChange}
            required
          />
          <Input
            name="gender"
            type="text"
            placeholder="Gender"
            value={form.gender}
            onChange={handleChange}
            required
          />
          <Input
            name="country"
            type="text"
            placeholder="Country (optional)"
            value={form.country}
            onChange={handleChange}
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </Button>
          <Button
            type="button"
            className="w-full bg-blue-600 text-white mt-2"
            onClick={handleFacebookLogin}
          >
            Login with Facebook
          </Button>
        </form>
      )}
      {step === "verify" && (
        <form onSubmit={handleVerify} className="space-y-4">
          <h2 className="text-xl font-bold mb-2">Verify Email</h2>
          <Input
            name="email"
            type="email"
            placeholder="Email"
            value={verify.email}
            onChange={handleVerifyChange}
            required
          />
          <Input
            name="code"
            type="text"
            placeholder="Verification Code"
            value={verify.code}
            onChange={handleVerifyChange}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify"}
          </Button>
        </form>
      )}
      {step === "done" && (
        <div className="text-green-600 font-bold text-center">
          User verified! You can now login.
        </div>
      )}
    </div>
  );
}

export default Auth;
