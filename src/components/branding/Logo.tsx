/**
 * MyWay (LifeQuest) Logo Components
 * 3 design directions for brand identity
 */

import React from 'react';

interface LogoProps {
  size?: number | 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'progress-node' | 'phoenix' | 'level-star';
}

/**
 * Logo 1: Progress Node
 * Geometric hexagon with ascending steps inside, golden gradient
 * Symbolizes: level-up, progress, growth through stages
 */
export const ProgressNodeLogo: React.FC<Omit<LogoProps, 'variant'>> = ({
  size = 48,
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="gold-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFC857" />
          <stop offset="100%" stopColor="#FFB74D" />
        </linearGradient>
        <linearGradient id="rim-light-1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Outer hexagon */}
      <path
        d="M50 5 L85 25 L85 65 L50 85 L15 65 L15 25 Z"
        fill="url(#gold-gradient-1)"
        stroke="url(#rim-light-1)"
        strokeWidth="3"
        opacity="0.9"
      />

      {/* Inner ascending steps (progress nodes) */}
      <g fill="#2AB7A9" opacity="0.95">
        {/* Step 1 - smallest */}
        <rect x="35" y="60" width="10" height="10" rx="2" />

        {/* Step 2 - medium */}
        <rect x="45" y="50" width="10" height="20" rx="2" />

        {/* Step 3 - tallest */}
        <rect x="55" y="35" width="10" height="35" rx="2" />
      </g>

      {/* Highlight rim light effect */}
      <path
        d="M50 5 L85 25 L85 65"
        stroke="#FFD700"
        strokeWidth="2"
        opacity="0.4"
        fill="none"
      />
    </svg>
  );
};

/**
 * Logo 2: Phoenix Rebirth
 * Minimal bird rising from flame, circular emblem
 * Symbolizes: rebirth, transformation, rising from challenges
 */
export const PhoenixLogo: React.FC<Omit<LogoProps, 'variant'>> = ({
  size = 48,
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="gold-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFC857" />
          <stop offset="100%" stopColor="#FFA726" />
        </linearGradient>
        <linearGradient id="fire-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#FF8A65" />
          <stop offset="50%" stopColor="#FFA726" />
          <stop offset="100%" stopColor="#FFD700" />
        </linearGradient>
        <radialGradient id="glow-2">
          <stop offset="0%" stopColor="#FFC857" stopOpacity="0.4" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Outer circle with glow */}
      <circle cx="50" cy="50" r="45" fill="url(#glow-2)" />
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke="url(#gold-gradient-2)"
        strokeWidth="3"
        opacity="0.9"
      />

      {/* Flame base */}
      <path
        d="M35 65 Q40 55, 45 60 Q50 50, 50 60 Q50 50, 55 60 Q60 55, 65 65 Q50 75, 35 65 Z"
        fill="url(#fire-gradient)"
        opacity="0.8"
      />

      {/* Phoenix bird (simplified geometric form) */}
      <g fill="#2AB7A9" stroke="#2D3E50" strokeWidth="1.5">
        {/* Body */}
        <ellipse cx="50" cy="45" rx="8" ry="12" />

        {/* Wings */}
        <path d="M42 40 Q35 35, 38 30" strokeLinecap="round" fill="none" />
        <path d="M58 40 Q65 35, 62 30" strokeLinecap="round" fill="none" />

        {/* Head */}
        <circle cx="50" cy="35" r="5" />

        {/* Beak */}
        <path d="M50 33 L53 35 L50 37 Z" fill="#FFD700" stroke="none" />
      </g>

      {/* Rising sparkles */}
      <g fill="#FFD700" opacity="0.7">
        <circle cx="40" cy="25" r="1.5" />
        <circle cx="60" cy="28" r="2" />
        <circle cx="50" cy="20" r="1" />
      </g>
    </svg>
  );
};

/**
 * Logo 3: Level Star
 * Isometric star with "MW" monogram, soft rim-light
 * Symbolizes: achievement, excellence, MyWay brand
 */
export const LevelStarLogo: React.FC<Omit<LogoProps, 'variant'>> = ({
  size = 48,
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="gold-gradient-3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFC857" />
          <stop offset="100%" stopColor="#F4B400" />
        </linearGradient>
        <linearGradient id="teal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2AB7A9" />
          <stop offset="100%" stopColor="#26A69A" />
        </linearGradient>
        <filter id="isometric-shadow">
          <feOffset dx="3" dy="3" />
          <feGaussianBlur stdDeviation="2" />
          <feColorMatrix values="0 0 0 0 0.1  0 0 0 0 0.11  0 0 0 0 0.12  0 0 0 0.15 0" />
        </filter>
      </defs>

      {/* Star shape with isometric shadow */}
      <g filter="url(#isometric-shadow)">
        <path
          d="M50 10 L60 35 L87 35 L65 52 L73 77 L50 62 L27 77 L35 52 L13 35 L40 35 Z"
          fill="url(#gold-gradient-3)"
          stroke="#FFD700"
          strokeWidth="2"
          opacity="0.95"
        />
      </g>

      {/* Inner circle background */}
      <circle cx="50" cy="50" r="20" fill="#2D3E50" opacity="0.85" />

      {/* "MW" monogram */}
      <g fill="url(#teal-gradient)" fontFamily="Space Grotesk, sans-serif" fontWeight="bold">
        <text
          x="50"
          y="58"
          fontSize="24"
          textAnchor="middle"
          fill="#FFC857"
          stroke="#FFD700"
          strokeWidth="0.5"
        >
          MW
        </text>
      </g>

      {/* Rim light highlights */}
      <path
        d="M50 10 L60 35 L87 35"
        stroke="#FFD700"
        strokeWidth="2"
        opacity="0.5"
        fill="none"
      />

      {/* Corner sparkles */}
      <g fill="#FFD700" opacity="0.8">
        <circle cx="87" cy="35" r="2" />
        <circle cx="73" cy="77" r="1.5" />
        <circle cx="27" cy="77" r="1.5" />
      </g>
    </svg>
  );
};

/**
 * Main Logo component with variant selection
 */
export const Logo: React.FC<LogoProps> = ({
  size = 48,
  className = '',
  variant = 'progress-node'
}) => {
  // Convert size string to number
  const numericSize = typeof size === 'string'
    ? { sm: 32, md: 48, lg: 64 }[size] || 48
    : size;

  switch (variant) {
    case 'phoenix':
      return <PhoenixLogo size={numericSize} className={className} />;
    case 'level-star':
      return <LevelStarLogo size={numericSize} className={className} />;
    case 'progress-node':
    default:
      return <ProgressNodeLogo size={numericSize} className={className} />;
  }
};

export default Logo;
