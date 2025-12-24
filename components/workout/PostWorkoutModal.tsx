"use client";

import { motion } from "framer-motion";
import { Brain, Check, Clock, Dumbbell, Flame, Star, ThumbsUp, Zap } from "lucide-react";
import { useState } from "react";

interface PostWorkoutModalProps {
  routineName: string;
  duration: number; // in minutes
  setsCompleted: number;
  onComplete: (data: PostWorkoutData) => void;
}

export interface PostWorkoutData {
  postWorkoutEnergy: number;
  pumpRating: number;
  focusRating: number;
  overallRating: number;
  notes?: string;
}

function formatDuration(minutes: number): string {
  if (minutes < 1) return "< 1";
  if (minutes < 60) return `${minutes}`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}`;
}

export function PostWorkoutModal({ 
  routineName, 
  duration, 
  setsCompleted,
  onComplete 
}: PostWorkoutModalProps) {
  const [energy, setEnergy] = useState(3);
  const [pump, setPump] = useState(3);
  const [focus, setFocus] = useState(3);
  const [overall, setOverall] = useState(4);
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    onComplete({
      postWorkoutEnergy: energy,
      pumpRating: pump,
      focusRating: focus,
      overallRating: overall,
      notes: notes || undefined,
    });
  };

  // Star rating component
  const StarRating = ({ 
    value, 
    onChange, 
    icon: Icon, 
    label,
  }: { 
    value: number; 
    onChange: (v: number) => void; 
    icon: React.ElementType; 
    label: string;
  }) => (
    <div className="flex items-center justify-between py-4 border-b border-zinc-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center">
          <Icon size={16} className="text-zinc-600" />
        </div>
        <span className="text-sm font-medium text-zinc-700">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <motion.button
            key={n}
            onClick={() => onChange(n)}
            whileTap={{ scale: 0.85 }}
            className="p-1"
          >
            <Star 
              size={22} 
              className={`transition-colors ${
                value >= n 
                  ? 'fill-amber-400 text-amber-400' 
                  : 'fill-transparent text-zinc-200'
              }`}
            />
          </motion.button>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-md max-h-[95vh] overflow-y-auto no-scrollbar shadow-2xl"
      >
        {/* Success Header */}
        <div className="relative pt-10 pb-8 text-center bg-gradient-to-b from-emerald-50 to-white">
          {/* Animated check circle */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full mb-5 shadow-lg shadow-emerald-200"
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Check size={40} strokeWidth={3} className="text-white" />
            </motion.div>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-zinc-900"
          >
            Great Work!
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-zinc-500 text-sm mt-1"
          >
            {routineName} completed
          </motion.p>
        </div>

        {/* Stats Grid */}
        <div className="px-6 -mt-2">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 gap-3"
          >
            {/* Duration */}
            <div className="bg-zinc-50 rounded-2xl p-4 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-white rounded-xl shadow-sm mb-2">
                <Clock size={18} className="text-zinc-600" />
              </div>
              <p className="text-3xl font-bold text-zinc-900 tracking-tight">
                {formatDuration(duration)}
                <span className="text-lg font-medium text-zinc-400 ml-1">min</span>
              </p>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium mt-0.5">Duration</p>
            </div>
            
            {/* Sets */}
            <div className="bg-zinc-50 rounded-2xl p-4 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-white rounded-xl shadow-sm mb-2">
                <Flame size={18} className="text-orange-500" />
              </div>
              <p className="text-3xl font-bold text-zinc-900 tracking-tight">
                {setsCompleted}
                <span className="text-lg font-medium text-zinc-400 ml-1">sets</span>
              </p>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium mt-0.5">Completed</p>
            </div>
          </motion.div>
        </div>

        {/* Ratings Section */}
        <div className="px-6 pt-6">
          <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-2">
            How was your session?
          </p>
          
          <div className="bg-zinc-50 rounded-2xl px-4">
            <StarRating value={energy} onChange={setEnergy} icon={Zap} label="Energy After" />
            <StarRating value={pump} onChange={setPump} icon={Dumbbell} label="Muscle Pump" />
            <StarRating value={focus} onChange={setFocus} icon={Brain} label="Mind-Muscle Focus" />
            <StarRating value={overall} onChange={setOverall} icon={ThumbsUp} label="Overall" />
          </div>
        </div>

        {/* Notes */}
        <div className="px-6 pt-5">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this workout? (optional)"
            className="w-full p-4 rounded-2xl bg-zinc-50 border-0 text-sm resize-none h-20 focus:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all placeholder:text-zinc-300"
          />
        </div>

        {/* Submit Button */}
        <div className="p-6 pt-4">
          <motion.button
            onClick={handleSubmit}
            whileTap={{ scale: 0.98 }}
            className="w-full h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-base tracking-wide shadow-lg shadow-zinc-900/20 transition-all flex items-center justify-center gap-2"
          >
            Save & Finish
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
