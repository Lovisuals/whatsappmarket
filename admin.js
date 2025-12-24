/**
 * CampusMarket NG - Master Admin Logic
 * Version: 14.0 (Error-Free Hardened Build)
 * Date: December 24, 2025
 */

const supabase = window.initSupabase?.() || null;
let allProducts = [];

// ====================== 1. THE SECURITY GATE ======================
// This self-executing function runs before anything else to prevent unauthorized UI exposure
(async function enforceSecurity() {
    if (!supabase) {
        console.error("Supabase not initialized. Check theme.js and API keys.");
        return;
    }

    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            window.location.replace('login.html');
            return;
        }

        // Secondary Whitelist Check
        const { data: admin, error: adminError } = await supabase
            .from('admins')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle();

        if (adminError || !admin) {
            console.warn("Unauthorized UID detected. Terminating session.");
            await supabase.auth.signOut();
            window.location.replace('login.html');
            return;
        }

        // Access Granted
        console.log("Admin verified. Initializing Command Center...");
        initializeApp();

    } catch (err) {
        console.error("Critical Security Gate Failure:", err);
        window.location.replace('login.html');
    }
})();

// ====================== 2. INITIALIZATION ======================
async function initializeApp() {
    // UI Setup
    setupEventListeners();
    
    // Data Setup
    await loadAdminData();
    setupRealtimeSubscription();
}

function setupEventListeners() {
    const searchInput = document.getElementById('adminSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => renderAdminTable());
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// ====================== 3. DATA PERSISTENCE ======================
async function loadAdminData() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allProducts = data || [];
        renderAdminTable();
        updateDashboardMetrics();
        await syncTickerInput();

    } catch (err) {
        console.error("Failed to load marketplace data:", err);
        const tableBody = document.getElementById('tableBody');
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="4" class="p-10 text-center text-red-500 font-bold">Error loading listings. Please refresh.</td></tr>`;
        }
    }
}

// ====================== 4. UI RENDERING ======================
function renderAdminTable() {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;

    const searchTerm = document.getElementById('adminSearch')?.value.toLowerCase().trim() || "";
    
    const filtered = allProducts.filter(p => 
        p.title.toLowerCase().includes(searchTerm) ||
        (p.whatsapp_number || "").includes(searchTerm) ||
        (p.campus || "").toLowerCase().includes(searchTerm)
    );

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="p-20 text-center text-gray-400">No items found matching "${searchTerm}"</td></tr>`;
        return;
    }

    tableBody.innerHTML = filtered.map(p => {
        const firstImg = p.images?.[0] || 'https://placehold.co/60x60?text=No+Img';
        return `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors animate-fade">
                <td class="p-4">
                    <div class="flex items-center gap-3">
                        <img src="${firstImg}" class="w-12 h-12 rounded-lg object-cover shadow-sm border" alt="Item">
                        <div>
                            <p class="font-bold text-sm text-gray-800 line-clamp-1">${p.title}</p>
                            <p class="text-[10px] text-gray-400 uppercase font-black tracking-widest">${p.campus || 'General'}</p>
                        </div>
                    </div>
                </td>
                <td class="p-4">
                    <div class="text-[11px] font-mono text-gray-600">${p.whatsapp_number}</div>
                    <div class="text-[9px] text-wa-teal font-extrabold uppercase mt-0.5">${p.item_type}</div>
                </td>
                <td class="p-4 text-center">
                    <button onclick="handleVerification('${p.id}', ${p.is_master})" 
                        class="tap px-4 py-1.5 rounded-full text-[10px] font-bold shadow-sm transition-all
                        ${p.is_master ? 'bg-wa-light text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}">
                        ${p.is_master ? 'VERIFIED ✓' : 'PENDING'}
                    </button>
                </td>
                <td class="p-4 text-right">
                    <button onclick="handleDeletion('${p.id}')" class="tap p-2 text-gray-300 hover:text-red-500 transition-colors">
                        🗑️
                    </button>
                </td>
            </tr>`;
    }).join('');
}

// ====================== 5. MANAGEMENT ACTIONS ======================
window.handleVerification = async (id, currentStatus) => {
    const { error } = await supabase
        .from('products')
        .update({ is_master: !currentStatus })
        .eq('id', id);

    if (error) alert("Verification update failed: " + error.message);
    else {
        playStatusSound('success');
        loadAdminData();
    }
};

window.handleDeletion = async (id) => {
    if (!confirm("Are you sure? This item will be removed from the public feed permanently.")) return;

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) alert("Delete failed: " + error.message);
    else {
        playStatusSound('delete');
        loadAdminData();
    }
};

// ====================== 6. TICKER & METRICS ======================
async function syncTickerInput() {
    const { data } = await supabase.from('admin_settings').select('value').eq('key', 'global_alert').single();
    const input = document.getElementById('alertInput');
    if (input && data) input.value = data.value || '';
}

window.updateGlobalAlert = async () => {
    const text = document.getElementById('alertInput')?.value.trim() || "";
    const { error } = await supabase
        .from('admin_settings')
        .upsert({ key: 'global_alert', value: text });

    if (error) alert("Update failed");
    else alert("Global Ticker Updated!");
};

function updateDashboardMetrics() {
    const total = allProducts.length;
    const verified = allProducts.filter(p => p.is_master).length;

    const totalEl = document.getElementById('stat-total');
    const verifiedEl = document.getElementById('stat-verified');
    
    if (totalEl) totalEl.innerText = total;
    if (verifiedEl) verifiedEl.innerText = verified;
}

// ====================== 7. UTILS & REALTIME ======================
async function handleLogout() {
    await supabase.auth.signOut();
    window.location.replace('login.html');
}

function playStatusSound(type) {
    const audio = new Audio(type === 'success' 
        ? 'https://assets.mixkit.co/sfx/preview/mixkit-positive-interface-beep-221.mp3' 
        : 'https://assets.mixkit.co/sfx/preview/mixkit-trash-alert-2605.mp3');
    audio.volume = 0.2;
    audio.play().catch(() => {});
}

function setupRealtimeSubscription() {
    supabase.channel('admin_master_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
            loadAdminData();
        })
        .subscribe();
}
