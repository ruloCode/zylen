/**
 * MyWay (LifeQuest) Design System
 * Dark Fantasy RPG Visual Identity
 * Mystical + Modern | Dark Atmospheric | Neon Green Accents
 */

// ========================================
// COLOR PALETTE - DARK FANTASY
// ========================================

export const colors = {
  // Primary Dark Charcoal (Main backgrounds)
  charcoal: {
    50: '#F5F5F6',
    100: '#E8E9EA',
    200: '#D1D3D5',
    300: '#A9ACAF',
    400: '#6B6F73',
    500: '#1A1E1F', // Primary dark charcoal
    600: '#161A1B',
    700: '#121516',
    800: '#0E1011',
    900: '#0A0C0D',
  },

  // Primary Accent - Neon Green (Interactive elements, CTAs)
  neon: {
    50: '#F4FEF0',
    100: '#E6FCDC',
    200: '#D4FABD',
    300: '#BBFF6A', // Soft lime (secondary accent)
    400: '#9BEA63', // Primary neon green
    500: '#7FD854',
    600: '#66C042',
    700: '#4FA332',
    800: '#3D8527',
    900: '#2E6B1D',
  },

  // Deep Forest Green (Highlights, success states)
  forest: {
    50: '#F0F7F4',
    100: '#D9EDE3',
    200: '#B3DBC7',
    300: '#8CC9AB',
    400: '#66B78F',
    500: '#3D9970', // Deep forest green
    600: '#327D5C',
    700: '#276148',
    800: '#1C4534',
    900: '#112920',
  },

  // Fantasy Silver/Steel (Icons, borders, dividers)
  steel: {
    50: '#F8F9FA',
    100: '#E9ECEF',
    200: '#DEE2E6',
    300: '#CED4DA',
    400: '#ADB5BD',
    500: '#8B949E', // Fantasy steel
    600: '#6C757D',
    700: '#495057',
    800: '#343A40',
    900: '#212529',
  },

  // Warm Pale Tones (For portrait headers, skin tones)
  pale: {
    50: '#FFF9F5',
    100: '#FFF3EB',
    200: '#FFE7D6',
    300: '#FFD4B8',
    400: '#FFC299',
    500: '#FFAD7A', // Warm pale skin
    600: '#E69565',
    700: '#CC7E50',
    800: '#B3663B',
    900: '#994F26',
  },

  // Semantic Colors - Muted Dark Fantasy
  success: {
    50: '#F0FAF4',
    100: '#D9F2E3',
    200: '#B3E5C7',
    300: '#8CD8AB',
    400: '#66CB8F',
    500: '#3FBE73', // Muted green success
    600: '#33A05F',
    700: '#26824B',
    800: '#1A6437',
    900: '#0D4623',
  },

  warning: {
    50: '#FFFBEA',
    100: '#FFF3C4',
    200: '#FCE588',
    300: '#FADB5F',
    400: '#F7C948', // Amber glow
    500: '#F0B429',
    600: '#DE911D',
    700: '#CB6E17',
    800: '#B44D12',
    900: '#8D2B0B',
  },

  danger: {
    50: '#FFF5F5',
    100: '#FED7D7',
    200: '#FEB2B2',
    300: '#FC8181',
    400: '#F56565',
    500: '#C53030', // Muted red danger
    600: '#9B2C2C',
    700: '#742A2A',
    800: '#5F2121',
    900: '#4A1818',
  },

  // Additional Mystical Accents
  mystic: {
    purple: '#8B5CF6',  // Soft purple for magic effects
    cyan: '#22D3EE',    // Cyan for water/mana
    amber: '#F59E0B',   // Amber for quest markers
  },
};

// ========================================
// GRADIENTS - DARK FANTASY
// ========================================

export const gradients = {
  // Background gradients
  darkAtmosphere: 'linear-gradient(180deg, #1A1E1F 0%, #0E1011 50%, #0A0C0D 100%)',
  forestDepth: 'linear-gradient(135deg, #1A1E1F 0%, #1C4534 100%)',
  charcoalVignette: 'radial-gradient(circle at center, #1A1E1F 0%, #0A0C0D 100%)',

  // Neon glow gradients
  neonGlow: 'linear-gradient(135deg, #9BEA63 0%, #BBFF6A 100%)',
  forestGlow: 'linear-gradient(135deg, #3D9970 0%, #66B78F 100%)',
  steelShine: 'linear-gradient(135deg, #8B949E 0%, #CED4DA 100%)',

  // Interactive element glows
  ctaGlow: 'radial-gradient(circle, rgba(155, 234, 99, 0.4) 0%, transparent 70%)',
  successGlow: 'radial-gradient(circle, rgba(63, 190, 115, 0.3) 0%, transparent 70%)',
  warningGlow: 'radial-gradient(circle, rgba(247, 201, 72, 0.3) 0%, transparent 70%)',

  // Rim light effects (anime-style)
  neonRimLight: 'linear-gradient(135deg, transparent 0%, #9BEA63 100%)',
  steelRimLight: 'linear-gradient(135deg, transparent 0%, #8B949E 100%)',

  // Soft vignettes for portrait headers
  portraitVignette: 'radial-gradient(ellipse at center, transparent 0%, rgba(26, 30, 31, 0.8) 100%)',
};

