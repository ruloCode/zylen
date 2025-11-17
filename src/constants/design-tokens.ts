/**
 * Zylen Design System
 * Dark Fantasy MMORPG Visual Identity (Dofus-inspired)
 * Deep Teal-Black | Lime Green Accents | Vibrant Character Cards
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

  // Vibrant accent colors - Lime/Yellow-Green (Dofus primary)
  lime: {
    50: '#F9FDEC',
    100: '#EFF9D2',
    200: '#E0F5A5',
    300: '#C8ED6E',
    400: '#B2E448',
    500: '#89B820', // rgb(137, 184, 32) - PRIMARY LIME GREEN
    600: '#7AA51C',
    700: '#689119',
    800: '#567D16',
    900: '#446913',
  },

  yellowGreen: {
    400: '#B9C932', // Light yellow-green
    500: '#AAB700', // rgb(170, 183, 0) - Yellow-green accent
    600: '#97A800', // rgb(151, 168, 0) - Darker lime (hover)
    700: '#808F00',
    800: '#6A7600',
    900: '#545D00',
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
  danger: '#E87481',        // Rose red (keep)
  warning: '#FFC107',       // Amber (keep)
  info: '#3296FF',          // Blue info
};

// ========================================
// GRADIENTS - DOFUS THEME
// ========================================

export const gradients = {
  // Background gradients (minimal - Dofus uses solid colors mostly)
  darkAtmosphere: 'linear-gradient(180deg, #0B191D 0%, #000000 100%)',

  // Lime green gradients
  limeGradient: 'linear-gradient(135deg, #89B820 0%, #AAB700 100%)',
  limeButton: 'linear-gradient(to bottom right, #89B820, #97A800)',

  // Vibrant card gradients
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
  // Font families
  fontFamily: {
    // Body font (modern, readable)
    sans: '"Nunito", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

    // Display font for headings (bold, uppercase)
    display: '"Space Grotesk", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',

    // Buttons - similar to lexend (bold, geometric)
    button: '"Nunito", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',

    // Monospace for stats
    mono: '"JetBrains Mono", "SF Mono", "Consolas", monospace',
  },

  // Font sizes - Dofus scale
  fontSize: {
    xs: '0.6875rem',    // 11px - Small text (footer, captions)
    sm: '0.75rem',      // 12px - Footer links, small UI
    base: '0.9375rem',  // 15px - Body text (Dofus default)
    md: '1rem',         // 16px - Language selector
    lg: '1.125rem',     // 18px - Navigation buttons, CTA buttons
    xl: '1.25rem',      // 20px - Subheadings
    '2xl': '1.5rem',    // 24px - Section headers
    '3xl': '1.875rem',  // 30px - Large headers
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px - Hero title (CLASES)
    '6xl': '3.75rem',   // 60px
  },

  // Font weights - Dofus is bold
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,          // Primary weight for Dofus style
    extrabold: 800,
  },

  // Line heights
  lineHeight: {
    tight: 1.25,        // Dofus has tight line height
    normal: 1.43,       // 21.43/15 ratio from Dofus
    relaxed: 1.75,
  },

  // Letter spacing - Dofus uses slight tracking
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.05em',     // For uppercase text
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
  none: '0',          // Sharp corners for cards (Dofus style)
  sm: '0.375rem',     // 6px - Navigation
  md: '0.625rem',     // 10px - Buttons, language selector
  lg: '1rem',         // 16px
  xl: '1.25rem',      // 20px
  '2xl': '1.5rem',    // 24px
  '3xl': '2rem',      // 32px
  full: '9999px',
};

// ========================================
// SHADOWS - DOFUS STYLE
// ========================================

export const shadows = {
  // Dofus shadows (simple black shadows)
  dofusLight: '0px 0px 3px 0px rgba(0, 0, 0, 0.5)',
  dofusMedium: '0px 0px 4px 0px rgb(0, 0, 0)',
  dofusStrong: '0px 0px 5px 0px rgb(0, 0, 0)',
  dofusHover: '0px 0px 8px 0px rgba(0, 0, 0, 0.8)',

  // Lime green glows
  limeGlow: '0px 0px 8px 0px rgba(137, 184, 32, 0.5)',
  limeGlowStrong: '0px 0px 12px 0px rgba(137, 184, 32, 0.7)',

  // Success glow
  successGlow: '0px 0px 8px 0px rgba(66, 179, 129, 0.5)',

  // Text shadows
  textShadowLight: '0px 1px 1px rgb(51, 51, 51)',
  textShadowDark: '0px 1px 1px rgb(0, 0, 0)',
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
  // Button - Dofus style
  button: {
    height: {
      sm: '2rem',       // 32px
      md: '2.5rem',     // 40px
      lg: '3rem',       // 48px
    },
    padding: {
      sm: '0.5rem 0.75rem',    // 8px 12px
      md: '0.625rem 1.125rem',  // 10px 18px - Dofus CTA
      lg: '0.75rem 1.5rem',     // 12px 24px
    },
    borderRadius: '0.625rem',   // 10px
    fontSize: '1.125rem',       // 18px
    fontWeight: 700,
    textTransform: 'uppercase' as const,
  },

  // Card - Dofus style (sharp corners)
  card: {
    padding: {
      sm: '0.75rem',    // 12px
      md: '1rem',       // 16px
      lg: '1.5rem',     // 24px
    },
    borderWidth: '0px',           // No borders in Dofus
    borderRadius: '0px',          // Sharp corners
    shadow: '0px 0px 4px 0px rgb(0, 0, 0)',
  },

  // Filter button - Diamond shape
  filterButton: {
    size: '100px',               // 100px × 100px
    inactiveOpacity: 0.6,
    activeOpacity: 1,
    transition: '0.2s ease-in-out',
  },

  // Life area card - Dofus character card style
  lifeAreaCard: {
    imageSize: '256px × 250px',  // Dofus card dimensions
    titleBarHeight: '60px',
    iconSize: '64px',
    borderRadius: '0px',         // Sharp corners
  },

  // Progress Bar - Simple for Dofus
  progressBar: {
    height: {
      sm: '0.25rem',    // 4px
      md: '0.5rem',     // 8px
      lg: '0.75rem',    // 12px
    },
    borderRadius: '0px', // Sharp edges
  },

  // Navigation - Dofus style
  navigation: {
    height: '4.25rem',    // 68px - Dofus nav height
    iconSize: '1.5rem',   // 24px
    borderRadius: '0.375rem', // 6px
    shadow: '0px 0px 3px 0px rgba(0, 0, 0, 0.5)',
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
