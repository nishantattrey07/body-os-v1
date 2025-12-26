"use client";

import { NutritionGrid } from "@/components/nutrition/NutritionGrid";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NutritionPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold font-heading uppercase tracking-tight">
            Nutrition Protocol
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <NutritionGrid />
      </div>
    </div>
  );
}
