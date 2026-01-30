// ---------- LOGIN CHECK ----------
const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
if (!loggedInUser) {
    window.location.href = "login.html";
}

// ---------- LOCAL STORAGE INITIALIZATION ----------
let profile = {
    firstName: loggedInUser.firstName || "User",
    lastName: loggedInUser.lastName || "",
    email: loggedInUser.email || "",
    profileImage: loggedInUser.profileImage || "",
    description: loggedInUser.description || ""
};

// ---------- ELEMENTS ----------
const welcomeName = document.getElementById("welcomeName");
const welcomeEmail = document.getElementById("welcomeEmail");
const userDesc = document.getElementById("userDesc");
const profileImage = document.getElementById("profileImage");
const popup = document.getElementById("editPopup");
const editBtn = document.getElementById("editProfileBtn");
const cancelBtn = document.getElementById("cancelBtn");
const closePopup = document.getElementById("closePopup");
const saveBtn = document.getElementById("saveBtn");
const uploadPhoto = document.getElementById("uploadPhoto");
const editName = document.getElementById("editName");
const editEmail = document.getElementById("editEmail");
const editDesc = document.getElementById("editDesc");
const logoutBtn = document.getElementById("logout");

// ---------- FUNCTIONS ----------
function updateProfileUI() {
    welcomeName.innerText = `${profile.firstName} ${profile.lastName}`.trim();
    welcomeEmail.innerText = profile.email;
    userDesc.innerText = profile.description || "No description yet.";

    if (profile.profileImage) {
        profileImage.src = profile.profileImage;
    } else {
        // Placeholder or default
        profileImage.src = "img/user.png";
    }
}

// Initial render
if (loggedInUser) updateProfileUI();

// ---------- OPEN MODAL ----------
if (editBtn) {
    editBtn.addEventListener("click", () => {
        editName.value = `${profile.firstName} ${profile.lastName}`.trim();
        editEmail.value = profile.email;
        editDesc.value = profile.description;
        popup.classList.add("active");
    });
}

// ---------- CLOSE MODAL ----------
if (cancelBtn) cancelBtn.addEventListener("click", () => popup.classList.remove("active"));
if (closePopup) closePopup.addEventListener("click", () => popup.classList.remove("active"));

// ---------- SAVE PROFILE ----------
if (saveBtn) {
    saveBtn.addEventListener("click", () => {
        // Split name into firstName and lastName
        const nameParts = (editName.value || "").trim().split(" ");
        const newFirst = nameParts[0] || profile.firstName;
        const newLast = nameParts.slice(1).join(" ") || "";

        profile.firstName = newFirst;
        profile.lastName = newLast;
        profile.description = editDesc.value.trim() || profile.description;

        // Save updated profile
        localStorage.setItem("loggedInUser", JSON.stringify(profile));

        // Update users array
        let users = JSON.parse(localStorage.getItem("users")) || [];
        let index = users.findIndex(u => u.email === profile.email);
        if (index !== -1) {
            users[index] = { ...users[index], ...profile };
            localStorage.setItem("users", JSON.stringify(users));
        }

        updateProfileUI();
        popup.classList.remove("active");
    });
}

