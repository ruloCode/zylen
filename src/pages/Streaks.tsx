import React from 'react';
import { Trophy, Award, Zap } from 'lucide-react';
import { StreakDisplay } from '../components/StreakDisplay';
export function Streaks() {
  const badges = [{
    id: 1,
    name: 'Week Warrior',
    icon: <Award size={32} />,
    unlocked: true
  }, {
    id: 2,
    name: 'Consistency King',
    icon: <Trophy size={32} />,
    unlocked: true
  }, {
    id: 3,
    name: 'Unstoppable',
    icon: <Zap size={32} />,
    unlocked: false
  }];
  return <div className="min-h-screen pb-24 px-4 pt-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Streak</h1>
          <p className="text-gray-600">Don't break the chain!</p>
        </div>

        {/* Current Streak */}
        <div className="glass-card rounded-3xl p-8 mb-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-100/50 to-red-100/50" />
          <div className="relative z-10">
            <StreakDisplay streak={12} size="lg" />
            <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-2">
              Current Streak
            </h2>
            <p className="text-gray-600">You're on fire! 🔥</p>
          </div>
        </div>

        {/* Best Streak */}
        <div className="glass-card rounded-3xl p-6 mb-6 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 mb-1">Best Streak</div>
            <div className="text-3xl font-bold text-gray-800">28 Days</div>
          </div>
          <Trophy size={48} className="text-quest-gold" />
        </div>

        {/* Avatar with Aura */}
        <div className="glass-card rounded-3xl p-8 mb-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-quest-blue/10 to-quest-purple/10" />
          <div className="relative z-10">
            <div className="relative inline-block">
              <div className="absolute -inset-8 bg-gradient-to-r from-quest-blue/30 to-quest-purple/30 rounded-full blur-2xl animate-pulse" />
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-quest-blue to-quest-purple flex items-center justify-center shadow-2xl">
                <Zap size={48} className="text-white" />
              </div>
            </div>
            <p className="mt-6 text-gray-800 font-semibold">
              Your aura grows stronger!
            </p>
            <p className="text-sm text-gray-600">
              Keep your streak to level up
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Achievements</h2>
          <div className="grid grid-cols-3 gap-4">
            {badges.map(badge => <div key={badge.id} className={`glass-card rounded-2xl p-4 text-center transition-all ${badge.unlocked ? 'scale-100' : 'opacity-50 grayscale'}`}>
                <div className={`${badge.unlocked ? 'text-quest-gold' : 'text-gray-400'} mb-2`}>
                  {badge.icon}
                </div>
                <p className="text-xs font-semibold text-gray-800">
                  {badge.name}
                </p>
              </div>)}
          </div>
        </div>

        {/* Motivation */}
        <div className="glass-card rounded-3xl p-6 text-center bg-gradient-to-br from-orange-50/80 to-red-50/80">
          <p className="text-gray-800 font-semibold">
            "Success is the sum of small efforts repeated day in and day out."
          </p>
        </div>
      </div>
    </div>;
}