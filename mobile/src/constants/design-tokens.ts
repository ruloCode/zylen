/**
 * Zylen Design System
 * DOFUS-Exact Visual Identity
 * Deep Teal-Black | DOFUS Green rgb(151,168,0) | DOFUS Orange rgb(242,156,6)
 * Updated to match DOFUS branding 100%
 */

// ========================================
// COLOR PALETTE - DOFUS THEME
// ========================================

export const colors = {
  // Deep backgrounds - Dark teal/charcoal theme
  deepTeal: {
    500: '#0B191D', // rgb(11, 25, 29) - Main body background
  },

  charcoal: {
    50: '#F5F5F6',
    100: '#E8E9EA',
    200: '#D1D3D5',
    300: '#474341', // rgb(71, 65, 61) - Buttons, selector
    400: '#2E2A27', // rgb(46, 42, 39) - UI elements
    500: '#171412', // rgb(23, 20, 18) - Navigation, cards
    600: '#0E0C0B', // rgb(14, 12, 11) - Very dark elements
    700: '#121516',
    800: '#0E1011',
    900: '#000000', // Pure black
  },

  // DOFUS Green - Primary CTA color
  dofusGreen: {
    50: '#F9FDEC',
    100: '#EFF9D2',
    200: '#E0F5A5',
    300: '#C8ED6E',
    400: '#B2E448',
    500: '#97A800', // rgb(151, 168, 0) - PRIMARY DOFUS GREEN
    600: '#89B820', // rgb(137, 184, 32) - Lighter variant
    700: '#7AA51C',
    800: '#689119',
    900: '#567D16',
  },

  // DOFUS Orange - Secondary CTA color
  dofusOrange: {
    50: '#FFF5E6',
    100: '#FFEBCC',
    200: '#FFD699',
    300: '#FFC266',
    400: '#FFAD33',
    500: '#F29C06', // rgb(242, 156, 6) - PRIMARY DOFUS ORANGE
    600: '#CC8405',
    700: '#A66B04',
    800: '#805303',
    900: '#5A3A02',
  },

  // Text colors - White/Gray hierarchy (improved contrast)
  text: {
    primary: '#FFFFFF',     // Pure white rgb(255, 255, 255)
    secondary: '#DEDEDE',   // Light gray rgb(222, 222, 222)
    tertiary: '#BFBFBF',    // Light-medium gray rgb(191, 191, 191) - improved contrast
    dark: '#333333',        // Dark gray rgb(51, 51, 51)
    muted: '#BFBFBF',       // Light muted gray rgb(191, 191, 191) - improved contrast
  },

  brown: {
    light: '#362712',       // rgb(54, 39, 18) - Card titles
    dark: '#5B360E',        // rgb(91, 54, 14) - Darker brown
  },

  // Vibrant life area colors - Dofus character card style (saturated & bright)
  vibrant: {
    red: '#DC3232',         // Bright red rgb(220, 50, 50) - Health
    green: '#32C850',       // Bright green rgb(50, 200, 80) - Finance
    purple: '#B43CC8',      // Bright purple rgb(180, 60, 200) - Creativity
    blue: '#3296FF',        // Bright blue rgb(50, 150, 255) - Social
    orange: '#FF8C32',      // Bright orange rgb(255, 140, 50) - Family
    cyan: '#32C8DC',        // Bright cyan rgb(50, 200, 220) - Career
    pink: '#E752A3',        // Bright pink/magenta
    yellow: '#FFE632',      // Bright yellow rgb(255, 230, 50)
  },

  // Semantic colors
  success: '#42B381',       // Jade green (keep)
  danger: '#D9534F',        // DOFUS red rgb(217, 83, 79)
  warning: '#FFC107',       // Amber (keep)
  info: '#3296FF',          // Blue info
};

// ========================================
// GRADIENTS - DOFUS THEME
// ========================================

