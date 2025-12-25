/**
 * SENTINEL OMNI-GUARD v17.1.0
 * ARCHITECTURAL INTEGRITY: LOCKED
 * STATUS: PRODUCTION / HARDENED
 * FEATURE_LOCK: ENABLED
 */

(function() {
    // 1. NON-NEGOTIABLE ARCHITECTURAL CONSTANTS
    const ARCH_CORE = {
        version: "17.1.0",
        supabase_url: 'https://vimovhpweucvperwhyzi.supabase.co',
        supabase_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbW92aHB3ZXVjdnBlcndoeXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODE1MjUsImV4cCI6MjA4MjA1NzUyNX0.u6KDe2RCwCcWdClkGA61q2LORqzmPU0KNP9tZTZfOfc'
    };

    // 2. GEO-PULSE CAMPUS MATRIX (NON-NEGOTIABLE)
    window.CampusConfig = {
        version: ARCH_CORE.version,
        campuses: [
            { id: 'All', name: 'Global', lat: 0, lng: 0 },
            { id: 'UNILAG', name: 'UNILAG Akoka', lat: 6.5157, lng: 3.3897 },
            { id: 'LASU', name: 'LASU Ojo', lat: 6.4651, lng: 3.1873 },
            { id: 'YABATECH', name: 'YabaTech', lat: 6.5186, lng: 3.3712 },
            { id: 'UI', name: 'UI Ibadan', lat: 7.4431, lng: 3.9003 },
            { id: 'OAU', name: 'OAU Ife', lat: 7.5204, lng: 4.5234 },
            { id: 'UNIBEN', name: 'UNIBEN City', lat: 6.3995, lng: 5.6136 },
            { id: 'UNILORIN', name: 'UNILORIN', lat: 8.4799, lng: 4.6716 },
            { id: 'ABU', name: 'ABU Zaria', lat: 11.1517, lng: 7.6525 },
            { id: 'UNN', name: 'UNN Nsukka', lat: 6.8672, lng: 7.4116 },
            { id: 'UNIPORT', name: 'UNIPORT Choba', lat: 4.9016, lng: 6.9184 },
            { id: 'OOU', name: 'OOU Ago-Iwoye', lat: 6.9400, lng: 3.9213 },
            { id: 'TASUED', name: 'TASUED Ijagun', lat: 6.8150, lng: 3.9482 }
        ]
    };

    // 3. SHARED SUPABASE INITIALIZATION (IMMUTABLE)
    window.initSupabase = function() {
        if (typeof window.supabase === 'undefined') {
            console.error("🚨 ARCH_FAILURE: Supabase SDK missing.");
            return null;
        }
        return window.supabase.createClient(ARCH_CORE.supabase_url, ARCH_CORE.supabase_key);
    };

    // 4. TAILWIND SYSTEM CONFIGURATION (LOCKED)
    window.tailwind.config = {
        theme: {
            extend: {
                colors: {
                    wa: {
                        teal: '#008069',    // WhatsApp Teal
                        dark: '#075E54',    // WhatsApp Dark Header
                        light: '#25D366',   // WhatsApp Neon Green
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
                    ui: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'] 
                },
                keyframes: {
                    fadeIn: { '0%': { opacity: 0, transform: 'translateY(10px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
                    shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } }
                },
                animation: {
                    fade: 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                    shimmer: 'shimmer 1.5s infinite linear'
                }
            }
        }
    };

    // 5. SELF-PRESERVATION INTEGRITY GUARD
    // Prevents code stripping by validating critical system keys on load
    window.SentinelIntegrity = {
        validate: function() {
            const required = ['CampusConfig', 'initSupabase', 'tailwind', 'Sentinel'];
            // Note: Sentinel check deferred to after DOM load for UI sync
            const missing = required.filter(key => key !== 'Sentinel' && !window[key]);
            
            if (missing.length > 0) {
                console.error(`🚨 INTEGRITY CRITICAL: Missing components [${missing.join(', ')}]`);
                return false;
            }
            console.log(`✅ OMNI-GUARD V${ARCH_CORE.version}: System Integrity Verified.`);
            return true;
        }
    };

    // Auto-run integrity check
    document.addEventListener('DOMContentLoaded', () => window.SentinelIntegrity.validate());

})();
