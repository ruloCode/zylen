import React, { useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface AvatarProps {
  /** Avatar image URL */
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

/**
 * Avatar atom - User avatar with fallback
 *
 * Displays user avatar image with graceful fallback to icon or initials
 *
 * @example
 * ```tsx
 * // With image
 * <Avatar src="/avatar.png" alt="John Doe" size="md" />
 *
 * // With fallback text
 * <Avatar fallbackText="JD" alt="John Doe" size="md" />
 *
 * // With status indicator
 * <Avatar
 *   src="/avatar.png"
 *   alt="John Doe"
 *   size="lg"
 *   showStatus
 *   status="online"
 * />
 * ```
 */
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

  // Size classes
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-20 h-20 text-xl',
  };

  const iconSizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10',
  };

  const statusSizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5',
  };

  const showImage = src && !imageError;

  return (
    <div className={cn('relative inline-block', className)}>
      <div
        className={cn(
          'rounded-full overflow-hidden flex items-center justify-center',
          'bg-gradient-to-br from-teal-500/20 to-teal-600/20',
          'border-2 border-teal-500/30',
          sizeClasses[size]
        )}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : fallbackText ? (
          <span className="font-bold text-white uppercase">
            {fallbackText}
          </span>
        ) : (
          <User className={cn(iconSizeClasses[size], 'text-white')} aria-hidden="true" />
        )}
      </div>

      {/* Status indicator */}
      {showStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-charcoal-500',
            statusSizeClasses[size],
            status === 'online' ? 'bg-green-500' : 'bg-gray-400'
          )}
          aria-label={status === 'online' ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}
