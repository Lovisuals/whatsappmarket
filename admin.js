// admin.js - V5 (Stable & Bug-Free)

// 0. SAFETY CHECK
if (typeof window.supabase === 'undefined') console.error("CRITICAL: Supabase SDK not loaded.");

const SUPABASE_URL = 'https://vimovhpweucvperwhyzi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbW92aHB3ZXVjdnBlcndoeXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODE1MjUsImV4cCI6MjA4MjA1NzUyNX0.u6KDe2RCwCcWdClkGA61q2LORqzmPU0KNP9tZTZfOfc';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let data = [];
let adHistory = [];
let currentLiveAd = "";

// 1. INIT
(async () => {
    // Check Session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return location.href = 'login.html';

    // Check Admin Whitelist
    const { data: admin } = await supabase.from('admins').select('id').eq('id', session.user.id).single();
    if (!admin) {
        alert("Unauthorized."); await supabase.auth.signOut(); return location.href = 'login.html';
    }

    // Attach Listeners
    document.addEventListener('click', handleGlobalClicks);
    document.getElementById('searchInput').addEventListener('input', (e) => search(e.target.value));

    // Load Data
    await Promise.all([loadData(), loadAdSystem()]);
    setupRealtime();
})();

// 2. EVENT DELEGATION (The "Brain")
async function handleGlobalClicks(e) {
    const trigger = e.target.closest('[data-action]');
    if (!trigger) return;

    // Stop bubbles for modal clicks
    if (trigger.dataset.action === "close-modal" && e.target !== trigger && trigger.id.includes('Modal')) {
       // Allow closing only if clicking the backdrop, not the child
       return; 
    }

    const action = trigger.dataset.action;
    const id = trigger.dataset.id;
    const payload = trigger.dataset.payload;

    switch (action) {
        // --- AD SYSTEM ---
        case 'save-ad': saveNewAd(); break;
        case 'toggle-ad': toggleAd(id); break;
        case 'delete-ad': deleteAd(id); break;

        // --- PRODUCTS ---
        case 'toggle-verify': toggleVerify(id, payload === 'true'); break;
        case 'ban-user': ban(payload); break;
        case 'delete-product': deleteProduct(id); break;
        
        // --- NEW: SAFE GALLERY OPENER ---
        case 'open-gallery':
            try {
                // Safely parse the array stored in the data attribute
                const images = JSON.parse(payload);
                openGallery(images);
            } catch (err) {
                console.error("Gallery Error:", err);
            }
            break;

        // --- ADMIN TOOLS ---
        case 'view-audit': viewAuditLogs(); break;
        case 'view-blacklist': viewBlacklist(); break;
        case 'unban-user': unban(payload); break;
        case 'logout': await supabase.auth.signOut(); location.href = 'login.html'; break;
        case 'close-modal': closeAllModals(); break;
    }
}

// 3. REALTIME
function setupRealtime() {
    supabase.channel('admin_products').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, p => {
        if (p.eventType === 'INSERT') { data.unshift(p.new); playPing(); }
        if (p.eventType === 'DELETE') { data = data.filter(i => i.id !== p.old.id); }
        if (p.eventType === 'UPDATE') { const idx = data.findIndex(i => i.id === p.new.id); if (idx !== -1) data[idx] = p.new; }
        render(data); updateStats();
    }).subscribe();

    supabase.channel('admin_ads').on('postgres_changes', { event: '*', schema: 'public', table: 'admin_settings' }, p => {
        if (p.new && p.new.key === 'global_alert') { currentLiveAd = p.new.value; renderAdManager(); updatePreviewBar(currentLiveAd); }
    }).subscribe();
}

// 4. LOGIC
async function loadAdSystem() {
    const { data: live } = await supabase.from('admin_settings').select('value').eq('key', 'global_alert').single();
    currentLiveAd = live ? live.value : ""; updatePreviewBar(currentLiveAd);
    const { data: hist } = await supabase.from('ad_history').select('*').order('created_at', { ascending: false });
    adHistory = hist || []; renderAdManager();
}

function updatePreviewBar(text) {
    const bar = document.getElementById('livePreviewBar'); const txt = document.getElementById('adText');
    if (text && text.trim() !== "") { bar.classList.remove('hidden'); txt.innerText = text; } else { bar.classList.add('hidden'); }
}

