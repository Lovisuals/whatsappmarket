/**
 * CampusMarket NG - Core Theme & Glue Logic
 * Version: 8.2 (Harden Build)
 */

// 1. SUPABASE INITIALIZATION
// This provides a single source of truth for your database connection.
window.initSupabase = function() {
    const SUPABASE_URL = 'https://vimovhpweucvperwhyzi.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbW92aHB3ZXVjdnBlcndoeXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODE1MjUsImV4cCI6MjA4MjA1NzUyNX0.u6KDe2RCwCcWdClkGA61q2LORqzmPU0KNP9tZTZfOfc';

    // Safety check: ensure the SDK script is actually loaded in <head>
    if (typeof window.supabase === 'undefined') {
        console.error("CRITICAL: Supabase SDK not found. Ensure <script src='...supabase-js@2'></script> is in your <head>.");
        return null;
    }

    try {
        return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (err) {
        console.error("CRITICAL: Failed to create Supabase client:", err);
        return null;
    }
};

// 2. TAILWIND DESIGN SYSTEM CONFIGURATION
// These settings inject the WhatsApp Brand identity into Tailwind's utility classes.
if (window.tailwind) {
    window.tailwind.config = {
        theme: {
            extend: {
                colors: {
                    wa: {
                        teal: '#008069',    // WhatsApp Primary Teal
                        dark: '#075E54',    // WhatsApp Dark Header
                        light: '#25D366',   // WhatsApp Green (Action/Verify)
                        surface: '#FFFFFF', // Clean Cards
                        bg: '#E5E0DA',      // The iconic Chat Background Beige
                        bubble: '#DCF8C6'   // WhatsApp Outgoing Bubble Green
                    },
                    semantic: {
                        success: '#25D366',
                        warning: '#FFD166',
                        danger: '#EF4444',
                        muted: '#8696A0',   // WhatsApp Muted Text Grey
                        trust: '#0EA5E9'
                    }
                },
                fontFamily: {
                    ui: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                },
                borderRadius: {
                    'xl': '12px',
                    '2xl': '16px', // "Squircle" shape used in WA
                    '3xl': '24px',
                },
                boxShadow: {
                    'wa': '0 1px 0.5px rgba(11, 20, 26, 0.13)', // WhatsApp-style card shadow
                },
                keyframes: {
                    fadeIn: {
                        '0%': { opacity: '0', transform: 'translateY(10px)' },
                        '100%': { opacity: '1', transform: 'translateY(0)' }
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
} else {
    console.warn("Tailwind CDN not detected. UI components may lose styling.");
}

// 3. GLOBAL UI POLISH
// Auto-hide address bar on mobile and handle viewport height issues
window.addEventListener('load', () => {
    // Force a minor scroll to hide browser chrome on some mobile browsers
    setTimeout(() => window.scrollTo(0, 1), 100);
});
