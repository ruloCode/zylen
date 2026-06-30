module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: "selector",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // Font families - DOFUS Style
      fontFamily: {
        sans: ['"Roboto"', 'sans-serif'],
        display: ['"Bebas Neue"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', '"Consolas"', 'monospace'],
      },

      // Color palette - Dark Fantasy RPG
      colors: {
        // Base semantic colors (alpha-value form so /<opacity> modifiers work)
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          hover: "hsl(var(--primary-hover) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },

        // Verde Brillante - Alto contraste (Primary)
        green: {
          50: 'hsl(76, 90%, 95%)',
          100: 'hsl(76, 85%, 90%)',
          200: 'hsl(76, 85%, 80%)',
          300: 'hsl(76, 85%, 70%)',
          400: 'hsl(76, 85%, 60%)',
          500: 'hsl(76, 85%, 52%)',   // rgb(155, 215, 50) - PRIMARY BRILLANTE
          600: 'hsl(76, 73%, 42%)',   // rgb(137, 184, 32)
          700: 'hsl(65, 100%, 33%)',  // rgb(151, 168, 0)
          800: 'hsl(65, 100%, 28%)',
          900: 'hsl(65, 100%, 23%)',
        },

        // Naranja Brillante - Alto contraste (Secondary)
        orange: {
          50: 'hsl(36, 100%, 95%)',
          100: 'hsl(36, 100%, 90%)',
          200: 'hsl(36, 100%, 80%)',
          300: 'hsl(36, 100%, 70%)',
          400: 'hsl(36, 100%, 60%)',
          500: 'hsl(36, 100%, 52%)',  // Naranja brillante PRIMARY
          600: 'hsl(36, 98%, 49%)',   // rgb(242, 156, 6) - DOFUS orange
          700: 'hsl(36, 90%, 40%)',
          800: 'hsl(36, 85%, 35%)',
          900: 'hsl(36, 80%, 30%)',
        },

        // Azul Brillante - Alto contraste (Info/Links)
        blue: {
          50: 'hsl(210, 100%, 95%)',
          100: 'hsl(210, 100%, 90%)',
          200: 'hsl(210, 100%, 80%)',
          300: 'hsl(210, 100%, 70%)',
          400: 'hsl(210, 100%, 62%)',  // Azul brillante
          500: 'hsl(210, 100%, 60%)',  // rgb(50, 150, 255) - PRIMARY
          600: 'hsl(210, 90%, 55%)',
          700: 'hsl(210, 80%, 50%)',
          800: 'hsl(210, 70%, 45%)',
          900: 'hsl(210, 60%, 40%)',
        },

        // Cyan Brillante - Alto contraste
        cyan: {
          50: 'hsl(186, 100%, 95%)',
          100: 'hsl(186, 90%, 85%)',
          200: 'hsl(186, 85%, 75%)',
          300: 'hsl(186, 80%, 65%)',
          400: 'hsl(186, 75%, 57%)',
          500: 'hsl(186, 63%, 53%)',  // rgb(50, 200, 220) - PRIMARY
          600: 'hsl(186, 60%, 48%)',
          700: 'hsl(186, 55%, 43%)',
          800: 'hsl(186, 50%, 38%)',
          900: 'hsl(186, 45%, 33%)',
        },

        // Teal/Emerald - Primary ACTION color (completions, CTAs) - revives ~215 legacy refs
        // THEMED: re-pointed to per-theme --accent-* ramp so it restyles with the active theme.
        teal: {
          50:  'hsl(var(--accent-50) / <alpha-value>)',
          100: 'hsl(var(--accent-50) / <alpha-value>)',
          200: 'hsl(var(--accent-50) / <alpha-value>)',
          300: 'hsl(var(--accent-400) / <alpha-value>)',
          400: 'hsl(var(--accent-400) / <alpha-value>)',
          500: 'hsl(var(--accent-500) / <alpha-value>)',
          600: 'hsl(var(--accent-600) / <alpha-value>)',
          700: 'hsl(var(--accent-700) / <alpha-value>)',
          800: 'hsl(var(--accent-700) / <alpha-value>)',
          900: 'hsl(var(--accent-700) / <alpha-value>)',
        },

        // Gold/Amber - XP, points & rewards - revives ~200 legacy refs
        gold: {
          50: 'hsl(45, 100%, 96%)',
          100: 'hsl(45, 97%, 88%)',
          200: 'hsl(44, 96%, 77%)',
          300: 'hsl(42, 95%, 66%)',
          400: 'hsl(40, 95%, 58%)',  // Bright gold
          500: 'hsl(38, 95%, 52%)',  // Primary gold
          600: 'hsl(34, 92%, 46%)',
          700: 'hsl(30, 88%, 39%)',
          800: 'hsl(26, 82%, 33%)',
          900: 'hsl(24, 76%, 27%)',
        },

        // Dark Charcoal (Main backgrounds / surfaces)
        // THEMED: re-pointed to per-theme --surface-* ramp so it restyles
        // with the active theme (drives light vs dark — e.g. Nous goes light).
        charcoal: {
          DEFAULT: 'hsl(var(--surface-500) / <alpha-value>)',
          50:  'hsl(var(--surface-50) / <alpha-value>)',
          100: 'hsl(var(--surface-50) / <alpha-value>)',
          200: 'hsl(var(--surface-50) / <alpha-value>)',
          300: 'hsl(var(--surface-50) / <alpha-value>)',
          400: 'hsl(var(--surface-600) / <alpha-value>)',
          500: 'hsl(var(--surface-500) / <alpha-value>)',
          600: 'hsl(var(--surface-600) / <alpha-value>)',
          700: 'hsl(var(--surface-700) / <alpha-value>)',
          800: 'hsl(var(--surface-900) / <alpha-value>)',
          900: 'hsl(var(--surface-900) / <alpha-value>)',
        },

        // Surface tokens (themed) - explicit semantic naming for new code
        surface: {
          DEFAULT: 'hsl(var(--surface) / <alpha-value>)',
          elevated: 'hsl(var(--surface-elevated) / <alpha-value>)',
        },

        // Semantic colors
        success: {
          50: '#F0FAF4',
          100: '#D9F2E3',
          200: '#B3E5C7',
          300: '#8CD8AB',
          400: '#66CB8F',
          500: '#3FBE73',
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
          400: '#F7C948',  // Amber glow
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
          500: 'rgb(217, 83, 79)',  // DOFUS red
          600: '#9B2C2C',
          700: '#742A2A',
          800: '#5F2121',
          900: '#4A1818',
        },
      },

      // Border radius
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },

      // Box shadows - DOFUS Exact Specifications
      boxShadow: {
        // DOFUS Standard Shadows
        'dofus-subtle': 'rgba(0, 0, 0, 0.5) 0px 0px 3px 0px',
        'dofus': 'rgb(0, 0, 0) 0px 0px 4px 0px',
        'dofus-strong': 'rgb(0, 0, 0) 0px 0px 5px 0px',
        'dofus-hover': 'rgba(0, 0, 0, 0.8) 0px 0px 8px 0px',

        // DOFUS Green glow (for primary actions)
        'dofus-green-glow': '0px 0px 8px 0px rgba(151, 168, 0, 0.5)',
        'dofus-green-glow-strong': '0px 0px 12px 0px rgba(151, 168, 0, 0.7)',

        // Success glow
        'glow-success': '0 0 8px 0px rgba(66, 179, 129, 0.5)',

        // ── Zylen v2 evolved soft shadows (depth without harsh edges) ──
        'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.4)',
        'soft-md': '0 4px 16px -4px rgba(0, 0, 0, 0.45)',
        'soft-lg': '0 8px 28px -6px rgba(0, 0, 0, 0.5)',
        'soft-xl': '0 16px 48px -8px rgba(0, 0, 0, 0.55)',

        // ── Colored glows (revive legacy refs) ──
        'glow-teal': '0 0 16px -2px hsla(167, 78%, 45%, 0.55)',
        'glow-teal-strong': '0 0 24px 0px hsla(167, 78%, 50%, 0.7)',
        'glow-gold': '0 0 16px -2px hsla(40, 95%, 55%, 0.55)',
        'glow-gold-strong': '0 0 24px 0px hsla(40, 95%, 58%, 0.7)',
        'glow-green': '0 0 16px -2px hsla(76, 85%, 52%, 0.55)',
        'glow-danger': '0 0 16px -2px hsla(0, 85%, 62%, 0.5)',

        // Aliases used by legacy components (shadow-gold-*, shadow-teal-*)
        'gold-glow': '0 0 16px -2px hsla(40, 95%, 55%, 0.55)',
        'teal-glow': '0 0 16px -2px hsla(167, 78%, 45%, 0.55)',
      },

      // Background gradients - Minimal DOFUS style
      backgroundImage: {
        // DOFUS uses solid colors primarily, minimal gradients
        'dark-atmosphere': 'linear-gradient(180deg, rgb(23, 20, 18) 0%, rgb(11, 25, 29) 100%)',
        'dofus-green-glow': 'radial-gradient(circle, rgba(151, 168, 0, 0.3) 0%, transparent 70%)',
        'success-glow': 'radial-gradient(circle, rgba(66, 179, 129, 0.3) 0%, transparent 70%)',
        'adventure-glow': 'radial-gradient(circle at 50% 0%, hsla(40, 95%, 55%, 0.35) 0%, transparent 70%)',
        'teal-glow-radial': 'radial-gradient(circle at 50% 0%, hsla(167, 78%, 45%, 0.3) 0%, transparent 70%)',
      },

      // Keyframe animations - Essential DOFUS-style animations only
      keyframes: {
        // Gentle float (keep for subtle card effects)
        "float-gentle": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },

        // Fade in (essential)
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },

        // Slide up (essential for modals/notifications)
        "slide-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          },
        },

        // Scale in (essential for popups)
        "scale-in": {
          "0%": {
            opacity: "0",
            transform: "scale(0.95)"
          },
          "100%": {
            opacity: "1",
            transform: "scale(1)"
          },
        },

        // Standard animations
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },

        // ── Zylen v2 micro-interactions ──
        "glow-pulse": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.7" },
        },
        "sparkle": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.6)", opacity: "0.6" },
        },
        "sparkle-rise": {
          "0%": { transform: "translateY(6px) scale(0.6)", opacity: "0" },
          "40%": { opacity: "1" },
          "100%": { transform: "translateY(-14px) scale(1)", opacity: "0" },
        },
        "shimmer-gold": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "60%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "ring-fill": {
          "0%": { strokeDashoffset: "var(--ring-circumference, 283)" },
          "100%": { strokeDashoffset: "var(--ring-offset, 0)" },
        },

        // ── Chat micro-interactions ──
        "typing-dot": {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "30%": { transform: "translateY(-4px)", opacity: "1" },
        },
        "message-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },

      // Animation classes - Simplified for DOFUS aesthetic
      animation: {
        "float-gentle": "float-gentle 4s ease-in-out infinite",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "glow-pulse": "glow-pulse 2.4s ease-in-out infinite",
        "sparkle": "sparkle 1.4s ease-in-out infinite",
        "sparkle-rise": "sparkle-rise 1.6s ease-out infinite",
        "shimmer-gold": "shimmer-gold 2.5s linear infinite",
        "pop-in": "pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "typing-dot": "typing-dot 1.4s ease-in-out infinite",
        "message-in": "message-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [
    // Small utility plugin for animation-delays & evolved radius helpers
    function ({ addUtilities }) {
      addUtilities({
        '.animation-delay-100': { 'animation-delay': '100ms' },
        '.animation-delay-200': { 'animation-delay': '200ms' },
        '.animation-delay-300': { 'animation-delay': '300ms' },
        '.animation-delay-500': { 'animation-delay': '500ms' },
      });
    },
  ],
}