function renderAdManager() {
    const ind = document.getElementById('liveIndicator');
    if (currentLiveAd && currentLiveAd.trim() !== "") { ind.className = "text-[10px] bg-semantic-success text-white px-2 py-1 rounded font-bold uppercase animate-pulse"; ind.innerText = "● LIVE ON SITE"; } 
    else { ind.className = "text-[10px] bg-gray-200 text-gray-500 px-2 py-1 rounded font-bold uppercase"; ind.innerText = "OFF AIR"; }

    document.getElementById('adHistoryBody').innerHTML = adHistory.map(ad => {
        const isActive = ad.content === currentLiveAd;
        return `<tr class="hover:bg-yellow-50 transition border-b border-gray-50"><td class="p-3 text-gray-700 font-medium truncate max-w-xs">${ad.content}</td><td class="p-3 text-center w-24"><button data-action="toggle-ad" data-id="${ad.id}" class="tap text-[10px] px-2 py-1 rounded-full font-bold border ${isActive ? 'bg-semantic-success text-white border-semantic-success' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'}">${isActive ? 'LIVE' : 'OFF'}</button></td><td class="p-3 text-right w-16"><button data-action="delete-ad" data-id="${ad.id}" class="text-gray-300 hover:text-red-500 transition">🗑️</button></td></tr>`;
    }).join('');
}

async function saveNewAd() { const txt = document.getElementById('newAdInput').value; if(!txt) return; await supabase.from('ad_history').insert({ content: txt }); document.getElementById('newAdInput').value = ""; loadAdSystem(); }
async function toggleAd(id) { const ad = adHistory.find(a => a.id === id); const newStatus = (ad.content === currentLiveAd) ? "" : ad.content; await supabase.from('admin_settings').upsert({ key: 'global_alert', value: newStatus }); currentLiveAd = newStatus; renderAdManager(); updatePreviewBar(newStatus); }
async function deleteAd(id) { if(!confirm("Delete this ad?")) return; await supabase.from('ad_history').delete().eq('id', id); loadAdSystem(); }

async function loadData() { const { data: d } = await supabase.from('products').select('*').order('created_at', { ascending: false }); data = d || []; render(data); updateStats(); }

function render(items) {
    document.getElementById('tableBody').innerHTML = items.map(p => {
        const imgList = Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image_url];
        
        // SAFE JSON STRINGIFY: We encode quotes to prevent HTML breaking
        const safeImgJson = JSON.stringify(imgList).replace(/"/g, '&quot;');
        
        const carouselHtml = imgList.map(img => `<img src="${img}" class="h-8 w-8 rounded border border-gray-200 object-cover snap-start shrink-0 cursor-pointer hover:border-blue-500 hover:scale-105 transition">`).join('');

        return `
        <tr class="hover:bg-blue-50 transition border-b group">
            <td class="p-3 w-40">
                <div class="flex gap-2 overflow-x-auto w-32 snap-x scrollbar-hide cursor-pointer" 
                     data-action="open-gallery" 
                     data-payload="${safeImgJson}">
                    ${carouselHtml}
                </div>
            </td>
            <td class="p-3"><div class="font-bold text-xs text-gray-800">${p.title}</div><div class="text-[10px] text-gray-500">${p.campus} • ₦${Number(p.price).toLocaleString()} • ${new Date(p.created_at).toLocaleDateString()}</div></td>
            <td class="p-3"><div class="flex items-center gap-1"><span class="font-mono font-bold text-xs ${p.click_count > 3 ? 'text-red-500' : 'text-gray-600'}">${p.click_count || 0}</span><span class="text-[9px] text-gray-400 uppercase">clicks</span></div></td>
            <td class="p-3 font-mono text-[10px]"><div class="text-semantic-trust">${p.whatsapp_number}</div>${p.is_anonymous ? '<span class="text-[9px] text-gray-400">Hidden ID</span>' : ''}</td>
            <td class="p-3">${p.is_master ? '<span class="bg-yellow-100 text-yellow-800 text-[9px] px-2 py-0.5 rounded border border-yellow-200 font-bold">👑 VERIFIED</span>' : '<span class="bg-gray-100 text-gray-500 text-[9px] px-2 py-0.5 rounded">USER</span>'}</td>
            <td class="p-3 text-right"><div class="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                <button data-action="toggle-verify" data-id="${p.id}" data-payload="${p.is_master}" class="text-[9px] border bg-white px-2 py-1 rounded font-bold hover:bg-yellow-50 text-gray-600">${p.is_master ? 'Down' : 'VERIFY'}</button>
                <button data-action="ban-user" data-payload="${p.whatsapp_number}" class="text-[9px] bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded font-bold hover:bg-red-600 hover:text-white transition">BAN</button>
                <button data-action="delete-product" data-id="${p.id}" class="text-[9px] text-gray-400 hover:text-red-600 p-1">🗑️</button>
            </div></td>
        </tr>`;
    }).join('');
}

