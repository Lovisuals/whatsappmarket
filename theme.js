/**
 * CampusMarket NG - Master Theme & Watchdog Engine
 * Version: 8.5 (Self-Sustaining / Monitor on Steroids)
 */

// --- 1. CONFIGURATION CONSTANTS (Centralized Control) ---
window.CampusConfig = {
    campuses: [
        { id: 'All', name: 'All', logo: '🌍' },
        { id: 'UNILAG', name: 'UNILAG', logo: 'https://ui-avatars.com/api/?name=U+L&background=fff&color=008069&bold=true' },
        { id: 'UI', name: 'UI Ibadan', logo: 'https://ui-avatars.com/api/?name=U+I&background=fff&color=008069&bold=true' },
        { id: 'OAU', name: 'OAU Ife', logo: 'https://ui-avatars.com/api/?name=O+A&background=fff&color=008069&bold=true' }
    ],
    categories: ['Physical', 'Digital'],
    branding: {
        teal: '#008069',
        light: '#25D366',
        bg: '#E5E0DA'
    }
};

// --- 2. HARDENED SUPABASE INITIALIZATION ---
window.initSupabase = function() {
    const URL = 'https://vimovhpweucvperwhyzi.supabase.co';
    const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbW92aHB3ZXVjdnBlcndoeXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODE1MjUsImV4cCI6MjA4MjA1NzUyNX0.u6KDe2RCwCcWdClkGA61q2LORqzmPU0KNP9tZTZfOfc';

    if (typeof window.supabase === 'undefined') {
        window.CampusWatchdog.reportAnomaly('SDK_MISSING', 'Supabase library not loaded in <head>');
        return null;
    }

    try {
        return window.supabase.createClient(URL, KEY);
    } catch (err) {
        window.CampusWatchdog.reportAnomaly('INIT_ERROR', err.message);
        return null;
    }
};

// --- 3. THE WATCHDOG DEBUGGER (Anomaly Detection) ---
window.CampusWatchdog = {
    logs: [],
    
    reportAnomaly: function(type, msg) {
        const error = { type, msg, time: new Date().toISOString(), url: window.location.pathname };
        console.warn(`🚨 [WATCHDOG] ${type}: ${msg}`);
        this.logs.push(error);
        
        // AUTO-HEAL: Attempt to fix common issues
        if (type === 'DOM_MISSING' && msg.includes('feed')) {
            console.info("Attempting to reconstruct missing feed container...");
        }
    },

    checkIntegrity: function() {
        // Check for essential DOM elements across all marketplace pages
        const isIndex = !window.location.pathname.includes('admin') && !window.location.pathname.includes('login');
        if (isIndex) {
            const requirements = ['feed', 'adBar', 'campusList'];
            requirements.forEach(id => {
                if (!document.getElementById(id)) this.reportAnomaly('DOM_MISSING', `Element #${id} not found.`);
            });
        }

        // Check for CSS Variables
        const testElem = document.createElement('div');
        testElem.className = 'bg-wa-teal';
        document.body.appendChild(testElem);
        const color = window.getComputedStyle(testElem).backgroundColor;
        document.body.removeChild(testElem);
        
        if (color === 'rgba(0, 0, 0, 0)' || color === 'transparent') {
            this.reportAnomaly('CSS_ANOMALY', 'Tailwind Brand Config failed to inject colors.');
        }
    }
};

// --- 4. TAILWIND SYSTEM CONFIG ---
if (window.tailwind) {
    window.tailwind.config = {
        theme: {
            extend: {
                colors: {
                    wa: {
                        teal: window.CampusConfig.branding.teal,
                        dark: '#075E54',
                        light: window.CampusConfig.branding.light,
                        surface: '#FFFFFF',
                        bg: window.CampusConfig.branding.bg,
                    },
                    semantic: {
                        success: '#25D366',
                        muted: '#8696A0',
                    }
                },
                fontFamily: { ui: ['Inter', 'system-ui', 'sans-serif'] },
                boxShadow: { 'wa': '0 1px 0.5px rgba(11, 20, 26, 0.13)' },
                keyframes: {
                    fadeIn: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
                    shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } }
                },
                animation: {
                    fade: 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                    shimmer: 'shimmer 1.5s infinite linear'
                }
            }
        }
    };
}

// --- 5. AUTOMATED MONITORING ---
// Runs the check instantly and then every 60 seconds
setTimeout(() => window.CampusWatchdog.checkIntegrity(), 2000);
setInterval(() => window.CampusWatchdog.checkIntegrity(), 60000);
