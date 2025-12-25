/**
 * CampusMarket Theme & Config v2.0
 * Clean, lightweight, and functional
 * Date: 2025-12-25
 */

(() => {
    "use strict";

    // 1. Supabase Client Initialization
    window.initSupabase = function () {
        const SUPABASE_URL = 'https://vimovhpweucvperwhyzi.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbW92aHB3ZXVjdnBlcndoeXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODE1MjUsImV4cCI6MjA4MjA1NzUyNX0.u6KDe2RCwCcWdClkGA61q2LORqzmPU0KNP9tZTZfOfc';

        if (typeof window.supabase === 'undefined') {
            console.error("Supabase SDK not loaded. Include the script in <head>.");
            return null;
        }

        return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    };

    // 2. Campus Geolocation Matrix (for future proximity sorting)
    window.CampusConfig = {
        campuses: [
            { id: 'All', name: 'Global', lat: 0, lng: 0 },
            { id: 'UNILAG', name: 'UNILAG Akoka', lat: 6.5157, lng: 3.3897 },
            { id: 'LASU', name: 'LASU Ojo', lat: 6.4651, lng: 3.1873 },
            { id: 'YABATECH', name: 'YabaTech', lat: 6.5186, lng: 3.3712 },
            { id: 'UI', name: 'UI Ibadan', lat: 7.4431, lng: 3.9003 },
            { id: 'OAU', name: 'OAU Ife', lat: 7.5204, lng: 4.5234 },
            { id: 'UNIBEN', name: 'UNIBEN', lat: 6.3995, lng: 5.6136 },
            { id: 'UNILORIN', name: 'UNILORIN', lat: 8.4799, lng: 4.6716 },
            { id: 'ABU', name: 'ABU Zaria', lat: 11.1517, lng: 7.6525 },
            { id: 'UNN', name: 'UNN Nsukka', lat: 6.8672, lng: 7.4116 },
            { id: 'UNIPORT', name: 'UNIPORT Choba', lat: 4.9016, lng: 6.9184 },
            { id: 'OOU', name: 'OOU Ago-Iwoye', lat: 6.9400, lng: 3.9213 },
            { id: 'TASUED', name: 'TASUED Ijagun', lat: 6.8150, lng: 3.9482 }
        ]
    };

    // 3. Tailwind Color Extensions (for reference — only works if using build step)
    // If using Tailwind CDN, these are symbolic only.
    window.tailwindConfigReference = {
        theme: {
            extend: {
                colors: {
                    wa: {
                        teal: '#008069',
                        dark: '#075E54',
                        light: '#25D366',
                        surface: '#FFFFFF',
                        bg: '#E5E0DA'
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
                }
            }
        }
    };

    // 4. Global Alert/Ticker Loader (useful for announcements)
    window.loadGlobalAlert = async function (supabase) {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('admin_settings')
            .select('value')
            .eq('key', 'global_alert')
            .maybeSingle();

        if (error && error.code !== 'PGRST116') console.error('Alert load error:', error);
        return data?.value || null;
    };

    // Optional: Basic readiness log
    document.addEventListener('DOMContentLoaded', () => {
        console.log('%cCampusMarket Theme Loaded ✅', 'color: #25D366; font-weight: bold;');
    });
})();