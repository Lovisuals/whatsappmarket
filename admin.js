/**
 * CampusMarket NG - Admin Dashboard Logic
 * Version: 11.0 (Complete Rewrite – December 24, 2025)
 */

const supabase = window.initSupabase?.() || null;
let allProducts = [];

// ====================== INITIALIZATION ======================
(async function init() {
    if (!supabase) {
        alert("Supabase connection failed. Admin disabled.");
        return;
    }

    // Optional: Enforce login (uncomment for production)
    // const { data: { session } } = await supabase.auth.getSession();
    // if (!session) {
    //     window.location.href = 'login.html';
    //     return;
    // }

    await loadAdminData();
    setupRealtime();

    // Search
    document.getElementById('adminSearch')?.addEventListener('input', renderTable);
})();

// ====================== DATA & RENDERING ======================
async function loadAdminData() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        document.getElementById('tableBody').innerHTML = `<tr><td colspan="4" class="p-8 text-center text-red-600">Load failed: ${error.message}</td></tr>`;
        return;
    }

    allProducts = data || [];
    renderTable();
    updateMetrics();
    await loadTicker();
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    const term = document.getElementById('adminSearch')?.value.toLowerCase() || '';

    const filtered = allProducts.filter(p =>
        p.title.toLowerCase().includes(term) ||
        (p.whatsapp_number || '').includes(term) ||
        (p.campus || '').toLowerCase().includes(term)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-12 text-center text-gray-400">${term ? 'No matches' : 'No listings yet'}</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(p => {
        const img = p.images?.[0] || 'https://placehold.co/60x60?text=IMG';
        return `
            <tr class="hover:bg-gray-50 transition">
                <td class="p-4">
                    <div class="flex items-center gap-4">
                        <img src="${img}" class="w-12 h-12 rounded-lg object-cover shadow">
                        <div>
                            <p class="font-bold text-sm">${p.title}</p>
                            <p class="text-xs text-gray-500 uppercase">${p.campus || 'General'}</p>
                        </div>
                    </div>
                </td>
                <td class="p-4">
                    <p class="font-mono text-sm">${p.whatsapp_number || '—'}</p>
                    <p class="text-xs text-wa-teal font-bold uppercase">${p.item_type}</p>
                </td>
                <td class="p-4 text-center">
                    <button onclick="toggleVerify('${p.id}', ${p.is_master})"
                        class="px-5 py-2 rounded-full text-xs font-bold shadow transition ${p.is_master ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}">
                        ${p.is_master ? 'VERIFIED' : 'PENDING'}
                    </button>
                </td>
                <td class="p-4 text-right">
                    <button onclick="deleteProduct('${p.id}')"
                        class="tap text-2xl text-gray-400 hover:text-red-600 transition">🗑️</button>
                </td>
            </tr>`;
    }).join('');
}

// ====================== ACTIONS ======================
async function toggleVerify(id, current) {
    const { error } = await supabase
        .from('products')
        .update({ is_master: !current })
        .eq('id', id);

    if (error) alert("Failed: " + error.message);
    else await loadAdminData();
}

async function deleteProduct(id) {
    if (!confirm("Delete this listing permanently?")) return;

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) alert("Delete failed: " + error.message);
    else await loadAdminData();
}

// ====================== TICKER ======================
async function loadTicker() {
    const { data } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'global_alert')
        .single();

    if (data) document.getElementById('alertInput').value = data.value || '';
}

window.updateGlobalAlert = async () => {
    const value = document.getElementById('alertInput').value.trim();
    const { error } = await supabase
        .from('admin_settings')
        .upsert({ key: 'global_alert', value }, { onConflict: 'key' });

    if (error) alert("Update failed: " + error.message);
    else alert("Ticker updated! Visible on main site.");
};

// ====================== METRICS ======================
function updateMetrics() {
    const total = allProducts.length;
    const verified = allProducts.filter(p => p.is_master).length;
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-verified').textContent = verified;
}

// ====================== LOGOUT ======================
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) alert("Logout error: " + error.message);
    else window.location.href = 'login.html';
});

// ====================== REALTIME ======================
function setupRealtime() {
    supabase.channel('admin_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
            loadAdminData();
        })
        .subscribe();
}
