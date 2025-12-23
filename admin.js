// admin.js - V8.1 Final (Adaptive Engine)

const supabase = window.initSupabase();
let data = [];
let adHistory = [];
let currentLiveAd = "";

(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return location.href = 'login.html';

    const { data: admin } = await supabase.from('admins').select('id').eq('id', session.user.id).single();
    if (!admin) { alert("Unauthorized."); return location.href = 'login.html'; }

    document.addEventListener('click', handleGlobalClicks);
    document.getElementById('searchInput').addEventListener('input', (e) => search(e.target.value));

    await Promise.all([loadData(), loadAdSystem()]);
    setupRealtime();
})();

async function handleGlobalClicks(e) {
    const trigger = e.target.closest('[data-action]');
    if (!trigger) return;
    const action = trigger.dataset.action;
    const id = trigger.dataset.id;
    const payload = trigger.dataset.payload;

    switch (action) {
        case 'save-ad': saveNewAd(); break;
        case 'toggle-ad': toggleAd(id); break;
        case 'delete-ad': deleteAd(id); break;
        case 'scroll-left': scrollGallery('left'); break;
        case 'scroll-right': scrollGallery('right'); break;
        case 'toggle-verify': toggleVerify(id, payload === 'true'); break;
        case 'delete-product': deleteProduct(id); break;
        case 'logout': await supabase.auth.signOut(); location.href = 'login.html'; break;
    }
}

function updatePreviewBar(text) {
    const bar = document.getElementById('livePreviewBar');
    const track = document.getElementById('adTrack');
    if (text && text.trim() !== "") {
        bar.classList.remove('hidden');
        const content = `<div class="marquee-item"><span>📢</span><span>${text}</span></div>`;
        const repeatCount = Math.max(4, Math.ceil((window.innerWidth * 2) / 200));
        track.innerHTML = content.repeat(repeatCount);
        track.style.animationDuration = `${track.scrollWidth / 50}s`;
    } else { bar.classList.add('hidden'); }
}

async function loadAdSystem() {
    const { data: live } = await supabase.from('admin_settings').select('value').eq('key', 'global_alert').single();
    currentLiveAd = live ? live.value : ""; updatePreviewBar(currentLiveAd);
    const { data: hist } = await supabase.from('ad_history').select('*').order('created_at', { ascending: false });
    adHistory = hist || []; renderAdManager();
}

function renderAdManager() {
    document.getElementById('adHistoryBody').innerHTML = adHistory.map(ad => `
        <tr class="border-b"><td class="p-3 text-xs">${ad.content}</td>
        <td class="p-3 text-center"><button data-action="toggle-ad" data-id="${ad.id}" class="px-3 py-1 rounded-full text-[10px] font-bold ${ad.content === currentLiveAd ? 'bg-wa-teal text-white':'bg-gray-100'}">${ad.content === currentLiveAd ? 'LIVE':'OFF'}</button></td>
        <td class="p-3 text-right"><button data-action="delete-ad" data-id="${ad.id}">🗑️</button></td></tr>`).join('');
}

// ... [Remaining Standard Logic: loadData, toggleVerify, deleteProduct, etc.] ...
async function loadData() { const { data: d } = await supabase.from('products').select('*').order('created_at',{ascending:false}); data = d || []; render(data); }
function render(items) {
    document.getElementById('tableBody').innerHTML = items.map(p => `
        <tr class="border-b">
            <td class="p-3"><img src="${p.images?.[0] || p.image_url}" class="w-10 h-10 rounded"></td>
            <td class="p-3 text-xs font-bold">${p.title}</td>
            <td class="p-3 text-xs">${p.click_count || 0}</td>
            <td class="p-3 text-right"><button data-action="delete-product" data-id="${p.id}">🗑️</button></td>
        </tr>`).join('');
}