// ---------- UPLOAD PHOTO ----------
// ---------- UPLOAD PHOTO ----------
if (uploadPhoto) {
    uploadPhoto.addEventListener("change", () => {
        let file = uploadPhoto.files[0];
        if (file) {
            // Check file size (limit to 2MB to be safe for localStorage)
            if (file.size > 2 * 1024 * 1024) {
                alert("Image is too large! Please choose an image under 2MB.");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                try {
                    profile.profileImage = reader.result;
                    localStorage.setItem("loggedInUser", JSON.stringify(profile));

                    // Update users array as well
                    let users = JSON.parse(localStorage.getItem("users")) || [];
                    let index = users.findIndex(u => u.email === profile.email);
                    if (index !== -1) {
                        users[index].profileImage = reader.result;
                        localStorage.setItem("users", JSON.stringify(users));
                    }

                    updateProfileUI();
                } catch (e) {
                    alert("Error saving image. It might be too large for local storage.");
                    console.error(e);
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

// Allow clicking the profile image to open edit modal
if (profileImage) {
    profileImage.style.cursor = "pointer";
    profileImage.title = "Click to edit profile";
    profileImage.addEventListener("click", () => {
        if (editBtn) editBtn.click();
    });
}

// ---------- LOGOUT ----------
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("isLoggedIn");
        window.location.href = "login.html";
    });
}

// ---------- STATS & MODAL LOGIC ----------
const followingStat = document.getElementById("followingStat");
const followersStat = document.getElementById("followersStat");
const followingCount = document.getElementById("followingCount");
const followersCount = document.getElementById("followersCount");
const likesCount = document.getElementById("likesCount");
const tabContent = document.getElementById("tabContent"); // Now used for Likes only

const userListModal = document.getElementById("userListModal");
const userListTitle = document.getElementById("userListTitle");
const userListContent = document.getElementById("userListContent");
const closeUserList = document.getElementById("closeUserList");

function initProfile() {
    updateCounts();
    renderLikedPosts(); // Default view

    // Event Listeners for Stats
    if (followingStat) {
        followingStat.onclick = () => openUserListModal("following");
    }
    if (followersStat) {
        followersStat.onclick = () => openUserListModal("followers");
    }

    // Close Modal
    if (closeUserList) {
        closeUserList.onclick = () => userListModal.classList.remove("active");
    }
    // Close on click outside
    window.onclick = (e) => {
        if (e.target === userListModal) {
            userListModal.classList.remove("active");
        }
        if (e.target === popup) {
            popup.classList.remove("active");
        }
    };
}

function refreshProfile() {
    const freshUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (freshUser) {
        profile = {
            firstName: freshUser.firstName || "User",
            lastName: freshUser.lastName || "",
            email: freshUser.email || "",
            profileImage: freshUser.profileImage || "",
            description: freshUser.description || ""
        };
    }
}

function updateCounts() {
    refreshProfile();
    const following = API.getFollowing(profile.email);
    const followers = API.getFollowers(profile.email);
    const likedPosts = API.getLikedPosts(profile.email);

    if (followingCount) followingCount.innerText = following.length;
    if (followersCount) followersCount.innerText = followers.length;
    if (likesCount) likesCount.innerText = likedPosts.length;
}

function renderLikedPosts() {
    refreshProfile();
    const posts = API.getLikedPosts(profile.email);

    if (posts.length === 0) {
        tabContent.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:20px;">No liked posts yet.</p>`;
        return;
    }

    const html = posts.map(post => `
        <div class="card" style="margin-bottom:16px;padding:16px;">
            <div style="display:flex;gap:12px;margin-bottom:12px;">
                <div style="font-weight:600;">${post.userName}</div>
                <div style="color:var(--text-muted);font-size:0.9rem;">${new Date(post.id).toLocaleDateString()}</div>
            </div>
            <div style="margin-bottom:12px;">${post.text}</div>
            ${post.image ? `<img src="${post.image}" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px;">` : ''}
        </div>
    `).join("");

    tabContent.innerHTML = html;
}

function openUserListModal(type) {
    refreshProfile();
    userListModal.classList.add("active");
    userListContent.innerHTML = "";

    let users = [];
    if (type === "following") {
        userListTitle.innerText = "Following";
        users = API.getFollowing(profile.email);
        renderUserList(users, "You aren't following anyone yet.", true);
    } else {
        userListTitle.innerText = "Followers";
        users = API.getFollowers(profile.email);
        renderUserList(users, "No followers yet.", false);
    }
}

function renderUserList(users, emptyMsg, isFollowingList) {
    if (users.length === 0) {
        userListContent.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:20px;">${emptyMsg}</p>`;
        return;
    }

    const html = users.map(user => {
        const name = `${user.firstName} ${user.lastName || ""}`.trim();
        const initial = name.charAt(0).toUpperCase();

        let avatarHtml = "";
        if (user.profileImage) {
            avatarHtml = `<img src="${user.profileImage}" class="avatar avatar-lg" style="width:40px;height:40px;">`;
        } else {
            avatarHtml = `<div class="avatar avatar-lg" style="width:40px;height:40px;font-size:1rem;">${initial}</div>`;
        }

        return `
            <div style="display:flex;align-items:center;gap:12px;padding:12px;border-bottom:1px solid rgba(255,255,255,0.05);">
                ${avatarHtml}
                <div style="flex:1;">
                    <h3 style="font-size:0.9rem;margin:0;font-weight:600;">${name}</h3>
                    <p style="color:var(--text-muted);font-size:0.8rem;margin:0;">${user.email}</p>
                </div>
                ${isFollowingList ? `
                    <button class="btn btn-secondary btn-sm unfollow-btn" data-email="${user.email}" style="padding:4px 10px;font-size:0.75rem;">
                        Unfollow
                    </button>
                ` : ""}
            </div>
        `;
    }).join("");

    userListContent.innerHTML = html;

    // Attach listeners
    if (isFollowingList) {
        document.querySelectorAll(".unfollow-btn").forEach(btn => {
            btn.onclick = (e) => {
                const email = e.target.dataset.email;
                if (confirm(`Unfollow this user?`)) {
                    API.unfollowUser(email);
                    updateCounts();
                    // Re-render current list
                    openUserListModal("following");
                }
            };
        });
    }
}

// Initialize
initProfile();
