/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          purple: '#8B5CF6',
          pink: '#EC4899',
          blue: '#3B82F6',
          yellow: '#FCD34D',
        }
      },
      backgroundImage: {
        'gradient-main': 'linear-gradient(135deg, #FDF2F8 0%, #F3E8FF 50%, #DBEAFE 100%)',
        'gradient-button': 'linear-gradient(90deg, #8B5CF6, #EC4899)',
        'gradient-card': 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(139, 92, 246, 0.3)',
        'card': '0 20px 60px rgba(139, 92, 246, 0.15)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      }
    },
  },
  plugins: [],
}
