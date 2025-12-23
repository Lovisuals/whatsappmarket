/**
 * CampusMarket NG - Core Theme & Glue Logic
 * Version: 8.3 (Harden Build)
 */

// 1. SUPABASE INITIALIZATION
// This provides a single, reliable connection for index.html, admin.html, and login.html.
window.initSupabase = function() {
    const SUPABASE_URL = 'https://vimovhpweucvperwhyzi.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbW92aHB3ZXVjdnBlcndoeXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODE1MjUsImV4cCI6MjA4MjA1NzUyNX0.u6KDe2RCwCcWdClkGA61q2LORqzmPU0KNP9tZTZfOfc';

    // Verify SDK availability to prevent "Uncaught ReferenceError"
    if (typeof window.supabase === 'undefined') {
        console.error("Supabase SDK is missing. Please check your <head> script tags.");
        return null;
    }

    try {
        return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (err) {
        console.error("Failed to initialize Supabase:", err);
        return null;
    }
};

// 2. TAILWIND SYSTEM CONFIGURATION
// Injects the WhatsApp Brand DNA directly into Tailwind utility classes.
if (window.tailwind) {
    window.tailwind.config = {
        theme: {
            extend: {
                colors: {
                    wa: {
                        teal: '#008069',    // Primary Teal
                        dark: '#075E54',    // Header Dark Green
                        light: '#25D366',   // WhatsApp Action Green
                        surface: '#FFFFFF', // Card Background
                        bg: '#E5E0DA',      // Classic Doodle Background Beige
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
                boxShadow: {
                    'wa': '0 1px 0.5px rgba(11, 20, 26, 0.13)', // WhatsApp bubble shadow
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
}
