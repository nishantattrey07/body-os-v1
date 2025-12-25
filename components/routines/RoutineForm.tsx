"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface RoutineFormProps {
  initialData?: {
    name: string;
    description?: string;
  };
  onSubmit: (data: { name: string; description?: string }) => void;
  onCancel: () => void;
  isOpen: boolean;
}

/**
 * RoutineForm - Bottom sheet modal for creating/editing routine metadata
 * 
 * UI Features:
 * - Slides up from bottom
 * - Sticky header with close button
 * - Name input (required)
 * - Description textarea (optional)
 * - Submit button (orange gradient)
 */
export function RoutineForm({ initialData, onSubmit, onCancel, isOpen }: RoutineFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");

  // Reset form when initialData changes
  useEffect(() => {
    setName(initialData?.name || "");
    setDescription(initialData?.description || "");
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[85vh] overflow-y-auto"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white border-b border-zinc-100 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold font-[var(--font-teko)] uppercase tracking-tight text-foreground">
                {initialData ? "Edit Routine" : "New Routine"}
              </h2>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X size={24} className="text-zinc-600" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name Input */}
              <div>
                <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-2 block">
                  Routine Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Upper Body Strength"
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-orange-500 outline-none font-semibold transition-colors"
                />
              </div>

              {/* Description (Optional) */}
              <div>
                <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-2 block">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this routine..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-orange-500 outline-none resize-none transition-colors"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
              >
                {initialData ? "Save Changes" : "Create Routine"}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
