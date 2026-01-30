// ---------- LOGIN CHECK ----------
if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "login.html";
}

// Get current user info
const currentUser = JSON.parse(localStorage.getItem("loggedInUser")) || {
    email: "user@test.com",
    firstName: "User",
    lastName: "Name",
    profileImage: "",
    description: ""
};

// Load posts (shared among all users in this browser)
// We now use API.getPosts() to ensure single source of truth
// let posts = API.getPosts(); // Removed to avoid top-level dependency issues

// DOM Elements
const feedEl = document.getElementById("feed");
const navAvatar = document.getElementById("navAvatar");
const sideAvatar = document.getElementById("sideAvatar");
const sideName = document.getElementById("sideName");
const sideEmail = document.getElementById("sideEmail");
const composeAvatar = document.getElementById("composeAvatar");
const postBtn = document.getElementById("postQuick");
const quickText = document.getElementById("quickText");
const quickImage = document.getElementById("quickImage");
const searchInput = document.getElementById("searchInput");
const logoutBtn = document.getElementById("logout");

// State
let activeSort = "latest";

// Initialize
function init() {
    console.log("Index.js: init() started");
    try {
        if (typeof API === 'undefined') {
            console.error("CRITICAL: API is undefined in index.js!");
            return;
        }
        loadProfileUI();
        renderPosts();
        setupEventListeners();
        console.log("Index.js: init() completed successfully");
    } catch (e) {
        console.error("Index.js: Error in init():", e);
    }
}

function setupEventListeners() {
    console.log("Index.js: setupEventListeners() started");
    try {
        // Create Post
        if (postBtn) {
            console.log("Index.js: postBtn found, attaching listener");
            postBtn.onclick = () => {
                console.log("Index.js: postBtn clicked");
                try {
                    const text = quickText.value.trim();
                    const image = quickImage.value.trim();
                    console.log("Index.js: Post content:", text, image);

                    if (!text && !image) {
                        alert("Please write something or add an image!");
                        return;
                    }

                    const newPost = {
                        id: Date.now(),
                        text,
                        image,
                        likes: [],
                        comments: [],
                        userEmail: currentUser.email,
                        userName: `${currentUser.firstName} ${currentUser.lastName || ""}`.trim(),
                        profileImage: currentUser.profileImage
                    };

                    console.log("Index.js: Calling API.createPost", newPost);
                    API.createPost(newPost);
                    console.log("Index.js: API.createPost returned");
                    renderPosts();

                    quickText.value = "";
                    quickImage.value = "";
                } catch (err) {
                    console.error("Index.js: Error inside postBtn click:", err);
                }
            };
        } else {
            console.error("Index.js: postBtn NOT found");
        }

        // Edit Modal Save
        if (saveEditBtn) {
            saveEditBtn.onclick = () => {
                const post = API.getPosts().find(p => p.id === editingId);
                if (post) {
                    post.text = editText.value.trim();
                    post.image = editImage.value.trim();
                    API.updatePost(post);
                    renderPosts();
                    editModal.classList.remove("open");
                    editModal.style.display = 'none'; // Ensure it hides
                }
            };
        }

        // Search
        if (searchInput) {
            searchInput.addEventListener("input", renderPosts);
        }

        // Sort Filters
        document.querySelectorAll("[data-sort]").forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll("[data-sort]").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                activeSort = btn.dataset.sort;
                renderPosts();
            };
        });

        // Logout
        if (logoutBtn) {
            logoutBtn.onclick = () => {
                API.logout();
                window.location.href = "login.html";
            };
        }

        // Export Data
        const exportBtn = document.getElementById("exportBtn");
        if (exportBtn) {
            exportBtn.onclick = () => {
                API.exportData();
            };
        }

        // Import Data
        const importBtn = document.getElementById("importBtn");
        const importFile = document.getElementById("importFile");
        if (importBtn && importFile) {
            importBtn.onclick = () => {
                importFile.click();
            };

            importFile.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const result = API.importData(event.target.result);
                        if (result.success) {
                            alert(result.message + "\n\nPage will reload to show imported data.");
                            window.location.reload();
                        } else {
                            alert("Import failed: " + result.message);
                        }
                    };
                    reader.readAsText(file);
                }
            };
        }
    } catch (e) {
        console.error("Index.js: Error in setupEventListeners:", e);
    }
}

