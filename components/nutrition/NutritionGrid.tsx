"use client";

import { useLogNutrition } from "@/lib/mutations/useLogNutrition";
import { useDailyLog } from "@/lib/queries/useDailyLog";
import { useInventory } from "@/lib/queries/useInventory";
import { useUserSettings } from "@/lib/queries/useUserSettings";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { AddInventoryModal } from "./AddInventoryModal";
import { QuickAddModal } from "./QuickAddModal";

interface FoodCardProps {
  id: string;
  name: string;
  icon: string; // emoji
  proteinPerUnit: number;
  fiberPerUnit: number;
  disabled: boolean;
  onTap: (id: string, event: React.MouseEvent) => void;
}

function FoodCard({ name, icon, proteinPerUnit, fiberPerUnit, disabled, onTap, id }: FoodCardProps) {
  const [tapped, setTapped] = useState(false);

  const handleTap = async (e: React.MouseEvent) => {
    if (disabled) return;
    
    setTapped(true);
    await onTap(id, e);
    
    // Reset animation after delay
    setTimeout(() => setTapped(false), 800);
  };

  return (
    <motion.button
      onClick={handleTap}
      disabled={disabled}
      className={`
        relative overflow-hidden rounded-3xl p-6  
        flex flex-col items-center justify-center gap-3 
        transition-all duration-300
        ${disabled 
            ? 'bg-zinc-50 opacity-50 cursor-not-allowed border-dashed border-2 border-zinc-200' 
            : 'bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-[0.98] cursor-pointer border border-zinc-100 shadow-sm'
        } 
      `}
      whileTap={!disabled ? { scale: 0.96 } : {}}
    >
      {/* Emoji Icon */}
      <div className="text-5xl filter drop-shadow-md transition-transform duration-300" role="img">{icon}</div>
      
      {/* Name */}
      <div className="flex flex-col items-center gap-1 z-10">
        <span className="font-bold text-base text-zinc-900 text-center leading-tight font-heading tracking-wide uppercase">
          {name}
        </span>
        <span className="text-xs text-zinc-400 font-medium font-body bg-zinc-50 px-2 py-1 rounded-full border border-zinc-100">
          {proteinPerUnit}g PRO
        </span>
        {/* NEW: Show fiber badge if >3g (important for bloat tracking) */}
        {fiberPerUnit > 3 && (
          <span className="text-xs text-green-600 font-medium font-body bg-green-50 px-2 py-1 rounded-full border border-green-100">
            {fiberPerUnit}g FIBER
          </span>
        )}
      </div>

      {/* Tap Feedback */}
      {tapped && (
        <motion.div
            layoutId="ripple"
            className="absolute inset-0 bg-blue-500/5 z-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
      )}

      {/* Disabled Overlay */}
      {disabled && (
        <div className="absolute top-3 right-3">
          <div className="bg-zinc-200 text-zinc-500 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">
            Off
          </div>
        </div>
      )}
    </motion.button>
  );
}

