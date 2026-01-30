document.getElementById('signupBtn').addEventListener('click', () => {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    if (!name || !email || !password) return alert('All fields required.');
    if (password.length < 6) return alert('Password must be 6+ chars.');

    if (!email.includes('@')) {
        return alert("Invalid Email! Please enter a valid email address");
    }

    let users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.find(u => u.email === email)) return alert('Email already registered.');

    const [first='', ...rest] = name.split(' ');
    const last = rest.join(' ');

    const user = {
        firstName: first || name,
        lastName: last || '',
        email,
        password,
        profileImage: '',
        description: ''
    };

    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('loggedInUser', JSON.stringify(user));

    alert('Account created. Redirecting to feed...');
    window.location.href = 'index.html';
});
