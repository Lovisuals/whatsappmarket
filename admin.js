/**
 * CampusMarket NG - Admin Dashboard Logic
 * Version: 13.0 (Complete & Final – December 24, 2025)
 * Features: Secure gate, realtime products, metrics (including blacklisted), live ticker update,
 *           search, verify/delete, logout with feedback
 */

const supabase = window.initSupabase?.() || null;
let allProducts = [];

// ====================== ADMIN ENFORCEMENT GATE ======================
(async () => {
    if (!supabase) {
        alert("Connection failed. Redirecting to login.");
        window.location.href = 'login.html';
        return;
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            window.location.href = 'login.html';
            return;
        }

        const { data: adminData, error } = await supabase
            .from('admins')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle();

        if (error || !adminData) {
            await supabase.auth.signOut();
            window.location.href = 'login.html';
            return;
        }

        console.log("Admin access granted:", session.user.email);
        initDashboard();
    } catch (err) {
        console.error("Auth gate error:", err);
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    }
})();

// ====================== DASHBOARD INITIALIZATION ======================
async function initDashboard() {
    await loadAdminData();
    setupRealtime();

    // Search
    document.getElementById('adminSearch')?.addEventListener('input', renderTable);
}

// ====================== DATA LOADING ======================
async function loadAdminData() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Products load error:", error);
        document.getElementById('tableBody').innerHTML = `
            <tr><td colspan="4" class="p-20 text-center text-red-600">
                Failed to load listings<br><span class="text-sm">${error.message}</span>
            </td></tr>`;
        return;
    }

    allProducts = data || [];
    renderTable();
    updateMetrics();
    await loadTicker();
}

// ====================== TABLE RENDERING ======================
function renderTable() {
    const tbody = document.getElementById('tableBody');
    const term = (document.getElementById('adminSearch')?.value || '').toLowerCase().trim();

    let filtered = allProducts;
    if (term) {
        filtered = allProducts.filter(p =>
            p.title.toLowerCase().includes(term) ||
            (p.whatsapp_number || '').includes(term) ||
            (p.campus || '').toLowerCase().includes(term)
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="p-20 text-center text-gray-400 text-lg">
                    ${term ? 'No matching listings found' : 'Marketplace is currently empty'}
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(p => {
        const img = p.images?.[0] || 'https://placehold.co/80x80?text=No+Img';
        return `
            <tr class="hover:bg-gray-50 transition">
                <td class="p-6">
                    <div class="flex items-center gap-4">
                        <img src="${img}" class="w-16 h-16 rounded-xl object-cover shadow-lg" alt="${p.title}">
                        <div>
                            <p class="font-bold text-base">${p.title}</p>
                            <p class="text-sm text-gray-500 uppercase mt-1">${p.campus || 'General'}</p>
                        </div>
                    </div>
                </td>
                <td class="p-6">
                    <p class="font-mono text-base">${p.whatsapp_number || '—'}</p>
                    <p class="text-sm text-wa-teal font-bold uppercase mt-1">${p.item_type}</p>
                </td>
                <td class="p-6 text-center">
                    <button onclick="toggleVerify('${p.id}', ${p.is_master})"
                        class="px-6 py-2 rounded-full text-sm font-bold shadow-lg transition ${p.is_master ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}">
                        ${p.is_master ? 'VERIFIED ✓' : 'PENDING'}
                    </button>
                </td>
                <td class="p-6 text-right">
                    <button onclick="deleteProduct('${p.id}')"
                        class="tap text-3xl text-gray-400 hover:text-red-600 transition">🗑️</button>
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

    if (error) {
        alert("Verification failed: " + error.message);
    } else {
        await loadAdminData();
    }
}

async function deleteProduct(id) {
    if (!confirm("Permanently delete this listing? This cannot be undone.")) return;

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) {
        alert("Delete failed: " + error.message);
    } else {
        await loadAdminData();
    }
}

// ====================== GLOBAL TICKER (Live & Updatable) ======================
async function loadTicker() {
    const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'global_alert')
        .single();

    if (!error && data) {
        document.getElementById('alertInput').value = data.value || '';
    }
}

async function updateGlobalAlert() {
    const value = document.getElementById('alertInput').value.trim();
    const btn = event.target;
    const origText = btn.textContent;
    btn.textContent = 'UPDATING...';
    btn.disabled = true;

    const { error } = await supabase
        .from('admin_settings')
        .upsert({ key: 'global_alert', value }, { onConflict: 'key' });

    if (error) {
        alert("Ticker update failed: " + error.message);
    } else {
        alert("Ticker updated successfully! Live on main site.");
    }

    btn.textContent = origText;
    btn.disabled = false;
}

// Make function global for onclick
window.updateGlobalAlert = updateGlobalAlert;

// ====================== METRICS (Including Blacklisted) ======================
async function updateMetrics() {
    const total = allProducts.length;
    const verified = allProducts.filter(p => p.is_master).length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-verified').textContent = verified;

    // Blacklisted count
    const { count, error } = await supabase
        .from('blacklist')
        .select('*', { count: 'exact', head: true });

    document.getElementById('stat-blacklisted').textContent = error ? '—' : (count || 0);
}

// ====================== LOGOUT (Working with Feedback) ======================
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('logoutBtn');
    const origText = btn.textContent;
    btn.textContent = 'LOGGING OUT...';
    btn.disabled = true;

    const { error } = await supabase.auth.signOut();

    if (error) {
        alert("Logout failed: " + error.message);
    }

    btn.textContent = origText;
    btn.disabled = false;

    window.location.href = 'login.html';
});

// ====================== REALTIME (Live Updates) ======================
function setupRealtime() {
    supabase.channel('admin_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
            loadAdminData();
        })
        .subscribe();
}
