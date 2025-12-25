"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface ExerciseFormProps {
  initialData?: {
    name: string;
    category: string;
    trackingType?: string;
    defaultSets: number;
    defaultReps?: number;
    defaultDuration?: number;
    description?: string;
  };
  onSubmit: (data: {
    name: string;
    category: string;
    trackingType: string;
    defaultSets: number;
    defaultReps?: number;
    defaultDuration?: number;
    description?: string;
  }) => void;
  onCancel: () => void;
  isOpen: boolean;
}

const DEFAULT_CATEGORIES = ["Push", "Core", "Pull", "Legs"];

/**
 * ExerciseForm - Modal for creating/editing exercises
 * Matches reference UI exactly
 */
export function ExerciseForm({ initialData, onSubmit, onCancel, isOpen }: ExerciseFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [category, setCategory] = useState(initialData?.category || "Push");
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategory, setShowCustomCategory] = useState(
    initialData?.category && !DEFAULT_CATEGORIES.includes(initialData.category)
  );
  const [trackingType, setTrackingType] = useState(initialData?.trackingType || "reps");
  const [defaultSets, setDefaultSets] = useState(initialData?.defaultSets || 3);
  const [defaultReps, setDefaultReps] = useState(initialData?.defaultReps || 10);
  const [defaultDuration, setDefaultDuration] = useState(initialData?.defaultDuration || 60);
  const [description, setDescription] = useState(initialData?.description || "");

  // Reset form when modal closes or initialData changes
  useEffect(() => {
    if (!isOpen) {
      // Clear form when modal closes
      setName("");
      setCategory("Push");
      setCustomCategory("");
      setShowCustomCategory(false);
      setTrackingType("reps");
      setDefaultSets(3);
      setDefaultReps(10);
      setDefaultDuration(60);
      setDescription("");
    } else if (initialData) {
      // Set form data when editing
      setName(initialData.name);
      setCategory(initialData.category);
      setCustomCategory("");
      setShowCustomCategory(!DEFAULT_CATEGORIES.includes(initialData.category));
      setTrackingType(initialData.trackingType || "reps");
      setDefaultSets(initialData.defaultSets);
      setDefaultReps(initialData.defaultReps || 10);
      setDefaultDuration(initialData.defaultDuration || 60);
      setDescription(initialData.description || "");
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      category: showCustomCategory ? customCategory : category,
      trackingType,
      defaultSets,
      defaultReps: trackingType === "reps" ? defaultReps : undefined,
      defaultDuration: trackingType === "seconds" ? defaultDuration : undefined,
      description: description || undefined,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal - Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-zinc-100 p-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold font-heading uppercase">
                {initialData ? "Edit Exercise" : "New Exercise"}
              </h2>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-2 block">
                  Exercise Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Bench Press"
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-orange-500 outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-2 block">
                  Category
                </label>
                {!showCustomCategory ? (
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
                          category === cat
                            ? "bg-orange-500 text-white"
                            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowCustomCategory(true)}
                      className="px-4 py-2 rounded-xl font-semibold text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      + Custom
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter custom category"
                      required
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-orange-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomCategory(false);
                        setCustomCategory("");
                      }}
                      className="px-4 py-3 bg-zinc-100 text-zinc-700 rounded-xl font-semibold hover:bg-zinc-200"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Exercise Type Toggle */}
              <div>
                <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-2 block">
                  Exercise Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTrackingType("reps")}
                    className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                      trackingType === "reps"
                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    }`}
                  >
                    Reps-Based
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrackingType("seconds")}
                    className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                      trackingType === "seconds"
                        ? "bg-zinc-800 text-white shadow-lg"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    }`}
                  >
                    Time-Based
                  </button>
                </div>
              </div>

              {/* Sets & Reps/Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-2 block">
                    Default Sets
                  </label>
                  <input
                    type="number"
                    value={defaultSets}
                    onChange={(e) => setDefaultSets(parseInt(e.target.value) || 0)}
                    min="1"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-orange-500 outline-none font-semibold text-center text-2xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-2 block">
                    {trackingType === "seconds" ? "Default Seconds" : "Default Reps"}
                  </label>
                  <input
                    type="number"
                    value={trackingType === "seconds" ? defaultDuration : defaultReps}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      if (trackingType === "seconds") {
                        setDefaultDuration(val);
                      } else {
                        setDefaultReps(val);
                      }
                    }}
                    min="1"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-orange-500 outline-none font-semibold text-center text-2xl"
                  />
                </div>
              </div>

              {/* Description (Optional) */}
              <div>
                <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-2 block">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description or notes..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-orange-500 outline-none resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                {initialData ? "Save Changes" : "Create Exercise"}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
