import React from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';
import { LifeAreaCard } from '../components/LifeAreaCard';
import { StreakDisplay } from '../components/StreakDisplay';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import ruloAvatar from '../assets/rulo_avatar.png';
export function Dashboard() {
  const navigate = useNavigate();
  const lifeAreas = [{
    area: 'Health' as const,
    level: 5,
    currentXP: 320,
    maxXP: 500
  }, {
    area: 'Finance' as const,
    level: 3,
    currentXP: 180,
    maxXP: 300
  }, {
    area: 'Creativity' as const,
    level: 4,
    currentXP: 250,
    maxXP: 400
  }, {
    area: 'Social' as const,
    level: 6,
    currentXP: 450,
    maxXP: 600
  }, {
    area: 'Family' as const,
    level: 4,
    currentXP: 300,
    maxXP: 400
  }, {
    area: 'Career' as const,
    level: 7,
    currentXP: 580,
    maxXP: 700
  }];
  return <div className="min-h-screen pb-24 px-4 pt-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-quest-blue to-quest-purple bg-clip-text text-transparent mb-2">
            LifeQuest
          </h1>
          <p className="text-gray-600 text-sm">Your Life, Leveled Up</p>
        </div>

        {/* Points & Avatar */}
        <div className="bg-white rounded-3xl p-6 mb-6 text-center shadow-lg border border-white/20">
          <img
            src={ruloAvatar}
            alt="Rulo Avatar"
            className="w-32 mx-auto mb-4 float-animation object-contain"
          />
          <div className="text-5xl font-bold text-gray-800 mb-2">2,450</div>
          <div className="text-sm text-gray-600 flex items-center justify-center gap-2">
            <TrendingUp size={16} className="text-quest-green" />
            Total Points
          </div>
        </div>

        {/* Streak */}
        <div className="glass-card rounded-3xl p-6 mb-6 text-center">
          <StreakDisplay streak={12} size="lg" />
          <p className="mt-4 text-lg font-semibold text-gray-800">
            12 Day Streak!
          </p>
          <p className="text-sm text-gray-600">Keep the fire alive 🔥</p>
        </div>

        {/* Life Areas */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Life Areas</h2>
          <div className="grid grid-cols-2 gap-4">
            {lifeAreas.map(area => <LifeAreaCard key={area.area} {...area} />)}
          </div>
        </div>

        {/* CTA */}
        <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/habits')}>
          Log Today's Habits
        </Button>

        <p className="text-center text-sm text-gray-600 mt-4">
          Keep going, Champion! 💪
        </p>
      </div>
    </div>;
}