const form = document.querySelector('#membership-form');
const statusBox = document.querySelector('#membership-status');

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusBox.textContent = 'Submitting application...';

    const body = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch('/api/membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Application failed');
      form.reset();
      statusBox.textContent = `Application submitted successfully. Reference ID: ${data.id}`;
    } catch (error) {
      statusBox.textContent = error.message;
    }
  });
}
