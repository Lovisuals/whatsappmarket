// 1. SHARED SUPABASE INITIALIZATION (The "Glue")
// This allows index.html, admin.html, and login.html to share one connection logic.
window.initSupabase = function() {
    const SUPABASE_URL = 'https://vimovhpweucvperwhyzi.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbW92aHB3ZXVjdnBlcndoeXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODE1MjUsImV4cCI6MjA4MjA1NzUyNX0.u6KDe2RCwCcWdClkGA61q2LORqzmPU0KNP9tZTZfOfc';
    
    if (typeof window.supabase === 'undefined') {
        console.error("Supabase SDK is missing. Check your <head> tags.");
        return null;
    }
    
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
};

// 2. TAILWIND CONFIGURATION (The "Look")
// Defines your WhatsApp colors so you can use class="bg-wa-teal"
window.tailwind.config = {
  theme: {
    extend: {
      colors: {
        wa: {
          teal: '#008069',    // Primary Brand Color
          dark: '#075E54',    // Darker Headers
          light: '#25D366',   // Success/Action
          surface: '#FFFFFF', // Cards
          bg: '#E5E0DA'       // App Background
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
      // Animations are also handled in style.css, but this keeps Tailwind happy
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        shimmer: {
            '0%': { backgroundPosition: '-200% 0' },
            '100%': { backgroundPosition: '200% 0' }
        }
      },
      animation: {
        fade: 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        shimmer: 'shimmer 1.5s infinite linear'
      }
    }
  }
};
