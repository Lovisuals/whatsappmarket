/**
 * CampusMarket NG - Master Theme & Sentinel V9.2
 * Status: HARDENED / SYNCED / GITHUB-READY
 */

window.CampusConfig = {
    version: "9.2.0",
    repo: "whatsappmarket",
    proxyUrl: 'https://vimovhpweucvperwhyzi.supabase.co/functions/v1/github-proxy',
    campuses: [
        { id: 'All', name: 'All', logo: '🌍' },
        { id: 'UNILAG', name: 'UNILAG', logo: 'https://ui-avatars.com/api/?name=U+L&background=fff&color=008069&bold=true' },
        { id: 'UI', name: 'UI Ibadan', logo: 'https://ui-avatars.com/api/?name=U+I&background=fff&color=008069&bold=true' },
        { id: 'OAU', name: 'OAU Ife', logo: 'https://ui-avatars.com/api/?name=O+A&background=fff&color=008069&bold=true' },
        { id: 'UNIBEN', name: 'UNIBEN', logo: 'https://ui-avatars.com/api/?name=U+B&background=fff&color=008069&bold=true' }
    ],
    branding: { teal: '#008069', light: '#25D366', bg: '#E5E0DA' }
};

window.CampusWatchdog = {
    logs: [],
    report: function(type, msg) {
        const anomaly = { type, message: msg, url: window.location.href, time: new Date().toISOString() };
        this.logs.push(anomaly);
        console.warn(`🚨 Sentinel: ${type} -> ${msg}`);
        if (this.logs.length >= 3) this.sync();
    },
    sync: async function() {
        try {
            await fetch(window.CampusConfig.proxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event_type: "production_anomaly", payload: this.logs })
            });
            this.logs = [];
        } catch (e) { console.error("Sentinel Sync Failed"); }
    }
};

window.initSupabase = function() {
    const URL = 'https://vimovhpweucvperwhyzi.supabase.co';
    const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbW92aHB3ZXVjdnBlcndoeXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODE1MjUsImV4cCI6MjA4MjA1NzUyNX0.u6KDe2RCwCcWdClkGA61q2LORqzmPU0KNP9tZTZfOfc';
    if (!window.supabase) {
        window.CampusWatchdog.report('SDK_MISSING', 'Supabase script failed to load.');
        return null;
    }
    return window.supabase.createClient(URL, KEY);
};

if (window.tailwind) {
    window.tailwind.config = {
        theme: {
            extend: {
                colors: {
                    wa: { teal: '#008069', dark: '#075E54', light: '#25D366', bg: '#E5E0DA' }
                },
                fontFamily: { ui: ['Inter', 'sans-serif'] },
                boxShadow: { 'wa': '0 1px 0.5px rgba(11, 20, 26, 0.13)' },
                animation: { 
                    fade: 'fadeIn 0.4s ease forwards',
                    pop: 'popUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                },
                keyframes: { 
                    fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
                    popUp: { '0%': { opacity: 0, transform: 'scale(0.95) translateY(40px)' }, '100%': { opacity: 1, transform: 'scale(1) translateY(0)' } }
                }
            }
        }
    };
}
