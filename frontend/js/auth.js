/**
 * Authentication & Session Guard Controller
 */
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    // Quick-fill buttons for seamless classroom demonstration
    const demoPills = document.querySelectorAll('[data-fill-user]');
    demoPills.forEach(pill => {
        pill.addEventListener('click', () => {
            document.getElementById('username').value = pill.getAttribute('data-fill-user');
            document.getElementById('password').value = pill.getAttribute('data-fill-pass');
        });
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('username').value.trim();
            const passwordInput = document.getElementById('password').value.trim();
            const errorBox = document.getElementById('loginError');
            const submitBtn = document.getElementById('loginSubmitBtn');

            errorBox.style.display = 'none';

            // Client-side validation
            if (!usernameInput || !passwordInput) {
                errorBox.textContent = 'Please provide both your institutional username and password.';
                errorBox.style.display = 'block';
                return;
            }

            submitBtn.textContent = 'Authenticating...';
            submitBtn.disabled = true;

            const response = await API.login({
                username: usernameInput,
                password: passwordInput
            });

            if (response.ok && response.data.status === 'success') {
                // Store user metadata in localStorage for instant UI hydration
                localStorage.setItem('kyu_user', JSON.stringify(response.data.user));
                window.location.href = 'pages/dashboard.html';
            } else {
                errorBox.textContent = response.data.message || 'Invalid username or password.';
                errorBox.style.display = 'block';
                submitBtn.textContent = 'Enter Registry Portal';
                submitBtn.disabled = false;
            }
        });
    }
});