// Load user profile UI
function loadProfileUI() {
    const latestUser = JSON.parse(localStorage.getItem("loggedInUser")) || currentUser;
    const fullName = `${latestUser.firstName} ${latestUser.lastName || ""}`.trim();

    // Update text
    if (sideName) sideName.innerText = fullName;
    if (sideEmail) sideEmail.innerText = latestUser.email;

    // Update Avatars
    const avatars = [navAvatar, sideAvatar, composeAvatar];
    avatars.forEach(el => {
        if (!el) return;
        if (latestUser.profileImage) {
            el.innerHTML = `<img src="${latestUser.profileImage}" style="width:100%;height:100%;object-fit:cover;">`;
            el.style.background = "transparent";
        } else {
            el.innerText = fullName.charAt(0).toUpperCase();
            el.style.background = "linear-gradient(135deg, var(--primary), var(--secondary))";
            // el.innerHTML = fullName.charAt(0).toUpperCase(); // Removed redundant line
        }
    });
}

// Format timestamp
function formatTime(t) {
    const date = new Date(t);
    const now = new Date();
    const diff = (now - date) / 1000; // seconds

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
}

// Get filtered and sorted posts
function getProcessedPosts() {
    let result = API.getPosts();

    // Filter
    const q = (searchInput.value || "").trim().toLowerCase();
    if (q) {
        result = result.filter(p =>
            (p.text || "").toLowerCase().includes(q) ||
            (p.userName || "").toLowerCase().includes(q)
        );
    }

    // Sort
    if (activeSort === "latest") {
        result.sort((a, b) => b.id - a.id);
    } else if (activeSort === "popular") {
        result.sort((a, b) => (Array.isArray(b.likes) ? b.likes.length : 0) - (Array.isArray(a.likes) ? a.likes.length : 0));
    } else if (activeSort === "media") {
        result = result.filter(p => p.image);
        result.sort((a, b) => b.id - a.id);
    }

    return result;
}

// Render posts
function renderPosts() {
    console.log("renderPosts called");
    feedEl.innerHTML = "";
    const list = getProcessedPosts();
    console.log("renderPosts list size:", list.length);

    if (list.length === 0) {
        feedEl.innerHTML = `
            <div style="text-align:center;padding:40px;color:var(--text-muted);">
                <i class="ri-inbox-line" style="font-size:3rem;opacity:0.5;"></i>
                <p>No buzz found.</p>
            </div>
        `;
        return;
    }

    list.forEach(post => {
        const div = document.createElement("div");
        div.className = "card post-card";

        // Avatar Logic
        let avatarHtml = "";
        const isCurrentUser = post.userEmail === currentUser.email;
        const displayImage = isCurrentUser ? currentUser.profileImage : post.profileImage;
        const displayName = isCurrentUser ? `${currentUser.firstName} ${currentUser.lastName || ""}`.trim() : post.userName;

        if (displayImage) {
            avatarHtml = `<img src="${displayImage}" class="avatar avatar-sm">`;
        } else {
            avatarHtml = `<div class="avatar avatar-sm">${(displayName || "U").charAt(0).toUpperCase()}</div>`;
        }

        // Comments HTML
        const comments = post.comments || [];
        const commentsHtml = comments.map(c => `
            <div class="comment">
                <div class="avatar" style="width:32px;height:32px;font-size:0.8rem;">${c.userName.charAt(0).toUpperCase()}</div>
                <div class="comment-bubble">
                    <div class="comment-header">
                        <span class="comment-author">${escapeHtml(c.userName)}</span>
                        <span class="comment-time">${formatTime(c.id)}</span>
                    </div>
                    <div>${escapeHtml(c.text)}</div>
                </div>
            </div>
        `).join("");

        div.innerHTML = `
            <div class="post-header">
                ${avatarHtml}
                <div class="post-meta">
                    <h4>${escapeHtml(post.userName)}</h4>
                    <span>${formatTime(post.id)}</span>
                </div>
                ${post.userEmail === currentUser.email ? `
                    <div style="margin-left:auto;display:flex;gap:8px;">
                        <button class="action-btn edit-btn" data-id="${post.id}" title="Edit" style="padding:6px;">
                            <i class="ri-pencil-line" style="font-size:1.1rem;"></i>
                        </button>
                        <button class="action-btn delete-btn" data-id="${post.id}" title="Delete" style="padding:6px;color:var(--danger);">
                            <i class="ri-delete-bin-line" style="font-size:1.1rem;"></i>
                        </button>
                    </div>
                ` : ""}
            </div>
            
            <div class="post-content">${escapeHtml(post.text)}</div>
            ${post.image ? `<div class="post-image-container"><img src="${post.image}" class="post-image" loading="lazy"></div>` : ""}
            
            <div class="post-footer">
                <button class="action-btn like-btn" data-id="${post.id}">
                    <i class="ri-heart-${Array.isArray(post.likes) && post.likes.includes(currentUser.email) ? 'fill' : 'line'}" style="${Array.isArray(post.likes) && post.likes.includes(currentUser.email) ? 'color:var(--secondary)' : ''}"></i>
                    ${Array.isArray(post.likes) ? post.likes.length : 0} Likes
                </button>
                <button class="action-btn comment-toggle-btn" data-id="${post.id}">
                    <i class="ri-chat-1-line"></i>
                    ${comments.length} Comments
                </button>
                <button class="action-btn share-btn">
                    <i class="ri-share-forward-line"></i> Share
                </button>
            </div>

            <div class="comments-section" id="comments-${post.id}" style="padding:0 20px 20px;display:none;">
                <div class="comments-list">${commentsHtml}</div>
                <div style="display:flex;gap:8px;margin-top:12px;">
                    <input type="text" class="comment-input" placeholder="Write a comment..." data-id="${post.id}" 
                           style="flex:1;background:var(--bg-input);border:none;padding:8px 12px;border-radius:20px;color:white;">
                    <button class="btn btn-primary send-comment-btn" data-id="${post.id}" style="padding:8px 16px;border-radius:20px;">
                        <i class="ri-send-plane-fill"></i>
                    </button>
                </div>
            </div>
        `;
        feedEl.appendChild(div);
    });

    attachPostListeners();
}

