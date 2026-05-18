
    const form = document.querySelector('#admin-apply-form');
    const status = document.querySelector('#admin-apply-status');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      status.textContent = 'Submitting application...';

      try {
        const formData = new FormData(form);

        const response = await fetch('/api/admin-apply', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error);

        status.textContent = 'Application submitted successfully. Wait for Super Admin approval.';

        form.reset();

      } catch (error) {
        status.textContent = error.message;
      }
    });
  