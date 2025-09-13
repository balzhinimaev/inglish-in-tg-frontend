/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        telegram: {
          bg: 'var(--tg-theme-bg-color)',
          text: 'var(--tg-theme-text-color)',
          hint: 'var(--tg-theme-hint-color)',
          link: 'var(--tg-theme-link-color)',
          button: 'var(--tg-theme-button-color)',
          'button-text': 'var(--tg-theme-button-text-color)',
          'secondary-bg': 'var(--tg-theme-secondary-bg-color)',
          'card-bg': 'var(--tg-theme-card-bg-color)',
          'header-bg': 'var(--tg-theme-header-bg-color)',
          'accent-text': 'var(--tg-theme-accent-text-color)',
          'section-bg': 'var(--tg-theme-section-bg-color)',
          'section-header-text': 'var(--tg-theme-section-header-text-color)',
          'subtitle-text': 'var(--tg-theme-subtitle-text-color)',
          'destructive-text': 'var(--tg-theme-destructive-text-color)',
          accent: 'var(--tg-theme-accent-color)',
          'accent-secondary': 'var(--tg-theme-accent-secondary)',
          'accent-tertiary': 'var(--tg-theme-accent-tertiary)',
        },
        glass: {
          bg: 'var(--glass-bg)',
          border: 'var(--glass-border)',
        }
      },
      boxShadow: {
        'neumorphism-raised': 'var(--shadow-neumorphism-raised)',
        'neumorphism-pressed': 'var(--shadow-neumorphism-pressed)',
        'soft': 'var(--shadow-soft)',
        'glow': 'var(--shadow-glow)',
        'glow-hover': 'var(--shadow-glow-hover)',
      },
      backdropBlur: {
        'glass': '12px',
      },
      borderRadius: {
        'soft': '16px',
        'extra-soft': '20px',
        'ultra-soft': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glowPulse: {
          '0%': { boxShadow: '0 0 5px rgba(61, 220, 151, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(61, 220, 151, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
