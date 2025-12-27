"use client";

import { useEditSet } from "@/lib/mutations/useEditSet";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Minus, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

interface EditSetModalProps {
  isOpen: boolean;
  setData: {
    id: string;
    setNumber: number;
    actualReps?: number;
    actualWeight?: number;
    actualSeconds?: number;
    rpe?: number;
    painLevel?: number;
    formNotes?: string;
  };
  exerciseName: string;
  isTimeBased: boolean;
  onClose: () => void;
}

export function EditSetModal({
  isOpen,
  setData,
  exerciseName,
  isTimeBased,
  onClose,
}: EditSetModalProps) {
  const editSetMutation = useEditSet();

  // Local state for editing
  const [value, setValue] = useState(
    isTimeBased ? (setData.actualSeconds || 60) : (setData.actualReps || 10)
  );
  const [weight, setWeight] = useState(setData.actualWeight || 0);
  const [rpe, setRPE] = useState(setData.rpe || 7);
  const [painLevel, setPainLevel] = useState(setData.painLevel || 0);
  const [formNotes, setFormNotes] = useState(setData.formNotes || "");

  const showHighPainWarning = painLevel > 3;

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setValue(isTimeBased ? (setData.actualSeconds || 60) : (setData.actualReps || 10));
      setWeight(setData.actualWeight || 0);
      setRPE(setData.rpe || 7);
      setPainLevel(setData.painLevel || 0);
      setFormNotes(setData.formNotes || "");
    }
  }, [isOpen, setData, isTimeBased]);

  const handleSave = () => {
    editSetMutation.mutate({
      setId: setData.id,
      updates: {
        ...(isTimeBased ? { actualSeconds: value } : { actualReps: value }),
        actualWeight: weight,
        rpe,
        painLevel,
        formNotes: formNotes.trim() || undefined,
      },
    }, {
      onSuccess: () => {
        onClose();
      },
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
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl z-50 max-w-md mx-auto max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white rounded-t-3xl border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Edit Set {setData.setNumber}</h3>
                <p className="text-sm text-zinc-500">{exerciseName}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-zinc-100 transition-colors"
              >
                <X size={20} className="text-zinc-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Reps/Seconds Counter */}
              <div className="bg-zinc-50 rounded-2xl p-5">
                <p className="text-center text-zinc-400 text-xs uppercase tracking-widest font-medium mb-4">
                  {isTimeBased ? "Seconds" : "Reps"}
                </p>
                <div className="flex items-center justify-center gap-6">
                  <motion.button
                    onClick={() => setValue(Math.max(0, value - 1))}
                    whileTap={{ scale: 0.9 }}
                    className="h-12 w-12 rounded-full bg-gradient-to-br from-red-400 to-red-600 text-white flex items-center justify-center shadow-lg"
                  >
                    <Minus size={20} strokeWidth={3} />
                  </motion.button>

                  <div className="text-5xl font-bold font-heading text-foreground tabular-nums min-w-[80px] text-center">
                    {value}
                  </div>

                  <motion.button
                    onClick={() => setValue(value + 1)}
                    whileTap={{ scale: 0.9 }}
                    className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white flex items-center justify-center shadow-lg"
                  >
                    <Plus size={20} strokeWidth={3} />
                  </motion.button>
                </div>

                {/* Quick adjust */}
                <div className="flex justify-center gap-2 mt-4">
                  {(isTimeBased ? [-30, -10, +10, +30] : [-5, -2, +2, +5]).map(delta => (
                    <button
                      key={delta}
                      onClick={() => setValue(Math.max(0, value + delta))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        delta < 0 
                          ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {delta > 0 ? '+' : ''}{delta}{isTimeBased ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight (if not time-based) */}
              {!isTimeBased && (
                <div className="bg-zinc-50 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-zinc-700 uppercase tracking-wide">Weight</p>
                    <span className="text-lg font-bold text-orange-600">{weight} kg</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setWeight(Math.max(0, weight - 5))}
                      className="flex-1 h-10 rounded-xl bg-zinc-200 hover:bg-zinc-300 font-bold text-zinc-700 transition-colors"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => setWeight(Math.max(0, weight - 2.5))}
                      className="flex-1 h-10 rounded-xl bg-zinc-100 hover:bg-zinc-200 font-bold text-zinc-700 transition-colors"
                    >
                      -2.5
                    </button>
                    <button
                      onClick={() => setWeight(weight + 2.5)}
                      className="flex-1 h-10 rounded-xl bg-orange-100 hover:bg-orange-200 font-bold text-orange-700 transition-colors"
                    >
                      +2.5
                    </button>
                    <button
                      onClick={() => setWeight(weight + 5)}
                      className="flex-1 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 font-bold text-white transition-colors"
                    >
                      +5
                    </button>
                  </div>
                </div>
              )}

              {/* RPE */}
              <div className="bg-zinc-50 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-zinc-700 uppercase tracking-wide">RPE (Effort)</p>
                  <span className={`text-lg font-bold ${
                    rpe <= 4 ? 'text-amber-500' :
                    rpe <= 6 ? 'text-lime-500' :
                    rpe <= 8 ? 'text-green-600' :
                    rpe === 9 ? 'text-orange-500' :
                    'text-red-500'
                  }`}>{rpe}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={rpe}
                  onChange={(e) => setRPE(parseInt(e.target.value))}
                  className="w-full h-2 mt-3 rounded-full appearance-none cursor-pointer"
                />
              </div>

              {/* Pain Level */}
              <div className="bg-zinc-50 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-amber-500" />
                    <p className="text-xs font-bold text-zinc-700 uppercase tracking-wide">Pain Level</p>
                  </div>
                  <span className={`text-lg font-bold ${
                    painLevel === 0 ? "text-green-600" :
                    painLevel <= 3 ? "text-amber-500" :
                    "text-red-500"
                  }`}>{painLevel}/10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={painLevel}
                  onChange={(e) => setPainLevel(parseInt(e.target.value))}
                  className="w-full h-2 mt-3 rounded-full appearance-none cursor-pointer"
                />

                {showHighPainWarning && (
                  <p className="text-xs text-red-600 font-medium mt-3">
                    ⚠️ High pain detected
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wide mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Form breakdown, fatigue, etc."
                  className="w-full px-3 py-2 text-sm text-zinc-700 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:outline-none focus:border-blue-400 resize-none"
                  rows={2}
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="sticky bottom-0 bg-white rounded-b-3xl border-t border-zinc-200 px-6 py-4 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 h-12 rounded-xl bg-zinc-200 hover:bg-zinc-300 font-bold text-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={editSetMutation.isPending}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold transition-all disabled:opacity-50"
              >
                {editSetMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
