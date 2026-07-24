import React from 'react';
import { Redirect } from 'expo-router';
import { FEATURES } from '@/constants/config';
import { Chat } from '@/screens/Chat';

// Coach personal feature-flagged off para el release de tienda: la ruta queda
// registrada pero rebota a Home para que un deep link no llegue al chat.
export default function ChatRoute() {
  if (!FEATURES.enableChat) return <Redirect href="/" />;
  return <Chat />;
}