function attachPostListeners() {
    // Like
    document.querySelectorAll(".like-btn").forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const id = +btn.dataset.id;
            API.toggleLike(id, currentUser.email);
            renderPosts();
        };
    });

    // Delete
    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            if (confirm("Are you sure you want to delete this post?")) {
                const id = +btn.dataset.id;
                API.deletePost(id);
                renderPosts();
            }
        };
    });

    // Edit
    document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            openEditModal(+btn.dataset.id);
        };
    });

    // Toggle Comments
    document.querySelectorAll(".comment-toggle-btn").forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const section = document.getElementById(`comments-${id}`);
            if (section) {
                section.classList.toggle("active");
                section.style.display = section.classList.contains("active") ? "block" : "none";
            }
        };
    });

    // Add Comment
    document.querySelectorAll(".send-comment-btn").forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const id = +btn.dataset.id;
            const input = document.querySelector(`.comment-input[data-id="${id}"]`);
            const text = input.value.trim();
            if (!text) return;

            const post = API.getPosts().find(p => p.id === id);
            if (post) {
                if (!post.comments) post.comments = [];
                post.comments.push({
                    id: Date.now(),
                    text: text,
                    userName: currentUser.firstName,
                    userEmail: currentUser.email
                });
                API.updatePost(post);
                renderPosts();
                // Re-open comments
                setTimeout(() => {
                    const section = document.getElementById(`comments-${id}`);
                    if (section) {
                        section.classList.add("active");
                        section.style.display = "block";
                    }
                }, 50);
            }
        };
    });
}

// Edit Modal Logic
let editingId = null;
const editModal = document.getElementById("editModal");
const editText = document.getElementById("editText");
const editImage = document.getElementById("editImage");
const saveEditBtn = document.getElementById("saveEdit");

function openEditModal(id) {
    const post = API.getPosts().find(p => p.id === id);
    if (!post) return;

    editingId = id;
    editText.value = post.text;
    editImage.value = post.image || "";
    editModal.classList.add("open");
    editModal.style.display = 'flex'; // Ensure it shows
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Run
init();
