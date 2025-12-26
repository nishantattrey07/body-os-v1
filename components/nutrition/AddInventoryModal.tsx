"use client";

import { useInventory } from "@/lib/queries/useInventory";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddInventoryModal({ isOpen, onClose }: AddInventoryModalProps) {
  const { refetch } = useInventory();
  
  const [formData, setFormData] = useState({
    name: "",
    icon: "",
    brand: "",
    proteinPerUnit: "",
    carbsPerUnit: "",
    fatPerUnit: "",
    fiberPerUnit: "",
    sugarPerUnit: "",
    caloriesPerUnit: "",
    volumePerUnit: "",
    defaultUnit: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.icon || !formData.proteinPerUnit || !formData.caloriesPerUnit || !formData.volumePerUnit || !formData.defaultUnit) {
      toast.error("Missing fields", { description: "Name, icon, protein, calories, volume, and unit are required" });
      return;
    }

    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          icon: formData.icon,
          brand: formData.brand || undefined,
          proteinPerUnit: parseFloat(formData.proteinPerUnit),
          carbsPerUnit: formData.carbsPerUnit ? parseFloat(formData.carbsPerUnit) : 0,
          fatPerUnit: formData.fatPerUnit ? parseFloat(formData.fatPerUnit) : 0,
          fiberPerUnit: formData.fiberPerUnit ? parseFloat(formData.fiberPerUnit) : 0,
          sugarPerUnit: formData.sugarPerUnit ? parseFloat(formData.sugarPerUnit) : 0,
          caloriesPerUnit: parseFloat(formData.caloriesPerUnit),
          volumePerUnit: parseFloat(formData.volumePerUnit),
          defaultUnit: formData.defaultUnit,
          costPerUnit: 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create inventory item");
      }

      toast.success("Item added!", { description: `${formData.name} added to your inventory` });
      
      // Refetch inventory
      refetch();
      
      // Reset form
      setFormData({
        name: "",
        icon: "",
        brand: "",
        proteinPerUnit: "",
        carbsPerUnit: "",
        fatPerUnit: "",
        fiberPerUnit: "",
        sugarPerUnit: "",
        caloriesPerUnit: "",
        volumePerUnit: "",
        defaultUnit: "",
      });
      
      onClose();
    } catch (error) {
      toast.error("Failed to add item", { description: "Please try again" });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-heading uppercase">Add to Inventory</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Whey Scoop"
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Icon * (emoji)
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="🥛"
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-2xl text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Brand (optional)
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="MyProtein"
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Protein (g) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.proteinPerUnit}
                  onChange={(e) => setFormData({ ...formData, proteinPerUnit: e.target.value })}
                  placeholder="24"
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.carbsPerUnit}
                  onChange={(e) => setFormData({ ...formData, carbsPerUnit: e.target.value })}
                  placeholder="3"
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Fat (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.fatPerUnit}
                  onChange={(e) => setFormData({ ...formData, fatPerUnit: e.target.value })}
                  placeholder="1"
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Fiber (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.fiberPerUnit}
                  onChange={(e) => setFormData({ ...formData, fiberPerUnit: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Sugar (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.sugarPerUnit}
                  onChange={(e) => setFormData({ ...formData, sugarPerUnit: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Calories *
                </label>
                <input
                  type="number"
                  step="1"
                  value={formData.caloriesPerUnit}
                  onChange={(e) => setFormData({ ...formData, caloriesPerUnit: e.target.value })}
                  placeholder="120"
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Volume/Qty *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.volumePerUnit}
                  onChange={(e) => setFormData({ ...formData, volumePerUnit: e.target.value })}
                  placeholder="30"
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Unit *
                </label>
                <input
                  type="text"
                  value={formData.defaultUnit}
                  onChange={(e) => setFormData({ ...formData, defaultUnit: e.target.value })}
                  placeholder="scoop"
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <p className="text-xs text-zinc-500 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
              💡 <strong>Tip:</strong> All values are "per {formData.defaultUnit || "unit"}". E.g., if your scoop is 30g, enter macros for that 30g serving.
            </p>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-zinc-200 rounded-xl font-medium hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all"
              >
                Add Item
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
