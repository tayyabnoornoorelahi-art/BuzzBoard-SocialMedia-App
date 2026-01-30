/**
 * BuzzBoard API Service
 * 
 * This file handles all data interactions. Currently, it uses localStorage for
 * persistence on the same device. In the future, this can be updated to call
 * a real backend server (e.g., Firebase, Node.js) without changing the rest of the app.
 */

const API = {
    // --- USER AUTH ---
    login: (email, password) => {
        const users = JSON.parse(localStorage.getItem("users")) || [];
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("loggedInUser", JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, message: "Invalid credentials" };
    },

    signup: (userData) => {
        const users = JSON.parse(localStorage.getItem("users")) || [];
        if (users.find(u => u.email === userData.email)) {
            return { success: false, message: "Email already exists" };
        }
        users.push(userData);
        localStorage.setItem("users", JSON.stringify(users));

        // Auto-login
        localStorage.setItem("isLoggedIn", "true");
        // Initialize notifications for new user
        userData.notifications = [];
        localStorage.setItem("loggedInUser", JSON.stringify(userData));
        return { success: true, user: userData };
    },

    logout: () => {
        localStorage.removeItem("isLoggedIn");
        // We keep loggedInUser for quick re-login or cache, but strictly we should clear it if security is key.
        // For this demo, we'll clear it to be safe.
        localStorage.removeItem("loggedInUser");
    },

    getCurrentUser: () => {
        return JSON.parse(localStorage.getItem("loggedInUser"));
    },

    // --- POSTS ---
    getPosts: () => {
        const posts = JSON.parse(localStorage.getItem("posts")) || [];
        console.log("API.getPosts returning:", posts.length, "posts");
        return posts;
    },

    createPost: (postData) => {
        console.log("API.createPost called with:", postData);
        const posts = API.getPosts();
        posts.unshift(postData);
        localStorage.setItem("posts", JSON.stringify(posts));
        console.log("API.createPost saved. New count:", posts.length);
        return posts;
    },

    updatePost: (updatedPost) => {
        const posts = API.getPosts();
        const index = posts.findIndex(p => p.id === updatedPost.id);
        if (index !== -1) {
            posts[index] = updatedPost;
            localStorage.setItem("posts", JSON.stringify(posts));
            return true;
        }
        return false;
    },

    deletePost: (postId) => {
        let posts = API.getPosts();
        posts = posts.filter(p => p.id !== postId);
        localStorage.setItem("posts", JSON.stringify(posts));
        return posts;
    },

    // --- PROFILE ---
    updateProfile: (updatedUser) => {
        localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));

        // Also update in the main users list
        let users = JSON.parse(localStorage.getItem("users")) || [];
        let index = users.findIndex(u => u.email === updatedUser.email);
        if (index !== -1) {
            users[index] = updatedUser;
            localStorage.setItem("users", JSON.stringify(users));
        }
        return true;
    },

    // --- FOLLOW SYSTEM ---
    followUser: (targetEmail) => {
        const currentUser = API.getCurrentUser();
        if (!currentUser || currentUser.email === targetEmail) return false;

        // Initialize following array if it doesn't exist
        if (!currentUser.following) currentUser.following = [];

        // Add to following if not already following
        if (!currentUser.following.includes(targetEmail)) {
            currentUser.following.push(targetEmail);
            API.updateProfile(currentUser);

            // Trigger Notification
            API.addNotification(targetEmail, "follow", currentUser.email);

            return true;
        }
        return false;
    },

    unfollowUser: (targetEmail) => {
        const currentUser = API.getCurrentUser();
        if (!currentUser) return false;

        if (currentUser.following && currentUser.following.includes(targetEmail)) {
            currentUser.following = currentUser.following.filter(email => email !== targetEmail);
            API.updateProfile(currentUser);
            return true;
        }
        return false;
    },

    isFollowing: (targetEmail) => {
        const currentUser = API.getCurrentUser();
        return currentUser && currentUser.following && currentUser.following.includes(targetEmail);
    },

    getAllUsers: () => {
        return JSON.parse(localStorage.getItem("users")) || [];
    },

    getFollowers: (email) => {
        const users = API.getAllUsers();
        return users.filter(u => u.following && u.following.includes(email));
    },

    getFollowing: (email) => {
        const users = API.getAllUsers();
        const user = users.find(u => u.email === email);
        if (!user || !user.following) return [];
        return users.filter(u => user.following.includes(u.email));
    },

    getLikedPosts: (email) => {
        const posts = API.getPosts();
        return posts.filter(p => Array.isArray(p.likes) && p.likes.includes(email));
    },

    toggleLike: (postId, userEmail) => {
        const posts = API.getPosts();
        const post = posts.find(p => p.id === postId);
        if (post) {
            // Migration: Convert number to array if needed
            if (typeof post.likes === 'number') {
                post.likes = [];
            }
            if (!Array.isArray(post.likes)) {
                post.likes = [];
            }

            if (post.likes.includes(userEmail)) {
                post.likes = post.likes.filter(e => e !== userEmail);
            } else {
                post.likes.push(userEmail);
                // Trigger Notification (only on like, not unlike)
                if (post.userEmail !== userEmail) { // Don't notify if liking own post
                    API.addNotification(post.userEmail, "like", userEmail, postId);
                }
            }
            localStorage.setItem("posts", JSON.stringify(posts));
            return post.likes;
        }
        return [];
    },

    // --- DATA EXPORT/IMPORT ---
    exportData: () => {
        const data = {
            users: JSON.parse(localStorage.getItem("users")) || [],
            posts: JSON.parse(localStorage.getItem("posts")) || [],
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `buzzboard-data-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    importData: (jsonData) => {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

            if (data.users) {
                localStorage.setItem("users", JSON.stringify(data.users));
            }
            if (data.posts) {
                localStorage.setItem("posts", JSON.stringify(data.posts));
            }

            return { success: true, message: "Data imported successfully!" };
        } catch (error) {
            return { success: false, message: "Invalid data format: " + error.message };
        }
    },
    // --- NOTIFICATIONS ---
    addNotification: (toEmail, type, fromEmail, postId = null) => {
        const users = API.getAllUsers();
        const targetUserIndex = users.findIndex(u => u.email === toEmail);

        if (targetUserIndex !== -1) {
            const targetUser = users[targetUserIndex];
            if (!targetUser.notifications) targetUser.notifications = [];

            const newNotif = {
                id: Date.now(),
                type, // 'like', 'follow', 'comment'
                fromEmail,
                postId,
                read: false,
                timestamp: new Date().toISOString()
            };

            targetUser.notifications.unshift(newNotif);

            // Update users array
            users[targetUserIndex] = targetUser;
            localStorage.setItem("users", JSON.stringify(users));

            // If target is currently logged in, update their session too
            const currentUser = API.getCurrentUser();
            if (currentUser && currentUser.email === toEmail) {
                localStorage.setItem("loggedInUser", JSON.stringify(targetUser));
            }
        }
    },

    getNotifications: (email) => {
        const users = API.getAllUsers();
        const user = users.find(u => u.email === email);
        return user && user.notifications ? user.notifications : [];
    },

    markNotificationsRead: (email) => {
        const users = API.getAllUsers();
        const index = users.findIndex(u => u.email === email);

        if (index !== -1) {
            const user = users[index];
            if (user.notifications) {
                user.notifications.forEach(n => n.read = true);

                // Save back
                users[index] = user;
                localStorage.setItem("users", JSON.stringify(users));

                // Update session if needed
                const currentUser = API.getCurrentUser();
                if (currentUser && currentUser.email === email) {
                    localStorage.setItem("loggedInUser", JSON.stringify(user));
                }
                return true;
            }
        }
        return false;
    }
};

// Expose to window for global access
window.API = API;
