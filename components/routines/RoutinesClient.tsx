"use client";

import { RoutineCard } from "@/components/routines/RoutineCard";
import { RoutineForm } from "@/components/routines/RoutineForm";
import { useCreateRoutine } from "@/lib/mutations/useCreateRoutine";
import { useDeleteRoutine } from "@/lib/mutations/useDeleteRoutine";
import { useUpdateRoutine } from "@/lib/mutations/useUpdateRoutine";
import { useRoutines } from "@/lib/queries/useRoutines";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Dumbbell, Loader2, Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Routine {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  RoutineExercise: any[];
}

type FilterType = "all" | "system" | "user";

interface RoutinesClientProps {
  initialRoutines: Routine[];
}

/**
 * RoutinesClient - Clean React Query architecture
 * 
 * - Uses React Query for ALL data fetching
 * - Mutations automatically update cache
 * - No manual state management for data
 * - Consistent with workout page architecture
 */
export function RoutinesClient({ initialRoutines }: RoutinesClientProps) {
  const router = useRouter();

  // UI State only (not data)
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // React Query for data (single source of truth)
  const { data, isLoading } = useRoutines(
    { search: debouncedSearch, filter },
    { items: initialRoutines, nextCursor: null, hasMore: false }
  );

  // Mutations
  const createMutation = useCreateRoutine();
  const updateMutation = useUpdateRoutine();
  const deleteMutation = useDeleteRoutine();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Track scroll
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 120);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handlers
  const handleCreate = (data: { name: string; description?: string }) => {
    createMutation.mutate(data, {
      onSuccess: () => setIsFormOpen(false),
    });
  };

  const handleEdit = (routine: Routine) => {
    setEditingRoutine(routine);
    setIsFormOpen(true);
  };

  const handleUpdate = (data: { name: string; description?: string }) => {
    if (!editingRoutine) return;
    updateMutation.mutate(
      { id: editingRoutine.id, data },
      {
        onSuccess: () => {
          setIsFormOpen(false);
          setEditingRoutine(null);
        },
      }
    );
  };

  const handleDelete = (routine: Routine) => {
    deleteMutation.mutate(routine.id);
  };

  const filterLabels: Record<FilterType, string> = {
    all: "All",
    system: "System",
    user: "My Routines",
  };

  const routines = data?.items || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50/30 to-white pb-20 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-200/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-amber-200/20 to-transparent rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-r from-orange-50/90 to-white/90 backdrop-blur-md border-b border-orange-100/50 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="p-2.5 rounded-2xl bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all shadow-sm border border-white/50"
        >
          <ArrowLeft size={24} className="text-zinc-600" />
        </button>
        <h1 className="text-xl font-bold font-[var(--font-teko)] uppercase tracking-tight">
          Workout Routines
        </h1>
        <div className="w-10" />
      </div>

      {/* Fixed Search + Filters */}
      <div className="fixed top-[74px] left-0 right-0 z-20 bg-gradient-to-b from-orange-50/95 to-orange-50/80 backdrop-blur-sm">
        <div className="px-6 pt-2 pb-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-orange-100/30 border border-white/60 p-4 mx-2 flex items-center gap-3">
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
        </div>

        <div className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar">
          {(["all", "system", "user"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                filter === f
                  ? "bg-orange-500 text-white shadow-sm transform scale-105"
                  : "bg-white/80 text-zinc-600 border border-zinc-200 hover:border-orange-200"
              }`}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>

        <div
          className={`absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-orange-200/40 to-transparent pointer-events-none transform translate-y-full transition-opacity duration-300 ${
            isScrolled ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      <div className="h-56" />

      {/* Routines Grid */}
      <div className="px-6 pt-4 pb-6 min-h-[50vh]">
        {isLoading && routines.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="animate-spin mx-auto text-orange-500 mb-4" size={48} />
            <p className="text-zinc-500">Loading routines...</p>
          </div>
        ) : routines.length === 0 ? (
          <div className="text-center py-12">
            <Dumbbell size={48} className="mx-auto text-zinc-300 mb-4" />
            <p className="text-zinc-500 mb-4">
              {search ? "No routines match your search" : "No routines found"}
            </p>
            {!search && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
              >
                Create Your First Routine
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routines.map((routine: Routine) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                onEdit={() => handleEdit(routine)}
                onDelete={() => handleDelete(routine)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => {
          setEditingRoutine(null);
          setIsFormOpen(true);
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center z-40 hover:bg-orange-600 hover:scale-105 transition-all"
      >
        <Plus size={28} />
      </motion.button>

      {/* Form Modal */}
      <RoutineForm
        initialData={
          editingRoutine
            ? {
                name: editingRoutine.name,
                description: editingRoutine.description || undefined,
              }
            : undefined
        }
        onSubmit={editingRoutine ? handleUpdate : handleCreate}
        onCancel={() => {
          setIsFormOpen(false);
          setEditingRoutine(null);
        }}
        isOpen={isFormOpen}
      />
    </div>
  );
}
