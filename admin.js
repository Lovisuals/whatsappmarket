/**
 * CampusMarket NG - Admin Dashboard JS
 * Version: 21.0 (December 24, 2025)
 * Fully consistent, bootstrap first admin, realtime, error handling
 */

const supabase = window.initSupabase?.() || null;
let allProducts = [];
let adminChannel = null;

const authSection = document.getElementById('authSection');
const dashboardSection = document.getElementById('dashboardSection');

// ====================== SESSION CHECK / BOOTSTRAP ======================
(async () => {
    if (!supabase) {
        showError("Supabase connection failed.");
        return;
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        // Check if any admin exists
        const { data: existingAdmins } = await supabase.from('admins').select('id').limit(1);

        if (!existingAdmins || existingAdmins.length === 0) {
            // First login bootstrap → make current user admin
            const { error: insertError } = await supabase
                .from('admins')
                .insert({ id: session.user.id });
            if (insertError) {
                await supabase.auth.signOut();
                showError("Admin bootstrap failed.");
                return;
            }
            console.warn("BOOTSTRAP ADMIN CREATED");
        }

        // Verify current user is admin
        const { data: adminData } = await supabase
            .from('admins')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle();

        if (adminData) {
            showDashboard();
        } else {
            await supabase.auth.signOut();
        }
    }
})();

// ====================== LOGIN ======================
document.getElementById('loginForm').onsubmit = async (e) => {
    e.preventDefault();

    const btn = document.getElementById('loginBtn');
    btn.innerHTML = '<div class="spinner mx-auto"></div>';
    btn.disabled = true;
    hideError();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        showError(error.message || "Invalid credentials");
        btn.innerHTML = '<span>VERIFY & ENTER</span>';
        btn.disabled = false;
        return;
    }

    // First-admin bootstrap if needed
    const { data: existingAdmins } = await supabase.from('admins').select('id').limit(1);
    if (!existingAdmins || existingAdmins.length === 0) {
        const { error: insertError } = await supabase
            .from('admins')
            .insert({ id: data.user.id });
        if (insertError) {
            await supabase.auth.signOut();
            showError("Admin bootstrap failed.");
            btn.innerHTML = '<span>VERIFY & ENTER</span>';
            btn.disabled = false;
            return;
        }
        console.warn("BOOTSTRAP ADMIN CREATED");
    }

    // Verify current user is admin
    const { data: adminData } = await supabase
        .from('admins')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

    if (!adminData) {
        await supabase.auth.signOut();
        showError("Access Denied: Not authorized");
        btn.innerHTML = '<span>VERIFY & ENTER</span>';
        btn.disabled = false;
        return;
    }

    showDashboard();
    btn.innerHTML = '<span>VERIFY & ENTER</span>';
    btn.disabled = false;
};

// ====================== DASHBOARD TOGGLE ======================
function showDashboard() {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    loadData();
    setupRealtime();
}

// ====================== ERROR HANDLING ======================
function showError(msg) {
    const div = document.getElementById('errorDiv');
    div.textContent = msg;
    div.classList.remove('hidden');
    document.querySelector('#authSection .bg-white').classList.add('animate-shake');
    setTimeout(() => document.querySelector('#authSection .bg-white').classList.remove('animate-shake'), 600);
}

function hideError() {
    document.getElementById('errorDiv').classList.add('hidden');
}

// ====================== LOGOUT ======================
document.getElementById('logoutBtn').addEventListener('click', async () => {
    if (adminChannel) {
        await supabase.removeChannel(adminChannel);
        adminChannel = null;
    }
    await supabase.auth.signOut();
    authSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    hideError();
});

// ====================== LOAD DATA ======================
async function loadData() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    allProducts = data || [];
    renderTable();
    updateMetrics();

    const { data: ticker } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'global_alert')
        .single();
    if (ticker) document.getElementById('alertInput').value = ticker.value || '';
}

// ====================== RENDER TABLE ======================
function renderTable() {
    const tbody = document.getElementById('tableBody');

    if (!allProducts.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-20 text-center text-gray-400">Marketplace is empty</td></tr>';
        return;
    }

    tbody.innerHTML = allProducts.map(p => `
        <tr class="border-t">
            <td class="p-4 flex items-center gap-3">
                <img src="${p.images?.[0] || 'https://placehold.co/80x80'}" class="w-10 h-10 object-cover rounded-lg">
                <span class="font-bold text-xs">${p.title}</span>
            </td>
            <td class="p-4 text-xs font-mono">${p.whatsapp_number || '—'}</td>
            <td class="p-4 text-center">
                <button onclick="toggleVerify('${p.id}', ${p.is_master})" class="px-4 py-1.5 rounded-full text-[9px] font-bold ${p.is_master ? 'bg-wa-teal text-white' : 'bg-gray-100 text-gray-400'}">
                    ${p.is_master ? 'VERIFIED' : 'PENDING'}
                </button>
            </td>
            <td class="p-4 text-right">
                <button onclick="deleteItem('${p.id}')" class="text-gray-300 hover:text-red-500">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// ====================== ACTIONS ======================
async function toggleVerify(id, current) {
    const { error } = await supabase.from('products').update({ is_master: !current }).eq('id', id);
    if (error) {
        alert("Update failed: " + error.message);
        return;
    }
    loadData();
}

async function deleteItem(id) {
    if (!confirm("Delete permanently?")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
        alert("Delete failed: " + error.message);
        return;
    }
    loadData();
}

// ====================== TICKER ======================
async function updateTicker() {
    const value = document.getElementById('alertInput').value.trim();
    const { error } = await supabase.from('admin_settings').upsert({ key: 'global_alert', value }, { onConflict: 'key' });
    if (error) {
        alert("Ticker update failed: " + error.message);
    } else {
        alert("Ticker updated successfully!");
    }
}

// ====================== METRICS ======================
function updateMetrics() {
    document.getElementById('stat-total').textContent = allProducts.length;
    document.getElementById('stat-verified').textContent = allProducts.filter(p => p.is_master).length;
}

// ====================== REALTIME ======================
function setupRealtime() {
    if (adminChannel) return;

    adminChannel = supabase.channel('admin_live');
    adminChannel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => loadData())
        .subscribe();
}
