"use client";

import { signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-primary font-[var(--font-teko)] uppercase tracking-wide">
          BODY OS
        </h1>
        
        <div className="bg-card rounded-2xl shadow-lg p-8 border border-foreground/5 max-w-md">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-foreground/60 font-[var(--font-inter)] mb-2">
                Welcome back!
              </p>
              <p className="text-xl font-bold font-[var(--font-teko)] uppercase">
                {session?.user?.name || "User"}
              </p>
              <p className="text-sm text-foreground/60 font-[var(--font-inter)]">
                {session?.user?.email}
              </p>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-6 rounded-xl transition-all duration-200 font-[var(--font-inter)]"
            >
              Sign Out
            </button>

            <p className="text-xs text-foreground/40 font-[var(--font-inter)]">
              Click "Sign Out" to test the login flow
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
