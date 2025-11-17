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
        // Base semantic colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
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

        // Dark Charcoal (Main backgrounds) - DOFUS
        charcoal: {
          DEFAULT: 'rgb(23, 20, 18)',
          50: '#F5F5F6',
          100: '#E8E9EA',
          200: '#D1D3D5',
          300: '#A9ACAF',
          400: '#6B6F73',
          500: 'rgb(23, 20, 18)',  // DOFUS charcoal
          600: 'rgb(46, 42, 39)',  // DOFUS dark brown
          700: 'rgb(71, 65, 61)',  // DOFUS gray-brown
          800: '#0E1011',
          900: 'rgb(11, 25, 29)',  // DOFUS deep teal
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
      },

      // Background gradients - Minimal DOFUS style
      backgroundImage: {
        // DOFUS uses solid colors primarily, minimal gradients
        'dark-atmosphere': 'linear-gradient(180deg, rgb(23, 20, 18) 0%, rgb(11, 25, 29) 100%)',
        'dofus-green-glow': 'radial-gradient(circle, rgba(151, 168, 0, 0.3) 0%, transparent 70%)',
        'success-glow': 'radial-gradient(circle, rgba(66, 179, 129, 0.3) 0%, transparent 70%)',
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
      },
    },
  },
  plugins: [],
}
