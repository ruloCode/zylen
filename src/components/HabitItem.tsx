import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
interface HabitItemProps {
  id: string;
  name: string;
  icon: React.ReactNode;
  xp: number;
  completed: boolean;
  onToggle: (id: string, completed: boolean) => void;
}
export function HabitItem({
  id,
  name,
  icon,
  xp,
  completed,
  onToggle
}: HabitItemProps) {
  const [isCompleted, setIsCompleted] = useState(completed);
  const handleToggle = (value: boolean) => {
    setIsCompleted(value);
    onToggle(id, value);
  };
  return <div className={`glass-card rounded-2xl p-4 transition-all duration-300 ${isCompleted ? 'bg-green-50/80 border-green-200' : ''}`}>
      <div className="flex items-center gap-4">
        <div className="text-quest-blue bg-white/50 p-2 rounded-xl">{icon}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{name}</h3>
          <p className="text-sm text-quest-gold">+{xp} XP</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleToggle(true)} className={`p-2 rounded-xl transition-all ${isCompleted ? 'bg-green-500 text-white shadow-lg scale-110' : 'bg-white/50 text-gray-400 hover:bg-green-100'}`}>
            <Check size={20} />
          </button>
          <button onClick={() => handleToggle(false)} className={`p-2 rounded-xl transition-all ${!isCompleted && isCompleted !== completed ? 'bg-red-500 text-white shadow-lg scale-110' : 'bg-white/50 text-gray-400 hover:bg-red-100'}`}>
            <X size={20} />
          </button>
        </div>
      </div>
    </div>;
}