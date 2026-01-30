// Check Login
const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
if (!loggedInUser) {
    window.location.href = "login.html";
}

// Elements
const list = document.getElementById("notificationsList");
const navAvatar = document.getElementById("navAvatar");
const sideAvatar = document.getElementById("sideAvatar");
const sideName = document.getElementById("sideName");
const sideEmail = document.getElementById("sideEmail");
const markReadBtn = document.getElementById("markAllRead");

// Render
function render() {
    const latestUser = JSON.parse(localStorage.getItem("loggedInUser")) || loggedInUser;

    // Profile UI
    const fullName = `${latestUser.firstName} ${latestUser.lastName || ""}`.trim();
    sideName.innerText = fullName;
    sideEmail.innerText = latestUser.email;

    if (latestUser.profileImage) {
        const imgHtml = `<img src="${latestUser.profileImage}" style="width:100%;height:100%;object-fit:cover;">`;
        navAvatar.innerHTML = imgHtml;
        sideAvatar.innerHTML = imgHtml;
        navAvatar.style.background = "transparent";
        sideAvatar.style.background = "transparent";
    } else {
        const letter = fullName.charAt(0).toUpperCase();
        navAvatar.innerText = letter;
        sideAvatar.innerText = letter;
        navAvatar.style.background = "linear-gradient(135deg, var(--primary), var(--secondary))";
        sideAvatar.style.background = "linear-gradient(135deg, var(--primary), var(--secondary))";
    }

    // Notifications
    const notifications = API.getNotifications(latestUser.email);
    const allUsers = API.getAllUsers();

    if (notifications.length === 0) {
        list.innerHTML = `
            <div style="text-align:center;padding:40px;color:var(--text-muted);">
                <i class="ri-notification-off-line" style="font-size:3rem;opacity:0.5;"></i>
                <p>No notifications yet.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = notifications.map(n => {
        const fromUser = allUsers.find(u => u.email === n.fromEmail);
        const fromName = fromUser ? `${fromUser.firstName} ${fromUser.lastName || ""}`.trim() : "Unknown User";
        const fromInitial = fromName.charAt(0).toUpperCase();

        // Icon & Text Logic
        let icon = "";
        let text = "";

        if (n.type === "like") {
            icon = '<i class="ri-heart-fill" style="color:var(--secondary)"></i>';
            text = "liked your post";
        } else if (n.type === "follow") {
            icon = '<i class="ri-user-add-fill" style="color:var(--success)"></i>';
            text = "started following you";
        } else if (n.type === "comment") {
            icon = '<i class="ri-chat-1-fill" style="color:var(--primary)"></i>';
            text = "commented on your post";
        }

        // Time logic (simple)
        const date = new Date(n.timestamp);
        const timeStr = date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `
        <div class="card" style="padding:12px;display:flex;gap:12px;align-items:center;background:${n.read ? 'transparent' : 'rgba(99, 102, 241, 0.1)'};border:${n.read ? '1px solid rgba(255,255,255,0.05)' : '1px solid var(--primary)'}">
            <div class="avatar avatar-sm" style="background:#334155">${fromInitial}</div>
            <div style="flex:1">
                <div style="font-size:0.95rem"><strong>${fromName}</strong> ${text}</div>
                <div style="font-size:0.8rem;color:var(--text-muted)">${timeStr}</div>
            </div>
            <div style="font-size:1.2rem">${icon}</div>
        </div>
        `;
    }).join("");
}

if (markReadBtn) {
    markReadBtn.onclick = () => {
        const latestUser = JSON.parse(localStorage.getItem("loggedInUser"));
        if (latestUser) {
            API.markNotificationsRead(latestUser.email);
            render(); // Re-render to update styles
        }
    };
}

render();
