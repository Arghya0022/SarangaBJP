const loginPanel = document.querySelector('#login-panel');
const dashboard = document.querySelector('#dashboard');
const loginForm = document.querySelector('#login-form');
const loginStatus = document.querySelector('#login-status');

const applicationsTable = document.querySelector('#applications-table');
const adminApplicationsTable = document.querySelector('#admin-applications-table');

let currentAdminRole = null;

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
  if (response.status === 401) {

  showLogin();

}

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

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

/* =========================
   MEMBER APPLICATIONS
========================= */

function renderApplications(applications) {
  if (!applicationsTable) return;

  applicationsTable.innerHTML = applications.length
    ? applications.map((item) => `
      <tr>
        <td>
          <strong>${escapeCell(item.full_name)}</strong><br>
          ${escapeCell(item.email || '')}
        </td>

        <td>${escapeCell(item.phone || '')}</td>

        <td>${escapeCell(item.village_or_ward || item.address || '')}</td>

        <td>${escapeCell(item.interest || '')}</td>

        <td>${escapeCell(item.status)}</td>

        <td>
          <input
            data-designation="${item.id}"
            value="${escapeCell(item.designation_requested || 'Member')}">
        </td>

        <td>
          <div class="row-actions">
            <button class="small-button" data-approve="${item.id}">
              Approve
            </button>

            <button class="small-button reject" data-reject="${item.id}">
              Reject
            </button>
          </div>
        </td>
      </tr>
    `).join('')
    : '<tr><td colspan="7">No membership applications yet.</td></tr>';
}

/* =========================
   ADMIN / LEADER APPLICATIONS
========================= */

function renderAdminApplications(applications) {
  if (!adminApplicationsTable) return;

  if (currentAdminRole !== 'super_admin') {
    adminApplicationsTable.innerHTML = `
      <tr>
        <td colspan="5">
          Only Super Admin can view and approve Admin / Leader applications.
        </td>
      </tr>
    `;
    return;
  }

  adminApplicationsTable.innerHTML = applications.length
    ? applications.map((item) => `
      <tr>
        <td>
          <strong>${escapeCell(item.full_name)}</strong><br>
          ${escapeCell(item.email || '')}
        </td>

        <td>${escapeCell(item.phone || '')}</td>

        <td>${escapeCell(item.requested_role || '')}</td>

        <td>${escapeCell(item.status || '')}</td>

        <td>
          <div class="row-actions">
            <button class="small-button" data-admin-approve="${item.id}">
              Approve
            </button>

            <button class="small-button reject" data-admin-reject="${item.id}">
              Reject
            </button>
          </div>
        </td>
      </tr>
    `).join('')
    : '<tr><td colspan="5">No admin/leader applications yet.</td></tr>';
}

/* =========================
   LOAD DASHBOARD
========================= */

async function loadDashboard() {
  const profile = await api('/api/admin/profile');
  currentAdminRole = profile.admin.role;
  const heading = document.querySelector('.section-heading h1');

if (heading) {

  heading.innerHTML =
    `Welcome ${profile.admin.full_name} (${profile.admin.role})`;

}

  const data = await api('/api/admin/dashboard');
  renderApplications(data.applications || []);

  if (currentAdminRole === 'super_admin') {
    const adminApplications = await api('/api/super-admin/admin-applications');
    renderAdminApplications(adminApplications || []);
  } else {
    renderAdminApplications([]);
  }

  applyRolePermissions();

showDashboard();
}

/* =========================
   LOGIN
========================= */

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    loginStatus.textContent = 'Checking login...';

    try {
      await api('/api/admin/role-login', {
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

/* =========================
   MEMBER APPROVE / REJECT
========================= */

if (applicationsTable) {
  applicationsTable.addEventListener('click', async (event) => {
    const approveId = event.target.dataset.approve;
    const rejectId = event.target.dataset.reject;

    if (!approveId && !rejectId) return;

    const id = approveId || rejectId;

    const designation =
      document.querySelector(`[data-designation="${id}"]`)?.value || 'Member';

    await api(`/api/admin/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: approveId ? 'approved' : 'rejected',
        designation
      })
    });

    await loadDashboard();
  });
}

/* =========================
   ADMIN / LEADER APPROVE / REJECT
========================= */

if (adminApplicationsTable) {
  adminApplicationsTable.addEventListener('click', async (event) => {
    const approveId = event.target.dataset.adminApprove;
    const rejectId = event.target.dataset.adminReject;

    if (!approveId && !rejectId) return;

    const id = approveId || rejectId;

    const endpoint = approveId
      ? `/api/super-admin/approve-admin/${id}`
      : `/api/super-admin/reject-admin/${id}`;

    const result = await api(endpoint, {
      method: 'POST'
    });

    if (result.temporary_password) {
      alert(
        `Approved successfully.\n\nPhone: ${result.phone}\nTemporary Password: ${result.temporary_password}`
      );
    }

    await loadDashboard();
  });
}
/* =========================
   ROLE PERMISSIONS
========================= */

const CONTENT_ROLES = [
  'super_admin',
  'president',
  'general_secretary',
  'leader',
  'booth_head',
  'booth_president',
  'administrator',
  'coordinator'
];

function applyRolePermissions() {

  if (!CONTENT_ROLES.includes(currentAdminRole)) {

    document.querySelectorAll('[data-create]').forEach((form) => {

      form.closest('.admin-block')?.remove();

    });

  }

}
/* =========================
   CREATE CONTENT
========================= */

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

    alert('Content published successfully');

form.reset();

await loadDashboard();

  });
});

/* =========================
   LOGOUT
========================= */

document.querySelector('#logout-button')?.addEventListener('click', async () => {
  try {
    await api('/api/admin/logout', {
      method: 'POST'
    });
  } finally {
    showLogin();
  }
});

loadDashboard().catch(showLogin);
