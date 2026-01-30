// Check Login
if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "login.html";
}

// Load UI
const navAvatar = document.getElementById("navAvatar");
const usersList = document.getElementById("usersList");
const currentUser = API.getCurrentUser();

// Set Nav Avatar
if (currentUser && navAvatar) {
    if (currentUser.profileImage) {
        navAvatar.innerHTML = `<img src="${currentUser.profileImage}" style="width:100%;height:100%;object-fit:cover;">`;
        navAvatar.style.background = "transparent";
    } else {
        navAvatar.innerText = currentUser.firstName.charAt(0).toUpperCase();
    }
}

// Render Users
let allUsers = [];

function renderUsers(searchTerm = '') {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    allUsers = users;

    if (users.length === 0) {
        usersList.innerHTML = "<p style='text-align:center;color:var(--text-muted);padding:20px;'>No other users found.</p>";
        return;
    }

    // Filter users based on search term
    const filteredUsers = searchTerm
        ? users.filter(user => {
            const name = `${user.firstName} ${user.lastName || ""}`.toLowerCase();
            const email = user.email.toLowerCase();
            return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
        })
        : users;

    if (filteredUsers.length === 0) {
        usersList.innerHTML = "<p style='text-align:center;color:var(--text-muted);padding:20px;'>No users match your search.</p>";
        return;
    }

    usersList.innerHTML = filteredUsers.map(user => {
        const isMe = user.email === currentUser.email;
        const name = `${user.firstName} ${user.lastName || ""}`.trim();
        const initial = name.charAt(0).toUpperCase();
        const isFollowing = API.isFollowing(user.email);

        let avatarHtml = "";
        if (user.profileImage) {
            avatarHtml = `<img src="${user.profileImage}" class="avatar avatar-lg" style="width:50px;height:50px;">`;
        } else {
            avatarHtml = `<div class="avatar avatar-lg" style="width:50px;height:50px;font-size:1.25rem;">${initial}</div>`;
        }

        return `
            <div style="display:flex;align-items:center;gap:13px;padding:13px;background:rgba(255,255,255,0.03);border-radius:var(--radius-md);transition:all 0.2s;cursor:pointer;" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
                ${avatarHtml}
                <div style="flex:1;">
                    <h3 style="font-size:0.98rem;margin:0 0 4px 0;font-weight:600;">
                        ${name} ${isMe ? '<span style="font-size:0.73rem;color:var(--primary);background:rgba(99,102,241,0.15);padding:3px 9px;border-radius:11px;margin-left:7px;">You</span>' : ''}
                        ${isFollowing ? '<span style="font-size:0.73rem;color:var(--secondary);background:rgba(236,72,153,0.15);padding:3px 9px;border-radius:11px;margin-left:7px;">Following</span>' : ''}
                    </h3>
                    <p style="color:var(--text-muted);font-size:0.83rem;margin:0;">${user.email}</p>
                    ${user.description ? `<p style="margin-top:5px;font-size:0.88rem;color:#cbd5e1;">${user.description}</p>` : ''}
                </div>
                ${!isMe ? `<button class="btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} follow-btn" data-email="${user.email}" style="padding:7px 15px;font-size:0.83rem;" onclick="event.stopPropagation();">${isFollowing ? 'Unfollow' : 'Follow'}</button>` : ''}
            </div>
        `;
    }).join("");

    // Attach follow button listeners
    document.querySelectorAll('.follow-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const targetEmail = btn.dataset.email;
            const isCurrentlyFollowing = API.isFollowing(targetEmail);

            if (isCurrentlyFollowing) {
                API.unfollowUser(targetEmail);
            } else {
                API.followUser(targetEmail);
            }

            // Re-render to update UI
            renderUsers(searchInput ? searchInput.value : '');
        };
    });
}

// Search functionality
const searchInput = document.getElementById('searchUsers');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        renderUsers(e.target.value);
    });
}

renderUsers();
