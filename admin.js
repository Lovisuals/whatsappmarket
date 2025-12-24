<script>
/* ===================== INIT ===================== */
const supabase = window.initSupabase?.();
if (!supabase) {
  alert("Supabase not initialized");
  throw new Error("Supabase init failed");
}

let allProducts = [];
let adminChannel = null;

const authSection = document.getElementById('authSection');
const dashboardSection = document.getElementById('dashboardSection');
const errorDiv = document.getElementById('errorDiv');

/* ===================== HELPERS ===================== */
function showError(msg) {
  errorDiv.textContent = msg;
  errorDiv.classList.remove('hidden');
  const card = document.querySelector('#authSection .bg-white');
  card.classList.add('animate-shake');
  setTimeout(() => card.classList.remove('animate-shake'), 600);
}

function hideError() {
  errorDiv.classList.add('hidden');
}

function showDashboard() {
  authSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
}

function showLogin() {
  dashboardSection.classList.add('hidden');
  authSection.classList.remove('hidden');
}

/* ===================== AUTH CHECK ===================== */
async function checkAdminSession() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Session error:", error);
    return;
  }

  if (!session) return;

  console.log("SESSION USER:", session.user.id);

  const { data: adminData, error: adminError } = await supabase
    .from('admins')
    .select('id')
    .eq('id', session.user.id)
    .maybeSingle();

  console.log("ADMIN CHECK:", adminData, adminError);

  if (!adminData || adminError) {
    await supabase.auth.signOut();
    return;
  }

  showDashboard();
  await loadData();
  setupRealtime();
}

/* ===================== LOGIN ===================== */
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();

  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div>';

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    showError(error.message);
    btn.textContent = 'VERIFY & ENTER';
    btn.disabled = false;
    return;
  }

  console.log("LOGGED IN USER:", data.user.id);

  const { data: adminData, error: adminError } = await supabase
    .from('admins')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle();

  console.log("ADMIN CHECK:", adminData, adminError);

  if (!adminData || adminError) {
    await supabase.auth.signOut();
    showError("Access denied: not an admin");
    btn.textContent = 'VERIFY & ENTER';
    btn.disabled = false;
    return;
  }

  showDashboard();
  await loadData();
  setupRealtime();

  btn.textContent = 'VERIFY & ENTER';
  btn.disabled = false;
});

/* ===================== LOGOUT ===================== */
document.getElementById('logoutBtn').addEventListener('click', async () => {
  if (adminChannel) {
    await supabase.removeChannel(adminChannel);
    adminChannel = null;
  }
  await supabase.auth.signOut();
  showLogin();
});

/* ===================== DATA ===================== */
async function loadData() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Load products failed:", error);
    return;
  }

  allProducts = data || [];
  renderTable();
  updateMetrics();

  const { data: ticker } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'global_alert')
    .maybeSingle();

  if (ticker) {
    document.getElementById('alertInput').value = ticker.value || '';
  }
}

/* ===================== TABLE ===================== */
function renderTable() {
  const tbody = document.getElementById('tableBody');

  if (!allProducts.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="p-20 text-center text-gray-400">
          Marketplace is empty
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = allProducts.map(p => `
    <tr class="border-t">
      <td class="p-4 flex items-center gap-3">
        <img src="${p.images?.[0] || 'https://placehold.co/80x80'}"
             class="w-10 h-10 object-cover rounded-lg">
        <span class="font-bold text-xs">${p.title}</span>
      </td>
      <td class="p-4 text-xs font-mono">${p.whatsapp_number || '—'}</td>
      <td class="p-4 text-center">
        <button
          onclick="toggleVerify('${p.id}', ${p.is_master})"
          class="px-4 py-1.5 rounded-full text-[9px] font-bold
          ${p.is_master ? 'bg-wa-teal text-white' : 'bg-gray-100 text-gray-400'}">
          ${p.is_master ? 'VERIFIED' : 'PENDING'}
        </button>
      </td>
      <td class="p-4 text-right">
        <button onclick="deleteItem('${p.id}')"
                class="text-gray-300 hover:text-red-500">🗑️</button>
      </td>
    </tr>
  `).join('');
}

/* ===================== ACTIONS ===================== */
async function toggleVerify(id, current) {
  const { error } = await supabase
    .from('products')
    .update({ is_master: !current })
    .eq('id', id);

  if (!error) loadData();
}

async function deleteItem(id) {
  if (!confirm("Delete permanently?")) return;

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (!error) loadData();
}

/* ===================== METRICS ===================== */
function updateMetrics() {
  document.getElementById('stat-total').textContent = allProducts.length;
  document.getElementById('stat-verified').textContent =
    allProducts.filter(p => p.is_master).length;
}

/* ===================== TICKER ===================== */
async function updateTicker() {
  const value = document.getElementById('alertInput').value.trim();
  const { error } = await supabase
    .from('admin_settings')
    .upsert({ key: 'global_alert', value }, { onConflict: 'key' });

  if (!error) alert("Ticker updated");
}

/* ===================== REALTIME ===================== */
function setupRealtime() {
  if (adminChannel) return;

  adminChannel = supabase
    .channel('admin_products_live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      () => loadData()
    )
    .subscribe();
}

/* ===================== START ===================== */
checkAdminSession();
</script>
