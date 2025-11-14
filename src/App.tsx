import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { HabitLog } from './pages/HabitLog';
import { Streaks } from './pages/Streaks';
import { RootHabit } from './pages/RootHabit';
import { Shop } from './pages/Shop';
import { Chat } from './pages/Chat';
import { Navigation } from './components/Navigation';
export function App() {
  return <BrowserRouter>
      <div className="w-full min-h-screen">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/habits" element={<HabitLog />} />
          <Route path="/streaks" element={<Streaks />} />
          <Route path="/root-habit" element={<RootHabit />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
        <Navigation />
      </div>
    </BrowserRouter>;
}