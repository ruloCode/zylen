import React from 'react';
import { Sunrise, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
export function RootHabit() {
  const checkIns = Array.from({
    length: 30
  }, (_, i) => ({
    day: i + 1,
    completed: i < 12
  }));
  return <div className="min-h-screen pb-24 px-4 pt-8 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-md mx-auto">
        {/* Epic Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-quest-gold to-orange-500 flex items-center justify-center shadow-2xl">
            <Sunrise size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Revive Mode</h1>
          <p className="text-gray-300 text-lg leading-relaxed">
            Your comeback story starts now. Commit to 30 days of your most
            important habit and rise stronger.
          </p>
        </div>

        {/* Challenge Card */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 mb-6 border border-quest-gold/30 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4">
            30-Day Challenge
          </h2>
          <div className="mb-6">
            <ProgressBar current={12} max={30} color="quest-gold" size="lg" />
          </div>
          <div className="flex justify-between text-white mb-4">
            <span>Day 12 of 30</span>
            <span className="text-quest-gold font-bold">40% Complete</span>
          </div>
        </div>

        {/* Daily Check-ins */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 mb-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Daily Progress</h3>
          <div className="grid grid-cols-6 gap-2">
            {checkIns.map(day => <div key={day.day} className={`aspect-square rounded-xl flex items-center justify-center text-sm font-semibold transition-all ${day.completed ? 'bg-gradient-to-br from-quest-gold to-orange-500 text-white shadow-lg' : 'bg-gray-700 text-gray-500'}`}>
                {day.completed ? <CheckCircle2 size={16} /> : day.day}
              </div>)}
          </div>
        </div>

        {/* Motivation */}
        <div className="bg-gradient-to-br from-quest-gold/20 to-orange-500/20 rounded-3xl p-6 mb-6 border border-quest-gold/30">
          <p className="text-white text-center font-semibold text-lg leading-relaxed">
            "The phoenix must burn to emerge."
          </p>
          <p className="text-gray-300 text-center text-sm mt-2">
            Every day is a step toward your transformation
          </p>
        </div>

        {/* CTA */}
        <Button variant="primary" size="lg" className="w-full bg-gradient-to-r from-quest-gold to-orange-500">
          Check In Today
        </Button>
      </div>
    </div>;
}