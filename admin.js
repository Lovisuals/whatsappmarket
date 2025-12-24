/**
 * CampusMarket NG - Admin Dashboard Logic
 * Version: 15.0 (Complete, Secure & Realtime – December 24, 2025)
 */

const supabase = window.initSupabase?.() || null;
let allProducts = [];

// ====================== AUTH ENFORCEMENT GATE ======================
(async () => {
    if (!supabase) {
        alert("Connection failed. Redirecting to login...");
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

        // Access granted
        console.log("Admin authenticated:", session.user.email);
        initAdmin();
    } catch (err) {
        console.error("Auth gate error:", err);
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    }
})();

// ====================== DASHBOARD INITIALIZATION ======================
async function initAdmin() {
    await loadProducts();
    setupRealtime();

    // Search listener
    const searchInput = document.getElementById('adminSearch');
    if (searchInput) searchInput.addEventListener('input', renderTable);
}

// ====================== LOAD PRODUCTS & TICKER ======================
async function loadProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Load error:", error);
        document.getElementById('tableBody').innerHTML = `
            <tr><td colspan="4" class="p-20 text-center text-red-600">
                Failed to load listings<br><span class="text-sm">${error.message}</span>
            </td></tr>`;
        return;
    }

    allProducts = data || [];
    renderTable();
    updateStats();
    await loadTicker();
}

// ====================== RENDER TABLE ======================
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
                    ${term ? 'No matching listings' : 'Marketplace is empty'}
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(p => {
        const img = p.images?.[0] || 'https://placehold.co/80x80?text=No+Img';
        return `
            <tr class="border-b hover:bg-gray-50 transition">
                <td class="p-4 flex items-center gap-3">
                    <img src="${img}" class="w-12 h-12 object-cover rounded-lg shadow-sm" alt="${p.title}">
                    <div>
                        <span class="font-bold text-sm">${p.title}</span>
                        <p class="text-xs text-gray-500 mt-1">${p.campus || 'General'}</p>
                    </div>
                </td>
                <td class="p-4 text-xs font-mono">${p.whatsapp_number || '—'}</td>
                <td class="p-4 text-center">
                    <button onclick="toggleVerify('${p.id}', ${p.is_master})" 
                        class="px-4 py-1.5 rounded-full text-[10px] font-bold ${p.is_master ? 'bg-wa-teal text-white' : 'bg-gray-100 text-gray-400'}">
                        ${p.is_master ? 'VERIFIED' : 'PENDING'}
                    </button>
                </td>
                <td class="p-4 text-right">
                    <button onclick="deleteItem('${p.id}')" class="text-gray-300 hover:text-red-500 transition text-2xl">🗑️</button>
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
        await loadProducts();
    }
}

async function deleteItem(id) {
    if (!confirm("Permanently delete this listing?")) return;

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) {
        alert("Delete failed: " + error.message);
    } else {
        await loadProducts();
    }
}

// ====================== GLOBAL TICKER ======================
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

window.updateGlobalAlert = async () => {
    const value = document.getElementById('alertInput').value.trim();
    const { error } = await supabase
        .from('admin_settings')
        .upsert({ key: 'global_alert', value }, { onConflict: 'key' });

    if (error) {
        alert("Ticker update failed: " + error.message);
    } else {
        alert("Ticker updated! Live on main site.");
    }
};

// ====================== STATS ======================
function updateStats() {
    const total = allProducts.length;
    const verified = allProducts.filter(p => p.is_master).length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-verified').textContent = verified;
}

// ====================== LOGOUT ======================
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Logout error:", error);
    window.location.href = 'login.html';
});

// ====================== REALTIME ======================
function setupRealtime() {
    supabase.channel('admin_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
            console.log('Realtime change:', payload);
            loadProducts();
        })
        .subscribe();
}
