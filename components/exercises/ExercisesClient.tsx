"use client";

import { ExerciseCard } from "@/components/exercises/ExerciseCard";
import { ExerciseForm } from "@/components/exercises/ExerciseForm";
import { useCreateExercise } from "@/lib/mutations/useCreateExercise";
import { useDeleteExercise } from "@/lib/mutations/useDeleteExercise";
import { useUpdateExercise } from "@/lib/mutations/useUpdateExercise";
import { useExerciseCategories } from "@/lib/queries/useExerciseCategories";
import { useExercises } from "@/lib/queries/useExercises";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Dumbbell, Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Exercise {
  id: string;
  name: string;
  category: string;
  trackingType: string;
  defaultSets: number;
  defaultReps: number | null;
  defaultDuration: number | null;
  description: string | null;
  isSystem: boolean;
}

type FilterType = "all" | "system" | "user";

interface ExercisesClientProps {
  initialExercises: Exercise[];
  initialHasMore: boolean;
  initialCursor: string | null;
}

const DEFAULT_CATEGORIES = ["Push", "Pull", "Core", "Legs"];

/**
 * ExercisesClient - Exercise Library with full CRUD
 */
export function ExercisesClient({
  initialExercises,
  initialHasMore,
  initialCursor,
}: ExercisesClientProps) {
  const router = useRouter();

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  // React Query
  const { data, isLoading } = useExercises(
    {
      search: debouncedSearch,
      filter,
      category: selectedCategory || undefined,
    },
    {
      exercises: initialExercises,
      hasMore: initialHasMore,
      nextCursor: initialCursor,
    }
  );

  // Mutations
  const createMutation = useCreateExercise();
  const updateMutation = useUpdateExercise();
  const deleteMutation = useDeleteExercise();

  // Fetch dynamic categories
  const { data: categoriesData } = useExerciseCategories();
  const categories = categoriesData || DEFAULT_CATEGORIES;

  const exercises = data?.exercises || initialExercises;

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 120);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filterLabels: Record<FilterType, string> = {
    all: "All",
    system: "System",
    user: "My Exercises",
  };

  // Handlers
  const handleCreate = async (data: any) => {
    try {
      await createMutation.mutateAsync(data);
      setIsFormOpen(false);
    } catch (error) {
      // Error is already handled by mutation's onError
      // Don't close modal to let user fix the issue
    }
  };

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setIsFormOpen(true);
  };

  const handleUpdate = async (data: any) => {
    if (!editingExercise) return;
    try {
      await updateMutation.mutateAsync({ id: editingExercise.id, data });
      setIsFormOpen(false);
      setEditingExercise(null);
    } catch (error) {
      // Error is already handled by mutation's onError
    }
  };

  const handleDelete = async (exerciseId: string) => {
    try {
      await deleteMutation.mutateAsync(exerciseId);
    } catch (error) {
      // Error is already handled by mutation's onError
    }
  };

  // Show skeleton only when loading with no data
  const showSkeleton = isLoading && exercises.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50/30 to-white pb-20 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-200/30 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-amber-200/20 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50/90 to-white/90 backdrop-blur-md border-b border-orange-100/50 px-6 py-4 flex items-center justify-between fixed top-0 left-0 right-0 z-30">
        <button
          onClick={() => router.back()}
          className="p-2.5 rounded-2xl bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all shadow-sm border border-white/50"
        >
          <ArrowLeft size={24} className="text-zinc-600" />
        </button>
        <h1 className="text-xl font-bold font-heading uppercase">Exercise Library</h1>
        <div className="w-10" />
      </div>

      {/* Fixed Search + Filters */}
      <div className="fixed top-[74px] left-0 right-0 z-20 bg-gradient-to-b from-orange-50/95 to-orange-50/80 backdrop-blur-sm">
        {/* Search Bar */}
        <div className="px-6 pt-2 pb-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-orange-100/30 border border-white/60 p-4 mx-2 flex items-center gap-3">
            <Search size={22} className="text-zinc-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search exercises..."
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

        {/* Owner Filter */}
        <div className="px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar">
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

        {/* Category Filter */}
        <div className="px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-colors ${
              selectedCategory === null
                ? "bg-zinc-800 text-white"
                : "bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-zinc-800 text-white"
                  : "bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Orange gradient */}
        <div className={`absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-orange-200/40 to-transparent pointer-events-none transform translate-y-full transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      {/* Spacer */}
      <div className="h-72" />

      {/* Exercise Grid */}
      <div className="px-6 pt-4 pb-6 min-h-[50vh]">
        {showSkeleton ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-zinc-100 animate-pulse">
                <div className="h-6 w-40 bg-zinc-200 rounded mb-2" />
                <div className="h-4 w-20 bg-blue-100 rounded mb-3" />
                <div className="h-4 w-32 bg-zinc-100 rounded mb-2" />
                <div className="flex gap-4">
                  <div className="h-4 w-16 bg-zinc-100 rounded" />
                  <div className="h-4 w-16 bg-zinc-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : exercises.length === 0 ? (
          <div className="text-center py-12">
            <Dumbbell size={48} className="mx-auto text-zinc-300 mb-4" />
            <p className="text-zinc-500 mb-4">
              {search ? "No exercises match your search" : "No exercises found"}
            </p>
            {!search && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
              >
                Create Your First Exercise
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onEdit={() => handleEdit(exercise)}
                onDelete={() => handleDelete(exercise.id)}
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
          setEditingExercise(null);
          setIsFormOpen(true);
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center z-40 hover:bg-orange-600 hover:scale-105 transition-all"
      >
        <Plus size={28} />
      </motion.button>

      {/* Form Modal */}
      <ExerciseForm
        initialData={editingExercise ? {
          name: editingExercise.name,
          category: editingExercise.category,
          trackingType: editingExercise.trackingType,
          defaultSets: editingExercise.defaultSets,
          defaultReps: editingExercise.defaultReps || undefined,
          defaultDuration: editingExercise.defaultDuration || undefined,
          description: editingExercise.description || undefined,
        } : undefined}
        onSubmit={editingExercise ? handleUpdate : handleCreate}
        onCancel={() => {
          setIsFormOpen(false);
          setEditingExercise(null);
        }}
        isOpen={isFormOpen}
      />
    </div>
  );
}
