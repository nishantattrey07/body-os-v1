"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface ActionCardProps {
  label: string;
  sublabel?: string;
  icon: LucideIcon;
  color: string; // Tailwind text color class, e.g. "text-orange-500"
  bgColor?: string; // Optional background tint
  href: string; // Use Link for prefetching!
  className?: string;
  variant?: "square" | "wide";
}

export function ActionCard({
  label,
  sublabel,
  icon: Icon,
  color,
  bgColor = "bg-white/80",
  href,
  className,
  variant = "square"
}: ActionCardProps) {
  // Extract base color for icon background
  const iconBgColor = color.includes("orange") 
    ? "bg-gradient-to-br from-orange-100 to-amber-50" 
    : color.includes("blue") 
    ? "bg-gradient-to-br from-blue-100 to-cyan-50"
    : "bg-gradient-to-br from-zinc-100 to-zinc-50";

  return (
    <Link href={href} className="block">
      <motion.div
        whileHover={{ scale: 1.03, y: -4 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "relative overflow-hidden rounded-3xl p-6 text-left transition-all border backdrop-blur-sm",
          "shadow-lg hover:shadow-xl",
          "border-white/60",
          bgColor,
          className
        )}
      >
        {/* Premium glow effect on hover */}
        <motion.div 
          className={cn(
            "absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500",
            color.replace("text-", "bg-")
          )}
          whileHover={{ opacity: 0.3 }}
        />
        
        <div className="flex flex-col h-full justify-between relative z-10">
          <motion.div 
            className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm",
              iconBgColor
            )}
            whileHover={{ rotate: 5, scale: 1.05 }}
          >
            <Icon className={cn("h-6 w-6", color)} strokeWidth={2.5} />
          </motion.div>
          
          <div>
            <h3 className="font-heading text-2xl font-bold uppercase tracking-wide text-zinc-900 leading-none">
              {label}
            </h3>
            {sublabel && (
              <p className="font-sans text-xs font-semibold text-zinc-400 mt-1.5 tracking-wider uppercase">
                {sublabel}
              </p>
            )}
          </div>
        </div>

        {/* Decorative gradient corner */}
        <div className={cn(
          "absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl opacity-15",
          color.replace("text-", "bg-")
        )} />
        
        {/* Subtle shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
        
        {/* Wide variant arrow indicator */}
        {variant === "wide" && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <motion.div 
              className={cn("w-8 h-8 rounded-full flex items-center justify-center", iconBgColor)}
              whileHover={{ x: 5 }}
            >
              <span className={cn("text-lg", color)}>→</span>
            </motion.div>
          </div>
        )}
      </motion.div>
    </Link>
  );
}
