"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Dumbbell, Search, X } from "lucide-react";
import { useState } from "react";

interface RoutineSelectorProps {
  routines: any[];
  onSelect: (routine: any) => void;
}

type FilterType = "all" | "system" | "user";

export function RoutineSelector({ routines, onSelect }: RoutineSelectorProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  // Filter routines based on search and filter
  const filteredRoutines = routines.filter((routine) => {
    // Search filter
    const matchesSearch =
      !search ||
      routine.name.toLowerCase().includes(search.toLowerCase()) ||
      routine.description?.toLowerCase().includes(search.toLowerCase());

    // Type filter
    const matchesFilter =
      filter === "all" ||
      (filter === "system" && routine.isSystem) ||
      (filter === "user" && !routine.isSystem);

    return matchesSearch && matchesFilter;
  });

  const filterLabels: Record<FilterType, string> = {
    all: "All",
    system: "System",
    user: "My Routines",
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Bar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-orange-100/30 border border-white/60 p-4 flex items-center gap-3">
        <Search size={22} className="text-zinc-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search routines..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-base placeholder:text-zinc-400"
        />
        <AnimatePresence>
          {search && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => setSearch("")}
              className="p-1 hover:bg-zinc-100 rounded-full"
            >
              <X size={18} className="text-zinc-400" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {(["all", "system", "user"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              filter === f
                ? "bg-orange-500 text-white shadow-sm transform scale-105"
                : "bg-white text-zinc-600 border border-zinc-200 hover:border-orange-200"
            }`}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {/* Routines Grid */}
      <div className="space-y-4">
        {filteredRoutines.length === 0 ? (
          <div className="text-center py-12">
            <Dumbbell size={48} className="mx-auto text-zinc-300 mb-4" />
            <p className="text-zinc-500 mb-4">
              {search ? "No routines match your search" : "No routines available"}
            </p>
          </div>
        ) : (
          <>
            {filteredRoutines.map((routine, index) => (
              <motion.button
                key={routine.id}
                onClick={() => onSelect(routine)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-6 rounded-3xl bg-white/70 backdrop-blur-sm border border-white/60 hover:shadow-lg shadow-md shadow-orange-100/20 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="text-orange-600" size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-bold font-heading text-foreground">
                        {routine.name}
                      </h3>
                      {routine.isSystem && (
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                          System
                        </span>
                      )}
                    </div>
                    {routine.description && (
                      <p className="text-sm text-zinc-500 mt-1 truncate">
                        {routine.description}
                      </p>
                    )}
                    <p className="text-xs text-zinc-400 mt-2">
                      {routine.RoutineExercise?.length || 0} exercises
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
