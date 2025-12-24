"use client";

import { AnimatePresence, motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dashboard flex items-center justify-center px-4 relative overflow-hidden">
      {/* Simplified Background Gradient - Static, no animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-100/30 via-transparent to-amber-100/20" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand - Simple fade in */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-7xl md:text-8xl font-bold text-primary font-[var(--font-teko)] tracking-wide mb-2">
            BODY OS
          </h1>
          <p className="text-foreground/60 text-sm font-[var(--font-inter)]">
            Your personal workout companion
          </p>
        </motion.div>

        {/* Login Card - Simple entrance */}
        <motion.div
          className="glass-strong rounded-2xl shadow-2xl p-8 border border-white/20"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold font-[var(--font-teko)] uppercase tracking-wide">
                Welcome Back
              </h2>
              <p className="text-sm text-foreground/60 font-[var(--font-inter)]">
                Sign in to continue your fitness journey
              </p>
            </div>

            {/* Google Sign In Button */}
            <motion.button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full gradient-orange text-primary-foreground font-medium py-4 px-6 rounded-xl flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-[var(--font-inter)] relative overflow-hidden"
              whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <span>Signing in...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Continue with Google</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-foreground/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-foreground/40 font-[var(--font-inter)]">
                  Secure Sign In
                </span>
              </div>
            </div>

            {/* Footer Text */}
            <p className="text-xs text-center text-foreground/40 font-[var(--font-inter)] leading-relaxed">
              By continuing, you agree to our Terms of Service and Privacy
              Policy
            </p>
          </div>
        </motion.div>

        {/* Bottom Accent with subtle pulse */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="inline-flex items-center gap-2 text-xs text-foreground/40 font-[var(--font-inter)]">
            <motion.div
              className="w-2 h-2 bg-energy rounded-full"
              animate={{
                opacity: [1, 0.6, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <span>Track. Analyze. Optimize.</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
