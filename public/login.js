document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    var serverEndpoint = "http://64.226.107.81"//64.226.107.81

    try {
        const response = await fetch(serverEndpoint + '/api/users/adminPortal/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        console.log(data.token ,response.ok );

        if (response.ok && data.token) {
            localStorage.setItem('token', data.token);
            
            window.location.href = 'request-list.html';

        } else {
            errorMessage.textContent = data.error || 'An error occurred during login.';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        errorMessage.textContent = 'An error occurred during login.';
        errorMessage.style.display = 'block';
    }
});
