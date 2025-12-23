// admin.js - V8.1 Production Command Center

const supabase = window.initSupabase();
let data = [];
let adHistory = [];
let currentLiveAd = "";

// 1. INITIALIZATION & SESSION CHECK
(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return location.href = 'login.html';

    // Verify if the user is in the 'admins' table
    const { data: admin } = await supabase.from('admins').select('id').eq('id', session.user.id).single();
    if (!admin) {
        alert("Unauthorized Access.");
        await supabase.auth.signOut();
        return location.href = 'login.html';
    }

    // Attach Event Listeners
    document.addEventListener('click', handleGlobalClicks);
    document.getElementById('searchInput').addEventListener('input', (e) => search(e.target.value));

    await Promise.all([loadData(), loadAdSystem()]);
    setupRealtime();
})();

// 2. EVENT DELEGATION (Handles all buttons in the table)
async function handleGlobalClicks(e) {
    const trigger = e.target.closest('[data-action]');
    if (!trigger) return;

    const action = trigger.dataset.action;
    const id = trigger.dataset.id;
    const payload = trigger.dataset.payload;

    switch (action) {
        case 'delete-product': deleteProduct(id); break;
        case 'toggle-verify': toggleVerify(id, payload === 'true'); break;
        case 'save-ad': saveNewAd(); break;
        case 'toggle-ad': toggleAd(id); break;
        case 'delete-ad': deleteAd(id); break;
        case 'logout': await supabase.auth.signOut(); location.href = 'login.html'; break;
    }
}

// 3. REAL-TIME MONITORING
function setupRealtime() {
    // Listen for new products
    supabase.channel('admin_feed').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
        if (payload.eventType === 'INSERT') {
            data.unshift(payload.new);
            playNotification();
        }
        renderTable();
    }).subscribe();
}

// 4. CORE ACTIONS
async function toggleVerify(id, currentStatus) {
    const { error } = await supabase.from('products').update({ is_master: !currentStatus }).eq('id', id);
    if (!error) {
        const item = data.find(i => i.id === id);
        if (item) item.is_master = !currentStatus;
        renderTable();
    }
}

async function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
        data = data.filter(i => i.id !== id);
        renderTable();
    }
}

// 5. ALERT SYSTEM (The V8.1 Ticker Controller)
async function toggleAd(id) {
    const ad = adHistory.find(a => a.id === id);
    const newText = (ad.content === currentLiveAd) ? "" : ad.content;
    
    // Update global settings
    await supabase.from('admin_settings').upsert({ key: 'global_alert', value: newText });
    currentLiveAd = newText;
    
    renderAdManager();
    updatePreviewBar(newText);
}

// 6. RENDER ENGINE
function renderTable() {
    const table = document.getElementById('tableBody');
    const term = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = data;
    if (term) {
        filtered = data.filter(i => i.title.toLowerCase().includes(term) || i.whatsapp_number.includes(term));
    }

    table.innerHTML = filtered.map(p => `
        <tr class="border-b hover:bg-gray-50 transition">
            <td class="p-3"><img src="${p.images?.[0] || p.image_url}" class="w-10 h-10 rounded object-cover"></td>
            <td class="p-3">
                <div class="font-bold text-xs">${p.title}</div>
                <div class="text-[10px] text-gray-400">${p.campus}</div>
            </td>
            <td class="p-3 text-xs font-mono">${p.whatsapp_number}</td>
            <td class="p-3">
                <button data-action="toggle-verify" data-id="${p.id}" data-payload="${p.is_master}" 
                    class="px-2 py-1 rounded text-[10px] font-bold ${p.is_master ? 'bg-wa-light text-white' : 'bg-gray-100 text-gray-400'}">
                    ${p.is_master ? 'VERIFIED' : 'PENDING'}
                </button>
            </td>
            <td class="p-3 text-right">
                <button data-action="delete-product" data-id="${p.id}" class="text-red-500 hover:scale-110 transition">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// Helpers
async function loadData() { 
    const { data: d } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    data = d || [];
    renderTable();
}

function updatePreviewBar(text) {
    // This uses the adaptive ticker logic we built for index.html
    const track = document.getElementById('adTrack');
    const bar = document.getElementById('livePreviewBar');
    if (text) {
        bar.classList.remove('hidden');
        const content = `<div class="marquee-item"><span>📢</span><span>${text}</span></div>`;
        track.innerHTML = content.repeat(6);
    } else {
        bar.classList.add('hidden');
    }
}
