/**
 * CampusMarket NG - Master Theme & Sentinel V9.4
 * Status: ELITE / HARDENED / PRODUCTION
 */

window.CampusConfig = {
    version: "9.4.0",
    repo: "campusmarket-ng",
    campuses: [
        { id: 'All', name: 'All Campuses', logo: '🌍' },
        { id: 'UNILAG', name: 'UNILAG', logo: 'https://ui-avatars.com/api/?name=UNILAG&background=fff&color=008069&bold=true' },
        { id: 'UI', name: 'UI Ibadan', logo: 'https://ui-avatars.com/api/?name=UI&background=fff&color=008069&bold=true' },
        { id: 'OAU', name: 'OAU Ife', logo: 'https://ui-avatars.com/api/?name=OAU&background=fff&color=008069&bold=true' },
        { id: 'UNIBEN', name: 'UNIBEN', logo: 'https://ui-avatars.com/api/?name=UNIBEN&background=fff&color=008069&bold=true' }
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
        // Proxy endpoint for GitHub issue reporting (configure in Supabase Edge Functions)
        try {
            await fetch('https://vimovhpweucvperwhyzi.supabase.co/functions/v1/github-proxy', {
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
    
    if (typeof supabase === 'undefined') {
        window.CampusWatchdog?.report('SDK_MISSING', 'Supabase CDN failed');
        return null;
    }
    
    const client = supabase.createClient(URL, KEY);
    window.supabase = client;
    return client;
};

console.log(`✅ CampusMarket NG V${window.CampusConfig.version} Sentinel Elite Ready – December 24, 2025`);
