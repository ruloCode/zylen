import React from 'react';
import { Home, CheckSquare, Flame, ShoppingBag, MessageCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = [{
    path: '/',
    icon: Home,
    label: 'Home'
  }, {
    path: '/habits',
    icon: CheckSquare,
    label: 'Habits'
  }, {
    path: '/streaks',
    icon: Flame,
    label: 'Streaks'
  }, {
    path: '/shop',
    icon: ShoppingBag,
    label: 'Shop'
  }, {
    path: '/chat',
    icon: MessageCircle,
    label: 'Chat'
  }];
  return <nav className="fixed bottom-0 left-0 right-0 glass-card border-t border-white/20 px-4 py-3 z-50">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {navItems.map(({
        path,
        icon: Icon,
        label
      }) => {
        const isActive = location.pathname === path;
        return <button key={path} onClick={() => navigate(path)} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${isActive ? 'text-quest-blue bg-white/50 scale-110' : 'text-gray-500 hover:text-quest-blue'}`}>
              <Icon size={24} />
              <span className="text-xs font-medium">{label}</span>
            </button>;
      })}
      </div>
    </nav>;
}