export const gradients = {
  // Background gradients (minimal - DOFUS uses solid colors mostly)
  darkAtmosphere: 'linear-gradient(180deg, rgb(23, 20, 18) 0%, rgb(11, 25, 29) 100%)',

  // DOFUS green gradient (minimal use)
  dofusGreenGradient: 'linear-gradient(135deg, rgb(151, 168, 0) 0%, rgb(137, 184, 32) 100%)',

  // Vibrant card gradients (for life areas only)
  vibrantRed: 'linear-gradient(135deg, #DC3232 0%, #B42828 100%)',
  vibrantGreen: 'linear-gradient(135deg, #32C850 0%, #28A040 100%)',
  vibrantPurple: 'linear-gradient(135deg, #B43CC8 0%, #9030A0 100%)',
  vibrantBlue: 'linear-gradient(135deg, #3296FF 0%, #2878CC 100%)',
  vibrantOrange: 'linear-gradient(135deg, #FF8C32 0%, #CC7028 100%)',
  vibrantCyan: 'linear-gradient(135deg, #32C8DC 0%, #28A0B0 100%)',
};

// ========================================
// TYPOGRAPHY - DOFUS STYLE
// ========================================

export const typography = {
  // Font families - DOFUS exact spec
  fontFamily: {
    // Body font (DOFUS uses Roboto)
    sans: '"Roboto", sans-serif',

    // Display font for headings (DOFUS uses Bebas Neue)
    display: '"Bebas Neue", sans-serif',

    // Buttons use Roboto
    button: '"Roboto", sans-serif',

    // Monospace for stats
    mono: '"JetBrains Mono", "SF Mono", "Consolas", monospace',
  },

  // Font sizes - DOFUS scale
  fontSize: {
    xs: '0.6875rem',    // 11px - Small text
    sm: '0.75rem',      // 12px - Small UI
    base: '1rem',       // 16px - Body text (DOFUS default)
    md: '1rem',         // 16px - H3
    lg: '1.1875rem',    // 19px - Navigation links (DOFUS spec)
    xl: '1.25rem',      // 20px - Subheadings
    '2xl': '1.4375rem', // 23px - CTA buttons (DOFUS spec)
    '3xl': '2rem',      // 32px - H2 (DOFUS spec)
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px - H1 (DOFUS spec)
    '6xl': '3.75rem',   // 60px
  },

  // Font weights - DOFUS uses normal for buttons, bold for links
  fontWeight: {
    normal: 400,        // DOFUS CTA buttons
    medium: 500,
    semibold: 600,
    bold: 700,          // DOFUS navigation, H3
    extrabold: 800,
  },

  // Line heights - DOFUS spec
  lineHeight: {
    tight: 1.1,         // H3 (17.6px / 16px)
    normal: 1.2,        // H1, H2 (DOFUS spec)
    relaxed: 1.5,
  },

  // Letter spacing - DOFUS uses normal
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',        // DOFUS standard
    wide: '0.05em',
  },
};

// ========================================
// SPACING SCALE - DOFUS
// ========================================

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  2.5: '0.625rem', // 10px - Dofus button padding
  3: '0.75rem',   // 12px - Dofus nav/footer padding
  4: '1rem',      // 16px
  4.5: '1.125rem', // 18px - Dofus button padding
  6: '1.5rem',    // 24px - Dofus filter margin
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
};

// ========================================
// BORDER RADIUS - DOFUS STYLE
// ========================================

export const borderRadius = {
  none: '0',          // Sharp corners - DOFUS standard for buttons & cards
  sm: '0.25rem',      // 4px
  md: '0.3125rem',    // 5px
  lg: '0.375rem',     // 6px
  xl: '0.625rem',     // 10px
  '2xl': '1.5rem',    // 24px
  '3xl': '2rem',      // 32px
  full: '9999px',     // 50% for circular icons
};

// ========================================
// SHADOWS - DOFUS STYLE
// ========================================