function updateStats() {
    document.getElementById('countTotal').innerText = data.length;
    document.getElementById('countVerified').innerText = data.filter(i => i.is_master).length;
    document.getElementById('countClicks').innerText = data.reduce((sum, item) => sum + (item.click_count || 0), 0).toLocaleString();
    document.getElementById('revenue').innerText = `₦${(data.filter(i => i.is_master).length * 5000).toLocaleString()}`;
}

function search(val) {
    const v = val.toLowerCase();
    const filtered = data.filter(i => i.title.toLowerCase().includes(v) || i.whatsapp_number.includes(v) || (i.id && i.id.includes(v)));
    render(filtered);
}

// 5. ACTIONS
function openGallery(images) {
    const container = document.getElementById('galleryContainer');
    container.innerHTML = images.map(src => `<img src="${src}" class="max-h-[80vh] w-auto rounded-lg border-2 border-white shadow-2xl snap-center shrink-0">`).join('');
    document.getElementById('imgModal').classList.remove('hidden');
}

async function toggleVerify(id, currentStatus) {
    const idx = data.findIndex(i => i.id === id); if (idx !== -1) { data[idx].is_master = !currentStatus; render(data); updateStats(); }
    await supabase.rpc('admin_toggle_verify', { p_id: id, p_status: !currentStatus });
}

async function deleteProduct(id) {
    if (!confirm("Permanently delete this item?")) return;
    data = data.filter(i => i.id !== id); render(data); updateStats();
    await supabase.from('products').delete().eq('id', id);
}

async function ban(number) {
    const reason = prompt(`Ban User ${number}?\nEnter reason:`); if (!reason) return;
    await supabase.rpc('admin_ban_user', { p_number: number, p_reason: reason }); alert(`User ${number} banned.`);
}

async function viewAuditLogs() {
    const { data: logs } = await supabase.from('audit_trail').select('*').order('created_at', { ascending: false }).limit(50);
    document.getElementById('auditBody').innerHTML = (logs || []).map(l => `<tr class="hover:bg-yellow-50 text-[10px]"><td class="p-2 border text-gray-500">${new Date(l.created_at).toLocaleString()}</td><td class="p-2 border font-bold text-blue-700">POST</td><td class="p-2 border font-mono">${l.whatsapp_number}</td><td class="p-2 border text-red-600 font-mono">${l.ip_address}</td><td class="p-2 border">${l.geo_location}</td><td class="p-2 border text-gray-500 truncate max-w-[150px]">${l.device_info}</td></tr>`).join('');
    document.getElementById('auditModal').classList.remove('hidden');
}

async function viewBlacklist() {
    const { data } = await supabase.from('blacklist').select('*');
    document.getElementById('blacklistList').innerHTML = (data || []).map(b => `<li class="flex justify-between items-center p-3 bg-gray-50 border rounded shadow-sm"><div><div class="font-bold text-gray-800">${b.whatsapp_number}</div><div class="text-[10px] text-red-500">Reason: ${b.reason}</div></div><button data-action="unban-user" data-payload="${b.whatsapp_number}" class="text-[10px] bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-100 font-bold">UNBAN</button></li>`).join('');
    document.getElementById('blacklistModal').classList.remove('hidden');
}

async function unban(n) { if (confirm(`Unban ${n}?`)) { await supabase.from('blacklist').delete().eq('whatsapp_number', n); viewBlacklist(); } }
function closeAllModals() { document.querySelectorAll('[id$="Modal"]').forEach(m => m.classList.add('hidden')); }
function playPing() { const audio = document.getElementById('ping'); if(audio) audio.play().catch(()=>{}); }
