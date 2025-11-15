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
      // Font families - Dark Fantasy
      fontFamily: {
        sans: ['"Inter"', '"Nunito"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        display: ['"Space Grotesk"', '"Inter"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        fantasy: ['"Cinzel"', '"Cormorant"', 'serif'],
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

        // Warm gold palette (from CSS variables)
        gold: {
          50: 'hsl(48, 100%, 94%)',
          100: 'hsl(48, 100%, 90%)',
          200: 'hsl(48, 100%, 80%)',
          300: 'hsl(48, 100%, 70%)',
          400: 'hsl(48, 100%, 60%)',
          500: 'hsl(45, 100%, 68%)',
          600: 'hsl(36, 100%, 64%)',
          700: 'hsl(29, 100%, 58%)',
          800: 'hsl(45, 100%, 48%)',
          900: 'hsl(45, 100%, 46%)',
        },

        // Teal palette (from CSS variables)
        teal: {
          50: 'hsl(174, 75%, 94%)',
          100: 'hsl(174, 69%, 81%)',
          200: 'hsl(174, 62%, 68%)',
          300: 'hsl(174, 56%, 56%)',
          400: 'hsl(174, 62%, 44%)',
          500: 'hsl(174, 55%, 41%)',
          600: 'hsl(174, 100%, 27%)',
          700: 'hsl(174, 100%, 24%)',
          800: 'hsl(174, 100%, 20%)',
          900: 'hsl(174, 100%, 13%)',
        },

        // Soft parchment palette (from CSS variables)
        parchment: {
          50: 'hsl(40, 100%, 99%)',
          100: 'hsl(40, 67%, 95%)',
          200: 'hsl(40, 59%, 91%)',
          300: 'hsl(40, 48%, 86%)',
        },

        // Dark Charcoal (Main backgrounds)
        charcoal: {
          50: '#F5F5F6',
          100: '#E8E9EA',
          200: '#D1D3D5',
          300: '#A9ACAF',
          400: '#6B6F73',
          500: '#1A1E1F',
          600: '#161A1B',
          700: '#121516',
          800: '#0E1011',
          900: '#0A0C0D',
        },

        // Neon Green (Primary accent)
        neon: {
          50: '#F4FEF0',
          100: '#E6FCDC',
          200: '#D4FABD',
          300: '#BBFF6A',  // Soft lime
          400: '#9BEA63',  // Primary neon green
          500: '#7FD854',
          600: '#66C042',
          700: '#4FA332',
          800: '#3D8527',
          900: '#2E6B1D',
        },

        // Deep Forest Green
        forest: {
          50: '#F0F7F4',
          100: '#D9EDE3',
          200: '#B3DBC7',
          300: '#8CC9AB',
          400: '#66B78F',
          500: '#3D9970',
          600: '#327D5C',
          700: '#276148',
          800: '#1C4534',
          900: '#112920',
        },

        // Fantasy Steel/Silver
        steel: {
          50: '#F8F9FA',
          100: '#E9ECEF',
          200: '#DEE2E6',
          300: '#CED4DA',
          400: '#ADB5BD',
          500: '#8B949E',
          600: '#6C757D',
          700: '#495057',
          800: '#343A40',
          900: '#212529',
        },

        // Warm Pale (Portrait headers)
        pale: {
          50: '#FFF9F5',
          100: '#FFF3EB',
          200: '#FFE7D6',
          300: '#FFD4B8',
          400: '#FFC299',
          500: '#FFAD7A',
          600: '#E69565',
          700: '#CC7E50',
          800: '#B3663B',
          900: '#994F26',
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
          500: '#C53030',
          600: '#9B2C2C',
          700: '#742A2A',
          800: '#5F2121',
          900: '#4A1818',
        },

        // Mystical accents
        mystic: {
          purple: '#8B5CF6',
          cyan: '#22D3EE',
          amber: '#F59E0B',
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

      // Box shadows - Dark Fantasy
      boxShadow: {
        'soft': '0 10px 20px rgba(0, 0, 0, 0.3)',
        'soft-md': '0 15px 25px rgba(0, 0, 0, 0.4)',
        'soft-lg': '0 20px 30px rgba(0, 0, 0, 0.5)',
        'soft-xl': '0 25px 40px rgba(0, 0, 0, 0.6)',
        'neon-glow': '0 0 20px rgba(155, 234, 99, 0.5), 0 0 40px rgba(155, 234, 99, 0.3)',
        'neon-glow-strong': '0 0 30px rgba(155, 234, 99, 0.7), 0 0 60px rgba(155, 234, 99, 0.4)',
        'forest-glow': '0 0 20px rgba(61, 153, 112, 0.4), 0 0 40px rgba(61, 153, 112, 0.2)',
        'amber-glow': '0 0 20px rgba(247, 201, 72, 0.4)',
        'glow-gold': '0 0 20px rgba(255, 200, 87, 0.5), 0 0 40px rgba(255, 200, 87, 0.3)',
        'glow-teal': '0 0 20px rgba(42, 183, 169, 0.5), 0 0 40px rgba(42, 183, 169, 0.3)',
        'glow-success': '0 0 20px rgba(66, 179, 129, 0.5), 0 0 40px rgba(66, 179, 129, 0.3)',
        'isometric': '4px 4px 0 rgba(255, 200, 87, 0.3), 8px 8px 0 rgba(42, 183, 169, 0.2)',
        'isometric-hover': '6px 6px 0 rgba(255, 200, 87, 0.4), 12px 12px 0 rgba(42, 183, 169, 0.3)',
        'dramatic': '0 20px 50px rgba(0, 0, 0, 0.5), 0 10px 20px rgba(0, 0, 0, 0.3)',
        'inner-neon': 'inset 0 0 20px rgba(155, 234, 99, 0.2)',
        'inner-forest': 'inset 0 0 20px rgba(61, 153, 112, 0.15)',
        'rim-neon': 'inset -1px -1px 0 rgba(155, 234, 99, 0.6)',
        'rim-steel': 'inset -1px -1px 0 rgba(139, 148, 158, 0.4)',
      },

      // Background gradients
      backgroundImage: {
        'gradient-hero-bg': 'linear-gradient(135deg, #FFFDFB 0%, #FBF5E8 25%, #E0F7F5 75%, #B2EBE6 100%)',
        'gradient-golden-hour': 'linear-gradient(135deg, #FFC857 0%, #FFB74D 50%, #FFA726 100%)',
        'gradient-warm-teal': 'linear-gradient(135deg, #FFC857 0%, #26A69A 100%)',
        'gradient-sunrise': 'linear-gradient(135deg, #FFE699 0%, #FFA726 50%, #FF8A65 100%)',
        'dark-atmosphere': 'linear-gradient(180deg, #1A1E1F 0%, #0E1011 50%, #0A0C0D 100%)',
        'forest-depth': 'linear-gradient(135deg, #1A1E1F 0%, #1C4534 100%)',
        'charcoal-vignette': 'radial-gradient(circle at center, #1A1E1F 0%, #0A0C0D 100%)',
        'neon-glow': 'linear-gradient(135deg, #9BEA63 0%, #BBFF6A 100%)',
        'forest-glow': 'linear-gradient(135deg, #3D9970 0%, #66B78F 100%)',
        'steel-shine': 'linear-gradient(135deg, #8B949E 0%, #CED4DA 100%)',
        'cta-glow': 'radial-gradient(circle, rgba(155, 234, 99, 0.4) 0%, transparent 70%)',
        'success-glow': 'radial-gradient(circle, rgba(63, 190, 115, 0.3) 0%, transparent 70%)',
        'warning-glow': 'radial-gradient(circle, rgba(247, 201, 72, 0.3) 0%, transparent 70%)',
        'neon-rim-light': 'linear-gradient(135deg, transparent 0%, #9BEA63 100%)',
        'steel-rim-light': 'linear-gradient(135deg, transparent 0%, #8B949E 100%)',
        'portrait-vignette': 'radial-gradient(ellipse at center, transparent 0%, rgba(26, 30, 31, 0.8) 100%)',
      },

      // Keyframe animations
      keyframes: {
        // Neon glow pulse
        "neon-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(155, 234, 99, 0.5), 0 0 40px rgba(155, 234, 99, 0.3)"
          },
          "50%": {
            boxShadow: "0 0 30px rgba(155, 234, 99, 0.7), 0 0 60px rgba(155, 234, 99, 0.4)"
          },
        },

        // Gentle breathing glow
        "glow-breath": {
          "0%, 100%": {
            opacity: "0.8",
            transform: "scale(1)"
          },
          "50%": {
            opacity: "1",
            transform: "scale(1.05)"
          },
        },

        // Shimmer neon effect
        "shimmer-neon": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },

        // Gentle float
        "float-gentle": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },

        // Medium float
        "float-medium": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },

        // Energetic float
        "float-energetic": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-16px)" },
        },

        // Glow pulse
        "glow-pulse": {
          "0%, 100%": {
            opacity: "0.8",
            filter: "brightness(1)"
          },
          "50%": {
            opacity: "1",
            filter: "brightness(1.2)"
          },
        },

        // Shimmer gold effect
        "shimmer-gold": {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },

        // Sparkle rise
        "sparkle-rise": {
          "0%": {
            transform: "translateY(0) scale(0)",
            opacity: "0"
          },
          "50%": {
            opacity: "1"
          },
          "100%": {
            transform: "translateY(-20px) scale(1)",
            opacity: "0"
          },
        },

        // Sparkle
        "sparkle": {
          "0%, 100%": {
            opacity: "0",
            transform: "scale(0)"
          },
          "50%": {
            opacity: "1",
            transform: "scale(1)"
          },
        },

        // Fire flicker
        "fire-flicker": {
          "0%, 100%": {
            opacity: "1",
            transform: "scale(1)"
          },
          "25%": {
            opacity: "0.9",
            transform: "scale(1.05)"
          },
          "50%": {
            opacity: "1",
            transform: "scale(0.95)"
          },
          "75%": {
            opacity: "0.85",
            transform: "scale(1.1)"
          },
        },

        // Level up burst
        "level-up-burst": {
          "0%": {
            transform: "scale(0.8)",
            opacity: "0"
          },
          "50%": {
            transform: "scale(1.2)",
            opacity: "1"
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1"
          },
        },

        // Fade in
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },

        // Slide up
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

        // Scale in
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

        // Existing animations
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

      // Animation classes
      animation: {
        "neon-pulse": "neon-pulse 2s ease-in-out infinite",
        "glow-breath": "glow-breath 3s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "shimmer-neon": "shimmer-neon 3s linear infinite",
        "shimmer-gold": "shimmer-gold 3s linear infinite",
        "float-gentle": "float-gentle 4s ease-in-out infinite",
        "float-medium": "float-medium 3.5s ease-in-out infinite",
        "float-energetic": "float-energetic 3s ease-in-out infinite",
        "sparkle-rise": "sparkle-rise 1.5s ease-out",
        "sparkle": "sparkle 1s ease-in-out infinite",
        "fire-flicker": "fire-flicker 1.5s ease-in-out infinite",
        "level-up-burst": "level-up-burst 0.6s ease-out",
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