export const shadows = {
  // DOFUS shadows (exact specifications)
  dofusSubtle: 'rgba(0, 0, 0, 0.5) 0px 0px 3px 0px',
  dofus: 'rgb(0, 0, 0) 0px 0px 4px 0px',
  dofusStrong: 'rgb(0, 0, 0) 0px 0px 5px 0px',
  dofusHover: 'rgba(0, 0, 0, 0.8) 0px 0px 8px 0px',

  // DOFUS green glow
  dofusGreenGlow: '0px 0px 8px 0px rgba(151, 168, 0, 0.5)',
  dofusGreenGlowStrong: '0px 0px 12px 0px rgba(151, 168, 0, 0.7)',

  // Success glow
  successGlow: '0px 0px 8px 0px rgba(66, 179, 129, 0.5)',

  // DOFUS text shadows (exact specifications)
  textShadowLight: 'rgb(51, 51, 51) 0px 1px 1px',
  textShadowDark: 'rgb(0, 0, 0) 0px 1px 1px',
};

// ========================================
// ANIMATIONS - DOFUS STYLE
// ========================================

export const animations = {
  // Duration - Dofus uses quick transitions
  duration: {
    fast: '150ms',
    normal: '200ms',    // Dofus standard: 0.2s
    slow: '300ms',
    slower: '500ms',
  },

  // Easing - Dofus uses ease-in-out
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'ease-in-out',  // Dofus standard
  },

  // Keyframe names (defined in CSS)
  keyframes: {
    filterFade: 'filter-fade',
    cardLift: 'card-lift',
    fadeIn: 'fade-in',
    slideUp: 'slide-up',
    scaleIn: 'scale-in',
  },
};

// ========================================
// ICON SIZES - DOFUS
// ========================================

export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,         // Standard icon size
  lg: 32,
  xl: 48,
  '2xl': 64,      // Large life area icons
  '3xl': 96,      // Hero icons
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
// COMPONENT-SPECIFIC TOKENS - DOFUS
// ========================================

export const components = {
  // Button - DOFUS exact specification
  button: {
    height: {
      sm: '2rem',       // 32px - small
      md: 'auto',       // Auto height - DOFUS spec
      lg: 'auto',       // Auto height - DOFUS spec
    },
    padding: {
      sm: '0.5rem 0.75rem',      // 8px 12px - small
      md: '0.75rem 2.125rem',    // 12px 34px - DOFUS CTA exact
      lg: '0.75rem 2.125rem',    // 12px 34px - DOFUS CTA
    },
    borderRadius: '0',            // SQUARE - DOFUS standard
    fontSize: '1.4375rem',        // 23px - DOFUS CTA
    fontWeight: 400,              // Normal - DOFUS uses 400
    textTransform: 'uppercase' as const,
  },

  // Card - DOFUS style (sharp corners)
  card: {
    padding: {
      sm: '0.75rem',    // 12px
      md: '1rem',       // 16px
      lg: '1.5rem',     // 24px
    },
    borderWidth: '0px',           // No borders in DOFUS
    borderRadius: '0px',          // Sharp corners - DOFUS
    shadow: 'rgb(0, 0, 0) 0px 0px 4px 0px',
  },

  // Filter button - Diamond shape
  filterButton: {
    size: '100px',               // 100px × 100px
    inactiveOpacity: 0.6,
    activeOpacity: 1,
    transition: '0.2s ease-in-out',
  },

  // Life area card - DOFUS character card style
  lifeAreaCard: {
    imageSize: '256px × 250px',
    titleBarHeight: '60px',
    iconSize: '64px',
    borderRadius: '0px',         // Sharp corners
  },

  // Progress Bar - Simple for DOFUS
  progressBar: {
    height: {
      sm: '0.25rem',    // 4px
      md: '0.5rem',     // 8px
      lg: '0.75rem',    // 12px
    },
    borderRadius: '0px', // Sharp edges
  },

  // Navigation - DOFUS style (header spec: 92px, fixed top)
  navigation: {
    height: '5.75rem',    // 92px - DOFUS header height
    padding: '0.75rem',   // 12px - DOFUS spec
    iconSize: '1.5rem',   // 24px
    borderRadius: '0',    // Square - DOFUS
    shadow: 'rgba(0, 0, 0, 0.5) 0px 0px 3px 0px',
    background: 'rgba(23, 20, 18, 0.85)',
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
