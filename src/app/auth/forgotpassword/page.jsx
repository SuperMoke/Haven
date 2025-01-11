"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../../firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { AnimatedSection } from "@/app/components/AnimatedSection";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset email sent! Check your inbox.");
      setEmail("");
    } catch (error) {
      setError(
        error.code === "auth/user-not-found"
          ? "No account found with this email"
          : "An error occurred. Please try again."
      );
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 hero-gradient">
      <AnimatedSection>
        <Card className="w-[400px] border-2 border-[#fdb040]/20">
          <CardHeader>
            <h2 className="text-3xl font-bold text-center text-[#fdb040]">
              Reset Password
            </h2>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}
              {success && (
                <div className="text-green-500 text-sm text-center">
                  {success}
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="text-gray-700">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="transition-all duration-300 focus:border-[#fdb040] hover:border-[#fdb040]/50"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#fdb040] hover:bg-[#fdb040]/90 text-white transition-all duration-300"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
              <p className="text-sm text-center text-gray-600">
                Remember your password?{" "}
                <Link
                  href="/auth/login"
                  className="text-[#fdb040] hover:text-[#fdb040]/80 hover:underline transition-colors"
                >
                  Login here
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </AnimatedSection>
    </div>
  );
}
