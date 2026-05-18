const form = document.querySelector('#super-admin-login-form');
const status = document.querySelector('#super-admin-login-status');

form.addEventListener('submit', async function (event) {
  event.preventDefault();

  status.textContent = 'Checking login...';

  try {
    const response = await fetch('/api/super-admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: form.phone.value.trim(),
        password: form.password.value.trim()
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    status.textContent = 'Login successful';

    window.location.href = '/admin.html';

  } catch (error) {
    status.textContent = error.message;
  }
});