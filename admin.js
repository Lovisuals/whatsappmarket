// CONFIGURATION
const SUPABASE_URL = 'https://vimovhpweucvperwhyzi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbW92aHB3ZXVjdnBlcndoeXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODE1MjUsImV4cCI6MjA4MjA1NzUyNX0.u6KDe2RCwCcWdClkGA61q2LORqzmPU0KNP9tZTZfOfc';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// GLOBAL STATE
let data = [];
let adHistory = [];
let currentLiveAd = "";

// 1. INITIALIZATION & AUTH CHECK
(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return location.href = 'login.html';

    const { data: admin } = await supabase.from('admins').select('id').eq('id', session.user.id).single();
    if (!admin) {
        alert("Unauthorized Access");
        await supabase.auth.signOut();
        return location.href = 'login.html';
    }

    await Promise.all([loadData(), loadAdSystem()]);
    setupRealtime();
})();

// 2. REALTIME LISTENERS
function setupRealtime() {
    supabase.channel('admin_products')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, p => {
            if (p.eventType === 'INSERT') { data.unshift(p.new); document.getElementById('ping').play().catch(() => {}); }
            if (p.eventType === 'DELETE') { data = data.filter(i => i.id !== p.old.id); }
            if (p.eventType === 'UPDATE') { const idx = data.findIndex(i => i.id === p.new.id); if (idx !== -1) data[idx] = p.new; }
            render(data); updateStats();
        }).subscribe();

    supabase.channel('admin_ads')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_settings' }, p => {
            if (p.new && p.new.key === 'global_alert') {
                currentLiveAd = p.new.value;
                renderAdManager();
                updatePreviewBar(currentLiveAd);
            }
        }).subscribe();
}

// 3. AD SYSTEM LOGIC
async function loadAdSystem() {
    const { data: live } = await supabase.from('admin_settings').select('value').eq('key', 'global_alert').single();
    currentLiveAd = live ? live.value : "";
    updatePreviewBar(currentLiveAd);

    const { data: hist } = await supabase.from('ad_history').select('*').order('created_at', { ascending: false });
    adHistory = hist || [];
    renderAdManager();
}

function updatePreviewBar(text) {
    const bar = document.getElementById('livePreviewBar');
    const txt = document.getElementById('adText');
    if (text && text.trim() !== "") { bar.classList.remove('hidden'); txt.innerText = text; }
    else { bar.classList.add('hidden'); }
}

function renderAdManager() {
    const ind = document.getElementById('liveIndicator');
    if (currentLiveAd && currentLiveAd.trim() !== "") {
        ind.className = "text-[10px] bg-semantic-success text-white px-2 py-1 rounded font-bold uppercase animate-pulse";
        ind.innerText = "● LIVE ON SITE";
    } else {
        ind.className = "text-[10px] bg-gray-200 text-gray-500 px-2 py-1 rounded font-bold uppercase";
        ind.innerText = "OFF AIR";
    }

    document.getElementById('adHistoryBody').innerHTML = adHistory.map(ad => {
        const isActive = ad.content === currentLiveAd;
        return `
        <tr class="hover:bg-yellow-50 transition border-b border-gray-50">
            <td class="p-3 text-gray-700 font-medium truncate max-w-xs">${ad.content}</td>
            <td class="p-3 text-center w-24">
                <button onclick="toggleAd('${ad.id}')" class="tap text-[10px] px-2 py-1 rounded-full font-bold border ${isActive ? 'bg-semantic-success text-white border-semantic-success' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'}">
                    ${isActive ? 'LIVE' : 'OFF'}
                </button>
            </td>
            <td class="p-3 text-right w-16">
                <button onclick="deleteAd('${ad.id}')" class="text-gray-300 hover:text-red-500 transition">🗑️</button>
            </td>
        </tr>`;
    }).join('');
}

async function saveNewAd() {
    const txt = document.getElementById('newAdInput').value;
    if (!txt) return;
    await supabase.from('ad_history').insert({ content: txt });
    document.getElementById('newAdInput').value = "";
    loadAdSystem();
}

async function toggleAd(id) {
    const ad = adHistory.find(a => a.id === id);
    const newStatus = (ad.content === currentLiveAd) ? "" : ad.content;
    await supabase.from('admin_settings').upsert({ key: 'global_alert', value: newStatus });
    currentLiveAd = newStatus;
    renderAdManager();
    updatePreviewBar(newStatus);
}

async function deleteAd(id) {
    if (!confirm("Delete this ad?")) return;
    await supabase.from('ad_history').delete().eq('id', id);
    loadAdSystem();
}

// 4. PRODUCT MANAGEMENT
async function loadData() {
    const { data: d } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    data = d || [];
    render(data);
    updateStats();
}

