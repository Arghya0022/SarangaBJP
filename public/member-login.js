  

    const form =
      document.querySelector('#member-login-form');

    const status =
      document.querySelector('#member-login-status');

    form.addEventListener('submit', async (event) => {

      event.preventDefault();

      status.textContent = 'Logging in...';

      try {

        const response = await fetch(
          '/api/member/login',
          {
            method: 'POST',

            headers: {
              'Content-Type': 'application/json'
            },

            body: JSON.stringify({
              phone: form.phone.value,
              password: form.password.value
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error);
        }

        status.textContent = 'Login successful';

        window.location.href =
          '/member-dashboard.html';

      } catch (error) {

        status.textContent =
          error.message;

      }

    });

  