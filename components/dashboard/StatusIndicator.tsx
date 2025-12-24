import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: "critical" | "fuel" | "hydrate" | "on-track" | "beast-mode";
  label: string;
}

export function StatusIndicator({ status, label }: StatusIndicatorProps) {
  const statusConfig = {
    "critical": { 
      // Red - Critical
      color: "bg-red-500", 
      text: "text-red-600",
      dotColor: "bg-red-500",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      pulse: true
    },
    "fuel": { 
      // Orange - Fuel (Food Low)
      color: "bg-orange-500", 
      text: "text-orange-600",
      dotColor: "bg-orange-500",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      pulse: true
    },
    "hydrate": { 
      // Blue - Hydrate
      color: "bg-blue-500", 
      text: "text-blue-600",
      dotColor: "bg-blue-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      pulse: true
    },
    "on-track": { 
      // Green - On Track
      color: "bg-green-500", 
      text: "text-green-600",
      dotColor: "bg-green-500",
      bgColor: "bg-green-50/50",
      borderColor: "border-green-200",
      pulse: false
    },
    "beast-mode": { 
      // Super Green (Emerald) - Beast Mode
      color: "bg-emerald-500", 
      text: "text-emerald-700",
      dotColor: "bg-emerald-500",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      pulse: false
    },
  };

  const config = statusConfig[status];

  return (
    <div className={cn(
      "flex items-center gap-2 rounded-full px-3 py-1.5 shadow-sm border whitespace-nowrap overflow-hidden max-w-[140px] justify-center transition-all",
      config.bgColor,
      config.borderColor
    )}>
      <span className={cn(
        "h-1.5 w-1.5 rounded-full shrink-0",
        config.dotColor,
        config.pulse && "animate-pulse"
      )} />
      <span className={cn(
        "text-[10px] sm:text-xs font-bold uppercase tracking-widest font-heading truncate",
        config.text
      )}>
        {label}
      </span>
    </div>
  );
}
