/**
 * Avatar atom — React Native port.
 * expo-image with graceful fallback to initials or a user icon. Web-style
 * public paths ('/avatars/x.png') resolve through the asset registry.
 */

import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { User } from 'lucide-react-native';
import { cn } from '@/utils/cn';
import { img } from '@/assets/registry';

export interface AvatarProps {
  /** Avatar image URL (remote uri or web public path like '/avatars/x.png') */
  src?: string;
  /** Alt text for the image */
  alt: string;
  /** Size of the avatar */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Fallback text to display (first letters of name) */
  fallbackText?: string;
  /** Custom className */
  className?: string;
  /** Show online/offline status indicator */
  showStatus?: boolean;
  /** Status value (online/offline) */
  status?: 'online' | 'offline';
}

type AvatarSize = NonNullable<AvatarProps['size']>;

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  '2xl': 'w-20 h-20',
};

const TEXT_SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
  '2xl': 'text-xl',
};

const ICON_SIZES: Record<AvatarSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
};

const STATUS_SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
  '2xl': 'w-5 h-5',
};

export function Avatar({
  src,
  alt,
  size = 'md',
  fallbackText,
  className,
  showStatus = false,
  status = 'offline',
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const source = src ? (src.startsWith('/') ? img(src) : { uri: src }) : undefined;
  const showImage = source !== undefined && !imageError;

  return (
    <View className={cn('relative', className)}>
      <View
        className={cn(
          'items-center justify-center overflow-hidden rounded-full',
          'bg-teal-500/20',
          'border-2 border-teal-500/30',
          SIZE_CLASSES[size]
        )}
      >
        {showImage ? (
          <Image
            source={source}
            accessibilityLabel={alt}
            contentFit="cover"
            style={{ width: '100%', height: '100%' }}
            onError={() => setImageError(true)}
          />
        ) : fallbackText ? (
          <Text className={cn('font-bold uppercase text-white', TEXT_SIZE_CLASSES[size])}>
            {fallbackText}
          </Text>
        ) : (
          <User size={ICON_SIZES[size]} color="#FFFFFF" />
        )}
      </View>

      {/* Status indicator */}
      {showStatus && (
        <View
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-charcoal-500',
            STATUS_SIZE_CLASSES[size],
            status === 'online' ? 'bg-success-500' : 'bg-gray-400'
          )}
          accessibilityLabel={status === 'online' ? 'Online' : 'Offline'}
        />
      )}
    </View>
  );
}
