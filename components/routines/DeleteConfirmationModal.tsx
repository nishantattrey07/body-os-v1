"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  routineName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * DeleteConfirmationModal - Custom confirmation modal for deleting routines
 * 
 * Features:
 * - Matches app theme (orange gradient)
 * - Shows routine name being deleted
 * - Warning icon
 * - Cancel and Delete actions
 */
export function DeleteConfirmationModal({
  isOpen,
  routineName,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 bg-white rounded-3xl shadow-2xl z-50 overflow-hidden"
            style={{ top: "50%", transform: "translate(-50%, -50%)" }}
          >
            {/* Header with Warning Icon */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
                <AlertTriangle size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold font-[var(--font-teko)] uppercase tracking-tight text-white">
                Delete Routine?
              </h2>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-center text-foreground mb-2">
                You are about to delete:
              </p>
              <p className="text-center text-lg font-bold text-zinc-900 mb-4">
                &quot;{routineName}&quot;
              </p>
              <p className="text-center text-sm text-zinc-600">
                This action cannot be undone. All exercises in this routine will be removed.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={onCancel}
                className="flex-1 py-3 px-4 bg-zinc-100 text-zinc-700 rounded-xl font-semibold hover:bg-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onCancel(); // Close modal after confirming
                }}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
