const form = document.querySelector('#set-password-form');
const status = document.querySelector('#set-password-status');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  status.textContent = 'Creating password...';

  try {
    const payload = {
      phone: form.phone.value,
      password: form.password.value
    };

    const response = await fetch('/api/member/set-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed');
    }

    status.textContent = 'Password created successfully';

    setTimeout(() => {
      window.location.href = '/member-login.html';
    }, 1500);

  } catch (error) {
    status.textContent = error.message;
  }
});