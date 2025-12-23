tailwind.config = {
  theme: {
    extend: {
      colors: {
        wa: {
          teal: '#008069',   // Modern WhatsApp Teal
          dark: '#075E54',   // Header Darker
          light: '#25D366',  // Bright Green
          chat: '#E5E0DA',   // Chat Background
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
          muted: '#8696a0',
          trust: '#0EA5E9'
        }
      },
      fontFamily: {
        ui: ['Inter', 'system-ui', 'sans-serif']
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' }
        },
        cartMove: {
          '0%, 100%': { transform: 'translateX(0) rotate(0deg)' },
          '25%': { transform: 'translateX(5px) rotate(3deg)' },
          '75%': { transform: 'translateX(-5px) rotate(-3deg)' }
        }
      },
      animation: {
        fade: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        marquee: 'marquee 20s linear infinite',
        'cart-move': 'cartMove 3s ease-in-out infinite'
      }
    }
  }
}