function render(items) {
    document.getElementById('tableBody').innerHTML = items.map(p => {
        const imgList = Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image_url];
        const carouselHtml = imgList.map(img =>
            `<img src="${img}" class="h-8 w-8 rounded border border-gray-200 object-cover snap-start shrink-0 cursor-pointer hover:border-blue-500 hover:scale-105 transition">`
        ).join('');

        return `
        <tr class="hover:bg-blue-50 transition border-b group">
            <td class="p-3 w-40">
                <div class="flex gap-2 overflow-x-auto w-32 snap-x scrollbar-hide" onclick='openGallery(${JSON.stringify(imgList)})'>
                    ${carouselHtml}
                </div>
            </td>
            <td class="p-3">
                <div class="font-bold text-xs text-gray-800">${p.title}</div>
                <div class="text-[10px] text-gray-500">${p.campus} • ₦${Number(p.price).toLocaleString()} • ${new Date(p.created_at).toLocaleDateString()}</div>
            </td>
            <td class="p-3">
                <div class="flex items-center gap-1">
                    <span class="font-mono font-bold text-xs ${p.click_count > 3 ? 'text-red-500' : 'text-gray-600'}">${p.click_count || 0}</span>
                    <span class="text-[9px] text-gray-400 uppercase">clicks</span>
                </div>
            </td>
            <td class="p-3 font-mono text-[10px]">
                <div class="text-semantic-trust">${p.whatsapp_number}</div>
                ${p.is_anonymous ? '<span class="text-[9px] text-gray-400">Hidden ID</span>' : ''}
            </td>
            <td class="p-3">
                ${p.is_master ?
                '<span class="bg-yellow-100 text-yellow-800 text-[9px] px-2 py-0.5 rounded border border-yellow-200 font-bold">👑 VERIFIED</span>' :
                '<span class="bg-gray-100 text-gray-500 text-[9px] px-2 py-0.5 rounded">USER</span>'}
            </td>
            <td class="p-3 text-right">
                <div class="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                    <button onclick="toggleVerify('${p.id}',${!p.is_master})" class="text-[9px] border bg-white px-2 py-1 rounded font-bold hover:bg-yellow-50 text-gray-600">${p.is_master ? 'Down' : 'VERIFY'}</button>
                    <button onclick="ban('${p.whatsapp_number}')" class="text-[9px] bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded font-bold hover:bg-red-600 hover:text-white transition">BAN</button>
                    <button onclick="deleteProduct('${p.id}')" class="text-[9px] text-gray-400 hover:text-red-600 p-1">🗑️</button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function updateStats() {
    document.getElementById('countTotal').innerText = data.length;
    const verified = data.filter(i => i.is_master).length;
    document.getElementById('countVerified').innerText = verified;
    const clicks = data.reduce((sum, item) => sum + (item.click_count || 0), 0);
    document.getElementById('countClicks').innerText = clicks.toLocaleString();
    document.getElementById('revenue').innerText = `₦${(verified * 5000).toLocaleString()}`;
}

function search(val) {
    const v = val.toLowerCase();
    const filtered = data.filter(i => i.title.toLowerCase().includes(v) || i.whatsapp_number.includes(v) || (i.id && i.id.includes(v)));
    render(filtered);
}

// 5. MODALS & ACTIONS
function openGallery(images) {
    const container = document.getElementById('galleryContainer');
    container.innerHTML = images.map(src => `<img src="${src}" class="max-h-[80vh] w-auto rounded-lg border-2 border-white shadow-2xl snap-center shrink-0">`).join('');
    document.getElementById('imgModal').classList.remove('hidden');
}

async function toggleVerify(id, status) {
    const idx = data.findIndex(i => i.id === id); if (idx !== -1) { data[idx].is_master = status; render(data); updateStats(); }
    await supabase.rpc('admin_toggle_verify', { p_id: id, p_status: status });
}

async function deleteProduct(id) {
    if (!confirm("Permanently delete?")) return;
    data = data.filter(i => i.id !== id); render(data); updateStats();
    await supabase.from('products').delete().eq('id', id);
}

async function ban(number) {
    const reason = prompt(`Ban User ${number}?\nEnter reason:`); if (!reason) return;
    await supabase.rpc('admin_ban_user', { p_number: number, p_reason: reason }); alert(`User ${number} banned.`);
}

async function viewAuditLogs() {
    const btn = document.querySelector('button[onclick="viewAuditLogs()"]'); const og = btn.innerHTML; btn.innerText = "LOADING...";
    const { data: logs } = await supabase.from('audit_trail').select('*').order('created_at', { ascending: false }).limit(50);
    document.getElementById('auditBody').innerHTML = (logs || []).map(l => `
        <tr class="hover:bg-yellow-50 text-[10px]">
            <td class="p-2 border text-gray-500">${new Date(l.created_at).toLocaleString()}</td>
            <td class="p-2 border font-bold text-blue-700">POST</td>
            <td class="p-2 border font-mono">${l.whatsapp_number}</td>
            <td class="p-2 border text-red-600 font-mono">${l.ip_address}</td>
            <td class="p-2 border">${l.geo_location}</td>
            <td class="p-2 border text-gray-500 truncate max-w-[150px]">${l.device_info}</td>
        </tr>`).join('');
    document.getElementById('auditModal').classList.remove('hidden'); btn.innerHTML = og;
}

async function viewBlacklist() {
    const { data } = await supabase.from('blacklist').select('*');
    document.getElementById('blacklistList').innerHTML = (data || []).map(b => `
        <li class="flex justify-between items-center p-3 bg-gray-50 border rounded shadow-sm">
            <div>
                <div class="font-bold text-gray-800">${b.whatsapp_number}</div>
                <div class="text-[10px] text-red-500">Reason: ${b.reason}</div>
            </div>
            <button onclick="unban('${b.whatsapp_number}')" class="text-[10px] bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-100 font-bold">UNBAN</button>
        </li>`).join('');
    document.getElementById('blacklistModal').classList.remove('hidden');
}

async function unban(n) {
    if (confirm(`Unban ${n}?`)) {
        await supabase.from('blacklist').delete().eq('whatsapp_number', n);
        viewBlacklist();
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
    location.href = 'login.html';
}
