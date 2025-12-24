"use client";

import { motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CreateBlockerModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const BODY_PARTS = [
  "Right Elbow",
  "Left Elbow",
  "Right Shoulder",
  "Left Shoulder",
  "Lower Back",
  "Upper Back",
  "Right Knee",
  "Left Knee",
  "Right Wrist",
  "Left Wrist",
  "Neck",
  "Right Hip",
  "Left Hip",
  "Right Ankle",
  "Left Ankle",
  "Other",
];

const COMMON_ISSUES = [
  { name: "Golfer's Elbow", bodyPart: "Right Elbow" },
  { name: "Tennis Elbow", bodyPart: "Right Elbow" },
  { name: "Shoulder Impingement", bodyPart: "Right Shoulder" },
  { name: "Rotator Cuff Strain", bodyPart: "Right Shoulder" },
  { name: "Lower Back Strain", bodyPart: "Lower Back" },
  { name: "Knee Pain", bodyPart: "Right Knee" },
  { name: "Tight Hamstrings", bodyPart: "Right Hip" },
  { name: "Wrist Tendonitis", bodyPart: "Right Wrist" },
];

export function CreateBlockerModal({ onClose, onCreated }: CreateBlockerModalProps) {
  const [name, setName] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleQuickSelect = (issue: { name: string; bodyPart: string }) => {
    setName(issue.name);
    setBodyPart(issue.bodyPart);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !bodyPart) {
      toast.error("Please provide a name and body part");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/blockers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          bodyPart,
          severity,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to create blocker");

      toast.success("Body issue reported!");
      onCreated();
    } catch (error) {
      console.error("Failed to create blocker:", error);
      toast.error("Failed to report issue. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-red-50 p-6 border-b border-red-200 rounded-t-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-900">Report Body Issue</h2>
              <p className="text-sm text-red-600">Track injury or pain</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-red-100">
            <X className="text-red-600" size={20} />
          </button>
        </div>

        {/* Quick Select */}
        <div className="p-6 border-b border-zinc-100">
          <p className="text-sm font-medium text-zinc-500 mb-3">Quick Select</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_ISSUES.map((issue) => (
              <button
                key={issue.name}
                onClick={() => handleQuickSelect(issue)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  name === issue.name
                    ? "bg-red-500 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {issue.name}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Issue Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Golfer's Elbow"
              className="w-full p-4 rounded-2xl border border-zinc-200 text-lg focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>

          {/* Body Part */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Body Part</label>
            <select
              value={bodyPart}
              onChange={(e) => setBodyPart(e.target.value)}
              className="w-full p-4 rounded-2xl border border-zinc-200 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <option value="">Select body part...</option>
              {BODY_PARTS.map((part) => (
                <option key={part} value={part}>{part}</option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-zinc-700">Severity</label>
              <span className="text-lg font-bold text-red-600">{severity}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={severity}
              onChange={(e) => setSeverity(parseInt(e.target.value))}
              className="w-full h-3 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-red-500"
            />
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Mild discomfort</span>
              <span>Severe pain</span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="When does it hurt? What triggered it?"
              className="w-full p-4 rounded-2xl border border-zinc-200 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white p-6 border-t border-zinc-100 rounded-b-3xl">
          <button
            onClick={handleSubmit}
            disabled={saving || !name.trim() || !bodyPart}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-lg uppercase tracking-wider shadow-lg disabled:opacity-50"
          >
            {saving ? "Saving..." : "Report Issue"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