// ========================================
// TYPOGRAPHY
// ========================================

export const typography = {
  // Font families
  fontFamily: {
    // Clean sans for body (modern, readable)
    sans: '"Inter", "Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

    // Display font for headings (can be fantasy-inspired)
    display: '"Space Grotesk", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',

    // Optional fantasy accent for special UI elements
    fantasy: '"Cinzel", "Cormorant", serif',

    // Monospace for code/stats
    mono: '"JetBrains Mono", "SF Mono", "Consolas", monospace',
  },

  // Font sizes
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
  },

  // Font weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter spacing
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.05em',
  },
};

// ========================================
// SPACING SCALE
// ========================================

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
};

// ========================================
// BORDER RADIUS
// ========================================

export const borderRadius = {
  none: '0',
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.25rem',   // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '2rem',   // 32px
  full: '9999px',
};

// ========================================
// SHADOWS - DARK FANTASY
// ========================================

export const shadows = {
  // Soft elevation shadows (20-30px blur)
  soft: '0 10px 20px rgba(0, 0, 0, 0.3)',
  softMd: '0 15px 25px rgba(0, 0, 0, 0.4)',
  softLg: '0 20px 30px rgba(0, 0, 0, 0.5)',
  softXl: '0 25px 40px rgba(0, 0, 0, 0.6)',

  // Neon glow effects
  neonGlow: '0 0 20px rgba(155, 234, 99, 0.5), 0 0 40px rgba(155, 234, 99, 0.3)',
  neonGlowStrong: '0 0 30px rgba(155, 234, 99, 0.7), 0 0 60px rgba(155, 234, 99, 0.4)',
  forestGlow: '0 0 20px rgba(61, 153, 112, 0.4), 0 0 40px rgba(61, 153, 112, 0.2)',
  amberGlow: '0 0 20px rgba(247, 201, 72, 0.4)',

  // Subtle inner glows (for interactive states)
  innerNeon: 'inset 0 0 20px rgba(155, 234, 99, 0.2)',
  innerForest: 'inset 0 0 20px rgba(61, 153, 112, 0.15)',

  // Rim light shadows (anime-style edge highlights)
  rimNeon: 'inset -1px -1px 0 rgba(155, 234, 99, 0.6)',
  rimSteel: 'inset -1px -1px 0 rgba(139, 148, 158, 0.4)',
};

// ========================================
// ANIMATIONS
// ========================================

export const animations = {
  // Duration
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '800ms',
  },

  // Easing
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Keyframe names (defined in CSS)
  keyframes: {
    neonPulse: 'neon-pulse',
    glowBreath: 'glow-breath',
    shimmerNeon: 'shimmer-neon',
    floatGentle: 'float-gentle',
    fadeIn: 'fade-in',
    slideUp: 'slide-up',
    scaleIn: 'scale-in',
  },
};

// ========================================
// ICON SIZES
// ========================================

export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
  '2xl': 64,
};

// ========================================
// Z-INDEX SCALE
// ========================================

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
};

// ========================================
// COMPONENT-SPECIFIC TOKENS
// ========================================

export const components = {
  // Button
  button: {
    height: {
      sm: '2rem',    // 32px
      md: '2.5rem',  // 40px
      lg: '3rem',    // 48px
    },
    padding: {
      sm: '0.5rem 1rem',
      md: '0.75rem 1.5rem',
      lg: '1rem 2rem',
    },
  },

  // Card
  card: {
    padding: {
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
    },
    borderWidth: '1px',
    glowBorderWidth: '2px',
  },

  // Chat Bubble (RPG dialogue)
  chatBubble: {
    maxWidth: '80%',
    padding: '1rem 1.25rem',
    borderRadius: '1.25rem',
  },

  // Progress Bar (XP with glowing edges)
  progressBar: {
    height: {
      sm: '0.375rem',  // 6px
      md: '0.625rem',  // 10px
      lg: '1rem',      // 16px
    },
    glowHeight: '2px',
  },

  // Navigation
  navigation: {
    height: '4.5rem',    // 72px
    iconSize: '1.5rem',  // 24px
  },
};

// ========================================
// EXPORT DEFAULT
// ========================================

export default {
  colors,
  gradients,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  iconSizes,
  zIndex,
  components,
};
