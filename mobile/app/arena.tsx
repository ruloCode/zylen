import React from 'react';
import { Redirect } from 'expo-router';
import { FEATURES } from '@/constants/config';
import { Arena } from '@/screens/Arena';

// Arena feature-flagged off for the first store release: the route stays
// registered but bounces to Home so deep links can't reach the game.
export default function ArenaRoute() {
  if (!FEATURES.enableArena) return <Redirect href="/" />;
  return <Arena />;
}
