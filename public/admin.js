const loginPanel = document.querySelector('#login-panel');
const dashboard = document.querySelector('#dashboard');
const loginForm = document.querySelector('#login-form');
const loginStatus = document.querySelector('#login-status');
const applicationsTable = document.querySelector('#applications-table');

function serializeForm(form) {
  const entries = Object.fromEntries(new FormData(form).entries());
  form.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    entries[input.name] = input.checked;
  });
  return entries;
}

async function api(path, options = {}) {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(path, {
    ...options,
    headers: isFormData
      ? { ...(options.headers || {}) }
      : { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function showDashboard() {
  loginPanel.hidden = true;
  dashboard.hidden = false;
}

function showLogin() {
  loginPanel.hidden = false;
  dashboard.hidden = true;
}

function escapeCell(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function renderApplications(applications) {
  applicationsTable.innerHTML = applications.length ? applications.map((item) => `
    <tr>
      <td><strong>${escapeCell(item.full_name)}</strong><br>${escapeCell(item.email || '')}</td>
      <td>${escapeCell(item.phone || '')}</td>
      <td>${escapeCell(item.village_or_ward || item.address || '')}</td>
      <td>${escapeCell(item.interest || '')}</td>
      <td>${escapeCell(item.status)}</td>
      <td><input data-designation="${item.id}" value="${escapeCell(item.designation_requested || 'Volunteer')}"></td>
      <td>
        <div class="row-actions">
          <button class="small-button" data-approve="${item.id}">Approve</button>
          <button class="small-button reject" data-reject="${item.id}">Reject</button>
        </div>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="7">No membership applications yet.</td></tr>';
}

async function loadDashboard() {
  const data = await api('/api/admin/dashboard');
  renderApplications(data.applications || []);
  showDashboard();
}

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginStatus.textContent = 'Checking password...';
    try {
      await api('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify(serializeForm(loginForm))
      });
      loginStatus.textContent = '';
      await loadDashboard();
    } catch (error) {
      loginStatus.textContent = error.message;
    }
  });
}

if (applicationsTable) {
  applicationsTable.addEventListener('click', async (event) => {
    const approveId = event.target.dataset.approve;
    const rejectId = event.target.dataset.reject;
    if (!approveId && !rejectId) return;

    const id = approveId || rejectId;
    const designation = document.querySelector(`[data-designation="${id}"]`)?.value || 'Volunteer';
    await api(`/api/admin/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: approveId ? 'approved' : 'rejected', designation })
    });
    await loadDashboard();
  });
}

document.querySelectorAll('[data-create]').forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const resource = form.dataset.create;
    const formData = new FormData(form);

    form.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      formData.set(input.name, input.checked ? 'true' : 'false');
    });

    await api(`/api/admin/${resource}`, {
      method: 'POST',
      body: formData
    });
    form.reset();
    await loadDashboard();
  });
});

document.querySelector('#logout-button')?.addEventListener('click', async () => {
  try {
    await api('/api/admin/logout', { method: 'POST' });
  } finally {
    showLogin();
  }
});

loadDashboard().catch(showLogin);
