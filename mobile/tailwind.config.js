/**
 * Zylen mobile — Tailwind config for NativeWind.
 *
 * Mirrors the web app's theme token contract (../tailwind.config.js): every
 * semantic color resolves through a CSS variable so the 6 runtime themes
 * (midnight/nous/ember/mono/cyberpunk/slate) restyle the whole app. On
 * native, the variables are provided at runtime by ThemeProvider via
 * nativewind's vars() — see src/theme/themeVars.ts.
 */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        // Body text uses the platform system font (Roboto on Android, SF on
        // iOS). Display/mono are loaded via expo-font in app/_layout.tsx.
        display: ['BebasNeue_400Regular'],
        mono: ['JetBrainsMono_400Regular'],
      },

      colors: {
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        overlay: 'hsl(var(--overlay) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          hover: 'hsl(var(--primary-hover) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },

        green: {
          50: 'hsl(76, 90%, 95%)',
          100: 'hsl(76, 85%, 90%)',
          200: 'hsl(76, 85%, 80%)',
          300: 'hsl(76, 85%, 70%)',
          400: 'hsl(76, 85%, 60%)',
          500: 'hsl(76, 85%, 52%)',
          600: 'hsl(76, 73%, 42%)',
          700: 'hsl(65, 100%, 33%)',
          800: 'hsl(65, 100%, 28%)',
          900: 'hsl(65, 100%, 23%)',
        },
        orange: {
          50: 'hsl(36, 100%, 95%)',
          100: 'hsl(36, 100%, 90%)',
          200: 'hsl(36, 100%, 80%)',
          300: 'hsl(36, 100%, 70%)',
          400: 'hsl(36, 100%, 60%)',
          500: 'hsl(36, 100%, 52%)',
          600: 'hsl(36, 98%, 49%)',
          700: 'hsl(36, 90%, 40%)',
          800: 'hsl(36, 85%, 35%)',
          900: 'hsl(36, 80%, 30%)',
        },
        blue: {
          50: 'hsl(210, 100%, 95%)',
          100: 'hsl(210, 100%, 90%)',
          200: 'hsl(210, 100%, 80%)',
          300: 'hsl(210, 100%, 70%)',
          400: 'hsl(210, 100%, 62%)',
          500: 'hsl(210, 100%, 60%)',
          600: 'hsl(210, 90%, 55%)',
          700: 'hsl(210, 80%, 50%)',
          800: 'hsl(210, 70%, 45%)',
          900: 'hsl(210, 60%, 40%)',
        },
        cyan: {
          50: 'hsl(186, 100%, 95%)',
          100: 'hsl(186, 90%, 85%)',
          200: 'hsl(186, 85%, 75%)',
          300: 'hsl(186, 80%, 65%)',
          400: 'hsl(186, 75%, 57%)',
          500: 'hsl(186, 63%, 53%)',
          600: 'hsl(186, 60%, 48%)',
          700: 'hsl(186, 55%, 43%)',
          800: 'hsl(186, 50%, 38%)',
          900: 'hsl(186, 45%, 33%)',
        },

        // Teal — primary ACTION color, themed via --accent-* ramp
        teal: {
          50: 'hsl(var(--accent-50) / <alpha-value>)',
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

        gold: {
          50: 'hsl(45, 100%, 96%)',
          100: 'hsl(45, 97%, 88%)',
          200: 'hsl(44, 96%, 77%)',
          300: 'hsl(42, 95%, 66%)',
          400: 'hsl(40, 95%, 58%)',
          500: 'hsl(38, 95%, 52%)',
          600: 'hsl(34, 92%, 46%)',
          700: 'hsl(30, 88%, 39%)',
          800: 'hsl(26, 82%, 33%)',
          900: 'hsl(24, 76%, 27%)',
        },

        // Charcoal — themed surfaces via --surface-* ramp
        charcoal: {
          DEFAULT: 'hsl(var(--surface-500) / <alpha-value>)',
          50: 'hsl(var(--surface-50) / <alpha-value>)',
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

        surface: {
          DEFAULT: 'hsl(var(--surface) / <alpha-value>)',
          elevated: 'hsl(var(--surface-elevated) / <alpha-value>)',
        },

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
          400: '#F7C948',
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
          500: 'rgb(217, 83, 79)',
          600: '#9B2C2C',
          700: '#742A2A',
          800: '#5F2121',
          900: '#4A1818',
        },
      },

      borderRadius: {
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [],
};
