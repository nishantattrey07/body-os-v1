"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronDown, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { CreateBlockerModal } from "./CreateBlockerModal";

interface BlockerPickerProps {
  onSelect: (blockerId: string | null) => void;
  selectedBlockerId?: string | null;
}

export function BlockerPicker({ onSelect, selectedBlockerId }: BlockerPickerProps) {
  const [blockers, setBlockers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadBlockers();
  }, []);

  const loadBlockers = async () => {
    try {
      const response = await fetch("/api/blockers");
      if (!response.ok) throw new Error("Failed to fetch blockers");
      const data = await response.json();
      setBlockers(data.blockers || []);
    } catch (error) {
      console.error("Failed to load blockers:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedBlocker = blockers.find(b => b.id === selectedBlockerId);

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return "text-emerald-600 bg-emerald-50";
    if (severity <= 6) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  if (loading) {
    return (
      <div className="h-14 rounded-2xl bg-zinc-100 animate-pulse" />
    );
  }

  return (
    <div className="space-y-3">
      {/* Section Label */}
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
        Link to Body Issue
      </p>
      
      {/* Selected State OR Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${
          selectedBlockerId
            ? "border-red-200 bg-red-50/50"
            : "border-zinc-200 bg-white hover:border-zinc-300"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${
            selectedBlockerId ? "bg-red-100" : "bg-zinc-100"
          }`}>
            <AlertTriangle 
              size={18} 
              className={selectedBlockerId ? "text-red-500" : "text-zinc-400"} 
            />
          </div>
          <div>
            {selectedBlocker ? (
              <>
                <p className="font-bold text-zinc-800">{selectedBlocker.name}</p>
                <p className="text-xs text-zinc-500">{selectedBlocker.bodyPart}</p>
              </>
            ) : (
              <p className="font-medium text-zinc-500">
                {blockers.length > 0 ? "Select existing issue" : "No active issues"}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedBlockerId && (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null);
              }}
              className="p-1.5 rounded-full bg-red-100 hover:bg-red-200 transition-colors cursor-pointer"
            >
              <X size={14} className="text-red-600" />
            </span>
          )}
          <ChevronDown 
            size={18} 
            className={`text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} 
          />
        </div>
      </button>

      {/* Dropdown Options */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-zinc-200 bg-white shadow-lg overflow-hidden"
          >
            <div className="divide-y divide-zinc-100">
              {/* Existing Blockers */}
              {blockers.map((blocker) => (
                <button
                  key={blocker.id}
                  type="button"
                  onClick={() => {
                    onSelect(blocker.id);
                    setIsOpen(false);
                  }}
                  className={`w-full p-4 text-left transition-all flex items-center justify-between hover:bg-zinc-50 ${
                    selectedBlockerId === blocker.id ? "bg-red-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-zinc-100">
                      <AlertTriangle size={16} className="text-zinc-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-800">{blocker.name}</p>
                      <p className="text-xs text-zinc-400">{blocker.bodyPart}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-black px-2.5 py-1 rounded-xl ${getSeverityColor(blocker.severity)}`}>
                    {blocker.severity}/10
                  </span>
                </button>
              ))}
              
              {/* Not Related Option */}
              <button
                type="button"
                onClick={() => {
                  onSelect(null);
                  setIsOpen(false);
                }}
                className="w-full p-4 text-center text-sm font-medium text-zinc-500 hover:bg-zinc-50 transition-colors"
              >
                Not related to any issue
              </button>
              
              {/* Create New Issue */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowCreateModal(true);
                }}
                className="w-full p-4 text-left flex items-center gap-3 bg-zinc-50 hover:bg-zinc-100 transition-colors border-t border-zinc-200"
              >
                <div className="p-2 rounded-xl bg-zinc-800">
                  <Plus size={16} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-800">Report New Issue</p>
                  <p className="text-xs text-zinc-400">Create a new body issue to track</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Blocker Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateBlockerModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              setShowCreateModal(false);
              loadBlockers();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
