tailwind.config = {
  theme: {
    extend: {
      colors: {
        wa: {
          teal: '#008069',
          dark: '#075E54',
          light: '#25D366',
          chat: '#E5E0DA',
          surface: '#FFFFFF',
          accent: '#34B7F1'
        },
        campus: {
          blue: '#003366',
          gold: '#FFD700'
        },
        semantic: {
          success: '#25D366',
          warning: '#FFD166',
          danger: '#EF4444',
          muted: '#9CA3AF',
          trust: '#0EA5E9'
        }
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem'
      },
      fontFamily: {
        ui: ['Inter', 'system-ui', 'sans-serif']
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        marquee: {
          '0%': { transform: 'translateX(100%)' }, /* Adjusted start point for smooth entry */
          '100%': { transform: 'translateX(-100%)' }
        },
        cartMove: {
          '0%, 100%': { transform: 'translateX(0) rotate(0deg)' },
          '25%': { transform: 'translateX(4px) rotate(2deg)' },
          '75%': { transform: 'translateX(-4px) rotate(-2deg)' }
        }
      },
      animation: {
        fade: 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        marquee: 'marquee 20s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
        'cart-move': 'cartMove 2s ease-in-out infinite'
      }
    }
  }
}
