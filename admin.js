/**
 * CampusMarket NG - Admin Command Logic
 * Version: 10.0 (Complete & Production-Ready)
 * Date: December 24, 2025
 */

const supabase = window.initSupabase?.() || null;
let allProducts = [];

// ====================== 1. INITIALIZATION ======================
(async function init() {
    if (!supabase) {
        alert("Supabase connection failed. Admin panel disabled.");
        console.error("Supabase failed to initialize.");
        return;
    }

    // Optional Auth Protection (uncomment when ready for production)
    // const { data: { session } } = await supabase.auth.getSession();
    // if (!session) {
    //     window.location.href = 'login.html';
    //     return;
    // }

    await loadAdminData();
    setupRealtime();

    // Search listener
    const searchInput = document.getElementById('adminSearch');
    if (searchInput) searchInput.addEventListener('input', renderAdminTable);
})();

// ====================== 2. DATA FETCHING ======================
async function loadAdminData() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Fetch error:", error);
        window.CampusWatchdog?.reportAnomaly('ADMIN_FETCH_ERR', error.message);

        const tableBody = document.getElementById('tableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="p-8 text-center text-red-600 font-medium">
                        Failed to load listings<br>
                        <span class="text-sm text-gray-500">${error.message}</span>
                    </td>
                </tr>`;
        }
        return;
    }

    allProducts = data || [];
    renderAdminTable();
    updateMetrics();
    await loadAdSystem();
}

// ====================== 3. TABLE RENDERING ======================
function renderAdminTable() {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;

    const term = (document.getElementById('adminSearch')?.value || '').toLowerCase().trim();
    const filtered = allProducts.filter(p =>
        p.title.toLowerCase().includes(term) ||
        (p.whatsapp_number || '').includes(term) ||
        (p.campus || '').toLowerCase().includes(term)
    );

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="p-12 text-center text-gray-400">
                    ${term ? 'No matching listings found.' : 'No listings yet. Marketplace is empty.'}
                </td>
            </tr>`;
        return;
    }

    tableBody.innerHTML = filtered.map(p => {
        const firstImg = p.images && p.images.length > 0 ? p.images[0] : 'https://placehold.co/60x60?text=No+Img';
        return `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="p-4">
                    <div class="flex items-center gap-3">
                        <img src="${firstImg}" class="w-12 h-12 rounded-lg object-cover shadow-sm" alt="Item">
                        <div>
                            <p class="font-bold text-sm text-gray-800 line-clamp-2">${p.title}</p>
                            <p class="text-xs text-gray-500 uppercase font-medium mt-1">${p.campus || 'General'}</p>
                        </div>
                    </div>
                </td>
                <td class="p-4 align-top">
                    <div class="text-sm font-mono text-gray-700">${p.whatsapp_number || '—'}</div>
                    <div class="text-xs text-wa-teal font-bold uppercase mt-1">${p.item_type || 'Physical'}</div>
                </td>
                <td class="p-4 align-top text-center">
                    <button onclick="toggleVerify('${p.id}', ${p.is_master})"
                        class="tap px-4 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all
                        ${p.is_master 
                            ? 'bg-wa-light text-white hover:bg-wa-teal' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}">
                        ${p.is_master ? 'VERIFIED ✓' : 'PENDING'}
                    </button>
                </td>
                <td class="p-4 align-top text-right">
                    <button onclick="deleteProduct('${p.id}')"
                        class="tap p-2 text-gray-400 hover:text-red-600 transition-colors text-lg">
                        🗑️
                    </button>
                </td>
            </tr>`;
    }).join('');
}

// ====================== 4. ACTIONS ======================
async function toggleVerify(id, currentStatus) {
    const newStatus = !currentStatus;
    const { error } = await supabase
        .from('products')
        .update({ is_master: newStatus })
        .eq('id', id);

    if (error) {
        alert("Verification update failed: " + error.message);
    } else {
        playNotification('success');
        await loadAdminData();
    }
}

async function deleteProduct(id) {
    if (!confirm("Permanently delete this listing?\nThis action cannot be undone.")) {
        return;
    }

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) {
        alert("Delete failed: " + error.message);
    } else {
        playNotification('delete');
        await loadAdminData();
    }
}

// ====================== 5. GLOBAL TICKER (Alert Manager) ======================
async function loadAdSystem() {
    const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'global_alert')
        .single();

    const input = document.getElementById('alertInput');
    if (input) {
        input.value = (data && !error) ? (data.value || '') : '';
    }
}

async function updateGlobalAlert() {
    const text = (document.getElementById('alertInput')?.value || '').trim();
    const { error } = await supabase
        .from('admin_settings')
        .upsert({ key: 'global_alert', value: text }, { onConflict: 'key' });

    if (error) {
        alert("Failed to update ticker: " + error.message);
    } else {
        alert("Global ticker updated successfully!\nIt will appear on the marketplace shortly.");
        playNotification('success');
    }
}

// ====================== 6. METRICS & UTILS ======================
function updateMetrics() {
    const total = allProducts.length;
    const verified = allProducts.filter(p => p.is_master).length;

    const totalEl = document.getElementById('stat-total');
    const verifiedEl = document.getElementById('stat-verified');

    if (totalEl) totalEl.textContent = total;
    if (verifiedEl) verifiedEl.textContent = verified;
}

function playNotification(type = 'success') {
    const sounds = {
        success: 'https://assets.mixkit.co/sfx/preview/mixkit-positive-interface-beep-221.mp3',
        delete:  'https://assets.mixkit.co/sfx/preview/mixkit-trash-alert-2605.mp3'
    };

    const audio = new Audio(sounds[type] || sounds.success);
    audio.volume = 0.3;
    audio.play().catch(() => {
        // Silent fail if browser blocks autoplay
    });
}

// ====================== 7. REALTIME UPDATES ======================
function setupRealtime() {
    if (!supabase) return;

    supabase.channel('admin_realtime')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'products'
        }, payload => {
            console.log('Realtime update:', payload);
            loadAdminData();
        })
        .subscribe();
}