export function NutritionGrid() {
  // React Query hooks (using new architecture)
  const { data: items = [], isLoading: itemsLoading } = useInventory();
  const { data: dailyLog } = useDailyLog();
  const { data: settings } = useUserSettings();
  const logNutritionMutation = useLogNutrition();

  // Derived values with defaults (NEW: fiber tracking)
  const proteinTotal = dailyLog?.proteinTotal ?? 0;
  const proteinTarget = settings?.proteinTarget ?? 140;
  const fiberTotal = dailyLog?.fiberTotal ?? 0;
  const fiberTarget = settings?.fiberTarget ?? 30;

  // Animation State
  const [floatingParticles, setFloatingParticles] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  
  // Modal State
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [addInventoryOpen, setAddInventoryOpen] = useState(false);

  const handleTap = async (itemId: string, event: React.MouseEvent) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Trigger Floating Animation
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const particleId = Date.now();
    
    setFloatingParticles(prev => [
      ...prev, 
      { 
        id: particleId, 
        x: rect.left + rect.width / 2, 
        y: rect.top, 
        text: `+${item.proteinPerUnit}g` 
      }
    ]);

    // Cleanup particle
    setTimeout(() => {
      setFloatingParticles(prev => prev.filter(p => p.id !== particleId));
    }, 1500);

    try {
      // Use React Query mutation with optimistic updates
      await logNutritionMutation.mutateAsync({ item, quantity: 1 });
      
      // SUCCESS: No toast, just visual feedback from the card/banner
    } catch (error) {
      toast.error("Connection Failed", {
        description: "Could not log food. Please try again.",
      });
    }
  };

  if (itemsLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton - MUST match actual structure */}
        <div className="bg-gradient-to-r from-zinc-200 to-zinc-300 rounded-3xl p-6 relative overflow-hidden animate-pulse">
          <div className="flex justify-between items-center">
            <div>
              <div className="h-3 w-24 bg-zinc-300 rounded mb-2"></div>
              <div className="h-12 w-32 bg-zinc-300 rounded"></div>
            </div>
            <div className="text-right">
              <div className="h-3 w-16 bg-zinc-300 rounded mb-2"></div>
              <div className="h-8 w-20 bg-zinc-300 rounded"></div>
            </div>
          </div>
          <div className="mt-6 bg-zinc-300 rounded-full h-2"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-zinc-100 rounded-3xl h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Totals Banner (NEW: Fiber tracking) */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/20 transition-all duration-700" />
        
        <div className="flex justify-between items-center relative z-10">
          <div>
            <p className="text-xs opacity-80 uppercase tracking-widest font-semibold font-body mb-1">Today's Protein</p>
            <div className="flex items-baseline gap-1">
                <p className="text-6xl font-bold font-heading tracking-tight leading-none">
                    {Math.round(proteinTotal)}
                    <span className="text-3xl opacity-60 ml-1 font-body font-medium">g</span>
                </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-80 mb-1 uppercase tracking-wider font-medium">Target</p>
            <p className="text-3xl font-bold font-heading tracking-wide">{Math.round(proteinTarget)}g</p>
          </div>
        </div>
        
        {/* NEW: Fiber Row */}
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="opacity-80">Fiber:</span>
            <span className="font-bold">{Math.round(fiberTotal)}g</span>
            <span className="opacity-60">/ {fiberTarget}g</span>
          </div>
          {fiberTotal > fiberTarget && (
            <span className="text-xs bg-yellow-400/20 text-yellow-100 px-2 py-0.5 rounded-full">
              High
            </span>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4 bg-black/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
          <motion.div 
            className="bg-white h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((proteinTotal / proteinTarget) * 100, 100)}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          />
        </div>
      </div>

      {/* Food Grid */}
      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <FoodCard
            key={item.id}
            id={item.id}
            name={item.name}
            icon={item.icon}
            proteinPerUnit={item.proteinPerUnit}
            fiberPerUnit={item.fiberPerUnit}
            disabled={!item.isActive}
            onTap={handleTap}
          />
        ))}
      </div>

      {items.length === 0 && (
        <p className="text-center text-zinc-400 py-12 bg-zinc-50 rounded-3xl border border-zinc-100 border-dashed">
          No food items available. <br/>
          <span className="text-sm">Please add items to inventory.</span>
        </p>
      )}

      {/* Manual Entry Button (reference design) */}
      <div className="text-center pt-4">
        <p className="text-sm text-zinc-400 mb-3">Item not listed?</p>
        <button
          onClick={() => setQuickAddOpen(true)}
          className="w-full bg-gradient-to-r from-orange-400 to-orange-500 text-white py-4 rounded-3xl font-bold uppercase tracking-wide hover:from-orange-500 hover:to-orange-600 transition-all shadow-lg shadow-orange-500/20"
        >
          Manual Entry
        </button>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal isOpen={quickAddOpen} onClose={() => setQuickAddOpen(false)} />

      {/* Add to Inventory Button (Floating) */}
      <button
        onClick={() => setAddInventoryOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-full shadow-2xl hover:from-green-600 hover:to-green-700 transition-all z-40"
        title="Add to Inventory"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>

      {/* Add Inventory Modal */}
      <AddInventoryModal isOpen={addInventoryOpen} onClose={() => setAddInventoryOpen(false)} />

      {/* Global Floating Particles */}
      <AnimatePresence>
        {floatingParticles.map(particle => (
          <motion.div
            key={particle.id}
            initial={{ opacity: 1, y: particle.y, x: particle.x, scale: 0.5 }}
            animate={{ opacity: 0, y: particle.y - 200, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="fixed z-[100] pointer-events-none text-green-600 font-bold text-2xl font-heading -translate-x-1/2"
            style={{ left: 0, top: 0 }}
          >
            {particle.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
