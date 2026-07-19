/**
 * Temporary screen used while pages are being ported from the web app.
 * Every file in src/screens/ that still renders this is pending migration.
 */

import React from 'react';
import { Text, View } from 'react-native';

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      <Text className="mb-2 text-[28px] font-extrabold tracking-tight text-foreground">{title}</Text>
      <Text className="text-center text-muted-foreground">
        Pantalla en migración desde la app web.
      </Text>
    </View>
  );
}
