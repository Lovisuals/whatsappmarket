const supabase = window.initSupabase();
let data = [];

// 1. SESSION CHECK & INIT
(async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        // For testing, we log a warning instead of a redirect
        console.warn("No active admin session. Please login.");
        // window.location.href = 'login.html'; 
    } else {
        document.getElementById('adminEmail').innerText = session.user.email;
    }

    await loadData();
    setupRealtime();
    
    document.getElementById('adminSearch').addEventListener('input', renderTable);
})();

// 2. DATA LOADING
async function loadData() {
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return window.CampusWatchdog?.report('DB_ERROR', error.message);
    
    data = products || [];
    updateMetrics();
    renderTable();
}

// 3. TABLE RENDERING (Patched & Complete)
function renderTable() {
    const table = document.getElementById('tableBody');
    const term = document.getElementById('adminSearch').value.toLowerCase();
    
    const filtered = data.filter(p => 
        p.title.toLowerCase().includes(term) || 
        (p.whatsapp_number && p.whatsapp_number.includes(term))
    );

    table.innerHTML = filtered.map(p => `
        <tr class="border-b border-gray-50 hover:bg-gray-50/80 transition group">
            <td class="p-4 flex items-center gap-3">
                <img src="${p.images?.[0] || 'https://placehold.co/50'}" class="w-10 h-10 rounded-lg object-cover shadow-sm">
                <div>
                    <div class="font-bold text-gray-800 text-xs">${p.title}</div>
                    <div class="text-[9px] text-gray-400 uppercase">${p.campus}</div>
                </div>
            </td>
            <td class="p-4">
                <div class="text-[10px] font-mono text-gray-600">${p.whatsapp_number}</div>
                <div class="text-[9px] text-wa-teal font-bold uppercase">${p.item_type}</div>
            </td>
            <td class="p-4">
                <button onclick="toggleVerify('${p.id}', ${p.is_master})" 
                    class="px-3 py-1 rounded-full text-[9px] font-bold transition ${p.is_master ? 'bg-wa-light text-white shadow-md' : 'bg-gray-100 text-gray-400'}">
                    ${p.is_master ? 'VERIFIED' : 'PENDING'}
                </button>
            </td>
            <td class="p-4 text-right">
                <button onclick="deleteProduct('${p.id}')" class="text-gray-300 hover:text-red-500 transition p-2">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
}

// 4. CORE ACTIONS
async function toggleVerify(id, current) {
    const { error } = await supabase.from('products').update({ is_master: !current }).eq('id', id);
    if (!error) loadData();
}

async function deleteProduct(id) {
    if (!confirm("Permanently delete this listing?")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) loadData();
}

async function updateGlobalAlert() {
    const val = document.getElementById('alertInput').value;
    const { error } = await supabase.from('admin_settings').upsert({ key: 'global_alert', value: val });
    if (!error) alert("Ticker Updated!");
}

function updateMetrics() {
    document.getElementById('stat-total').innerText = data.length;
    document.getElementById('stat-verified').innerText = data.filter(p => p.is_master).length;
    // Watchdog anomaly count can be pulled from window.CampusWatchdog.logs.length
}

function setupRealtime() {
    supabase.channel('admin_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => loadData())
        .subscribe();
}
