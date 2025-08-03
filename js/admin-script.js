// ===== ADMIN PANEL JAVASCRIPT FUNCTIONALITY =====

document.addEventListener('DOMContentLoaded', function() {
    // Verify admin authentication with server
    verifyAdminAuth().then(isValid => {
        if (!isValid) {
            alert('Access denied or session expired. Redirecting to admin login page.');
            window.location.href = 'admin-login.html';
            return;
        }
        
        // Initialize admin panel if authenticated
        initializeNoticeManager();
        initializeBlogManager();
        loadExistingNotices();
        loadExistingBlogs();
        updateStatistics();
        updateBlogStatistics();
    });
});

async function verifyAdminAuth() {
    try {
        const isAuth = localStorage.getItem('adminAuth');
        const token = localStorage.getItem('adminToken');
        const expires = localStorage.getItem('adminExpires');
        
        // Check basic localStorage auth
        if (!isAuth || isAuth !== 'true') {
            return false;
        }
        
        // Check token expiration
        if (expires && Date.now() > parseInt(expires)) {
            localStorage.removeItem('adminAuth');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminExpires');
            return false;
        }
        
        // Verify with server if token exists
        if (token) {
            // Use Netlify Functions for deployed version, fallback to local API for development
            const apiEndpoint = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? '/api/auth/verify' 
                : '/.netlify/functions/auth-verify';
                
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token })
            });
            
            if (!response.ok) {
                localStorage.removeItem('adminAuth');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminExpires');
                return false;
            }
        }
        
        return true;
    } catch (error) {
        // Allow access if server is unavailable but localStorage is valid
        return localStorage.getItem('adminAuth') === 'true';
    }
}

let editingNoticeId = null;
let editingBlogId = null;

// Add secure logout function
function secureLogout() {
    // Clear all authentication data
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminExpires');
    
    // Redirect to login page
    window.location.href = 'admin-login.html';
}

// Add logout event listener if logout button exists
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn') || document.querySelector('[data-action="logout"]');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                secureLogout();
            }
        });
    }
});

function initializeNoticeManager() {
    // Initialize notices in localStorage if not present
    if (!localStorage.getItem('afterlife_notices')) {
        const defaultNotices = generateDefaultNotices();
        localStorage.setItem('afterlife_notices', JSON.stringify(defaultNotices));
    }
}

function generateDefaultNotices() {
    return [
        {
            id: Date.now() - 7000,
            title: "Server Maintenance Scheduled",
            type: "urgent",
            content: "We will be performing scheduled maintenance on our servers this weekend. Some services may be temporarily unavailable during this time.",
            priority: "high",
            author: "Admin Team",
            time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            isNew: false
        },
        {
            id: Date.now() - 6000,
            title: "Security Update Required",
            type: "urgent",
            content: "Please update your passwords immediately. We've detected unusual activity and are taking precautionary measures to protect your account.",
            priority: "high",
            author: "Security Team",
            time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            isNew: false
        },
        {
            id: Date.now() - 5000,
            title: "New Features Released",
            type: "important",
            content: "We've released several new features including improved streaming quality, enhanced user profiles, and better notification management.",
            priority: "medium",
            author: "Dev Team",
            time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            isNew: false
        },
        {
            id: Date.now() - 4000,
            title: "Terms of Service Update",
            type: "important",
            content: "We've updated our Terms of Service to better protect your privacy and clarify our data usage policies. Please review the changes.",
            priority: "medium",
            author: "Admin Team",
            time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            isNew: false
        },
        {
            id: Date.now() - 3000,
            title: "Championship Tournament Announcement",
            type: "important",
            content: "The annual Afterlife Championship is coming! Registration opens next week with a prize pool of $10,000. Don't miss this opportunity!",
            priority: "medium",
            author: "Events Team",
            time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            isNew: false
        },
        {
            id: Date.now() - 2000,
            title: "New Tournament Registration Open",
            type: "info",
            content: "Registration for our upcoming MLBB tournament is now open! Join us for exciting matches and amazing prizes.",
            priority: "low",
            author: "Events Team",
            time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            isNew: false
        },
        {
            id: Date.now() - 1000,
            title: "Weekly Community Roundup",
            type: "general",
            content: "Check out this week's highlights from our amazing community members, including top streams, best plays, and upcoming events.",
            priority: "low",
            author: "Community Team",
            time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            isNew: false
        }
    ];
}

document.getElementById('noticeForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('noticeTitle').value.trim();
    const type = document.getElementById('noticeType').value;
    const teamRaw = document.getElementById('noticeTeam').value;
    const team = teamRaw.replace(/^[^\w\s]+\s*/, ''); // Remove emoji prefix
    const content = document.getElementById('noticeContent').value.trim();
    const priority = document.getElementById('noticePriority').value;
    
    if (!title || !content || !team) {
        showMessage('Please fill in all required fields including title, content, and team.', 'error');
        return;
    }

    const existingNotices = JSON.parse(localStorage.getItem('afterlife_notices') || '[]');
    
    if (editingNoticeId) {
        // Update existing notice
        const noticeIndex = existingNotices.findIndex(n => n.id === editingNoticeId);
        if (noticeIndex !== -1) {
            existingNotices[noticeIndex] = {
                ...existingNotices[noticeIndex],
                title: title,
                type: type,
                content: content,
                priority: priority,
                author: team,
                time: existingNotices[noticeIndex].time, // Keep original time
                lastModified: new Date().toISOString()
            };
            showMessage('Notice updated successfully!', 'success');
        }
        editingNoticeId = null;
        document.querySelector('#noticeForm button[type="submit"]').textContent = 'Add Notice';
        document.getElementById('cancelEditBtn').style.display = 'none';
    } else {
        // Create new notice
        const newNotice = {
            id: Date.now(),
            title: title,
            type: type,
            content: content,
            priority: priority,
            author: team,
            time: new Date().toISOString(),
            isNew: true
        };
        existingNotices.unshift(newNotice);
        showMessage('Notice added successfully!', 'success');
    }

    localStorage.setItem('afterlife_notices', JSON.stringify(existingNotices));
    localStorage.setItem('notices_updated', Date.now().toString());
    
    this.reset();
    loadExistingNotices();
    updateStatistics();
});

function loadExistingNotices() {
    const noticeList = document.getElementById('noticeList');
    const notices = JSON.parse(localStorage.getItem('afterlife_notices') || '[]');
    
    if (notices.length === 0) {
        noticeList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No notices found. Create your first notice above!</p>';
        return;
    }
    
    noticeList.innerHTML = notices.map(notice => `
        <div class="notice-item" data-notice-id="${notice.id}">
            <div class="notice-item-checkbox">
                <input type="checkbox" name="noticeSelect" value="${notice.id}" class="notice-checkbox" style="transform: scale(1.2);">
            </div>
            <div class="notice-item-content">
                <div class="notice-header">
                    <h4 style="margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                        ${notice.title}
                        ${notice.featured ? '<span class="featured-indicator" style="background: var(--warning); color: black; padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600;"><i class="fas fa-star"></i> PINNED</span>' : ''}
                    </h4>
                    <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                        <span class="notice-badge ${notice.type}" style="background: var(--${getTypeColor(notice.type)}); color: ${getTypeTextColor(notice.type)}; padding: 0.25rem 0.5rem; margin-right: 0.5rem; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; border-radius: 4px;">${notice.type}</span>
                        <span style="margin-right: 1rem;"><i class="fas fa-users"></i> ${notice.author}</span>
                        <span style="margin-right: 1rem;"><i class="fas fa-clock"></i> ${formatTime(notice.time)}</span>
                        <span style="margin-right: 1rem;"><i class="fas fa-flag"></i> ${notice.priority || 'medium'} priority</span>
                        ${notice.lastModified ? '<span style="color: var(--warning); margin-right: 1rem;"><i class="fas fa-edit"></i> Modified</span>' : ''}
                        <span style="color: var(--text-secondary); font-size: 0.7rem;">ID: #${notice.id.toString().slice(-6)}</span>
                    </div>
                </div>
                <p style="margin: 0.5rem 0; color: var(--text-secondary); line-height: 1.4;">${notice.content.substring(0, 150)}${notice.content.length > 150 ? '...' : ''}</p>
            </div>
            <div class="notice-item-actions">
                <button class="admin-btn secondary" onclick="editNotice(${notice.id})" style="padding: 0.5rem 1rem; margin: 0 0.25rem;" title="Edit Notice">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="admin-btn ${notice.featured ? 'warning' : 'secondary'}" onclick="toggleFeatured(${notice.id})" style="padding: 0.5rem 1rem; margin: 0 0.25rem;" title="${notice.featured ? 'Unpin Notice' : 'Pin Notice'}">
                    <i class="fas fa-star"></i> ${notice.featured ? 'Unpin' : 'Pin'}
                </button>
                <button class="admin-btn secondary" onclick="duplicateNotice(${notice.id})" style="padding: 0.5rem 1rem; margin: 0 0.25rem;" title="Duplicate Notice">
                    <i class="fas fa-copy"></i> Copy
                </button>
                <button class="admin-btn danger" onclick="deleteNotice(${notice.id})" style="padding: 0.5rem 1rem; margin: 0 0.25rem;" title="Delete Notice">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');

    // Update the CSS for better layout
    updateNoticeItemStyles();
}

function updateNoticeItemStyles() {
    const existingStyle = document.getElementById('notice-item-styles');
    if (existingStyle) return;

    const style = document.createElement('style');
    style.id = 'notice-item-styles';
    style.textContent = `
        .notice-item {
            background: var(--bg-primary);
            border: 2px solid var(--black);
            padding: 1rem;
            margin-bottom: 1rem;
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            border-radius: 8px;
            transition: all 0.2s ease;
        }

        .notice-item:hover {
            transform: translateY(-2px);
            box-shadow: 4px 4px 0px var(--black);
        }

        .notice-item-checkbox {
            display: flex;
            align-items: center;
            margin-top: 0.25rem;
        }

        .notice-item-content {
            flex: 1;
        }

        .notice-item-actions {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            min-width: auto;
        }

        @media (max-width: 768px) {
            .notice-item {
                flex-direction: column;
            }
            
            .notice-item-actions {
                flex-direction: row;
                flex-wrap: wrap;
                width: 100%;
            }
            
            .notice-item-actions button {
                flex: 1;
                min-width: 80px;
            }
        }

        .featured-indicator {
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

function getTypeColor(type) {
    switch(type) {
        case 'urgent': return 'danger';
        case 'important': return 'warning';
        case 'info': return 'secondary';
        case 'general': return 'success';
        default: return 'secondary';
    }
}

function getTypeTextColor(type) {
    switch(type) {
        case 'urgent': return 'white';
        case 'important': return 'black';
        case 'info': return 'black';
        case 'general': return 'white';
        default: return 'black';
    }
}

function updateStatistics() {
    const notices = JSON.parse(localStorage.getItem('afterlife_notices') || '[]');
    
    document.getElementById('totalNotices').textContent = notices.length;
    document.getElementById('urgentNotices').textContent = notices.filter(n => n.type === 'urgent').length;
    document.getElementById('importantNotices').textContent = notices.filter(n => n.type === 'important').length;
    document.getElementById('infoNotices').textContent = notices.filter(n => n.type === 'info').length;
}

function deleteNotice(id) {
    if (!confirm('Are you sure you want to delete this notice? This action cannot be undone.')) {
        return;
    }
    
    const notices = JSON.parse(localStorage.getItem('afterlife_notices') || '[]');
    const updatedNotices = notices.filter(notice => notice.id !== id);
    
    localStorage.setItem('afterlife_notices', JSON.stringify(updatedNotices));
    localStorage.setItem('notices_updated', Date.now().toString());
    
    showMessage('Notice deleted successfully!', 'success');
    loadExistingNotices();
    updateStatistics();
}

function editNotice(id) {
    const notices = JSON.parse(localStorage.getItem('afterlife_notices') || '[]');
    const notice = notices.find(n => n.id === id);
    
    if (notice) {
        // Populate form with notice data
        document.getElementById('noticeTitle').value = notice.title;
        document.getElementById('noticeType').value = notice.type;
        // Remove emoji from author name for matching with select options
        const cleanAuthor = notice.author ? notice.author.replace(/^[^\w\s]+\s*/, '') : 'Admin Team';
        document.getElementById('noticeTeam').value = cleanAuthor;
        document.getElementById('noticeContent').value = notice.content;
        document.getElementById('noticePriority').value = notice.priority;
        
        // Set editing mode
        editingNoticeId = id;
        document.querySelector('#noticeForm button[type="submit"]').textContent = 'Update Notice';
        document.getElementById('cancelEditBtn').style.display = 'block';
        
        // Scroll to form
        document.getElementById('noticeForm').scrollIntoView({ behavior: 'smooth' });
        
        showMessage('Notice loaded for editing. Make your changes and click "Update Notice".', 'info');
    }
}

function toggleFeatured(id) {
    const notices = JSON.parse(localStorage.getItem('afterlife_notices') || '[]');
    const noticeIndex = notices.findIndex(n => n.id === id);
    
    if (noticeIndex !== -1) {
        notices[noticeIndex].featured = !notices[noticeIndex].featured;
        localStorage.setItem('afterlife_notices', JSON.stringify(notices));
        localStorage.setItem('notices_updated', Date.now().toString());
        
        const action = notices[noticeIndex].featured ? 'pinned' : 'unpinned';
        showMessage(`Notice ${action} successfully!`, 'success');
        loadExistingNotices();
    }
}

function cancelEdit() {
    editingNoticeId = null;
    document.getElementById('noticeForm').reset();
    document.querySelector('#noticeForm button[type="submit"]').textContent = 'Add Notice';
    document.getElementById('cancelEditBtn').style.display = 'none';
    showMessage('Edit cancelled.', 'info');
}

function duplicateNotice(id) {
    const notices = JSON.parse(localStorage.getItem('afterlife_notices') || '[]');
    const notice = notices.find(n => n.id === id);
    
    if (notice) {
        const duplicatedNotice = {
            ...notice,
            id: Date.now(),
            title: notice.title + ' (Copy)',
            author: notice.author || 'Admin Team',
            time: new Date().toISOString(),
            isNew: true
        };
        
        notices.unshift(duplicatedNotice);
        localStorage.setItem('afterlife_notices', JSON.stringify(notices));
        localStorage.setItem('notices_updated', Date.now().toString());
        
        showMessage('Notice duplicated successfully!', 'success');
        loadExistingNotices();
        updateStatistics();
    }
}

function bulkDeleteNotices() {
    const selectedNotices = document.querySelectorAll('input[name="noticeSelect"]:checked');
    if (selectedNotices.length === 0) {
        showMessage('Please select notices to delete.', 'warning');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedNotices.length} notices? This action cannot be undone.`)) {
        return;
    }
    
    const notices = JSON.parse(localStorage.getItem('afterlife_notices') || '[]');
    const idsToDelete = Array.from(selectedNotices).map(checkbox => parseInt(checkbox.value));
    const updatedNotices = notices.filter(notice => !idsToDelete.includes(notice.id));
    
    localStorage.setItem('afterlife_notices', JSON.stringify(updatedNotices));
    localStorage.setItem('notices_updated', Date.now().toString());
    
    showMessage(`${selectedNotices.length} notices deleted successfully!`, 'success');
    loadExistingNotices();
    updateStatistics();
}

function selectAllNotices() {
    const checkboxes = document.querySelectorAll('input[name="noticeSelect"]');
    checkboxes.forEach(checkbox => checkbox.checked = true);
}

function deselectAllNotices() {
    const checkboxes = document.querySelectorAll('input[name="noticeSelect"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
}

function exportNotices() {
    const notices = JSON.parse(localStorage.getItem('afterlife_notices') || '[]');
    if (notices.length === 0) {
        showMessage('No notices to export.', 'warning');
        return;
    }

    const dataStr = JSON.stringify(notices, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `afterlife-notices-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showMessage('Notices exported successfully!', 'success');
}

function refreshNoticeList() {
    loadExistingNotices();
    updateStatistics();
    showMessage('Notice list refreshed!', 'info');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminAuth');
        window.location.href = 'admin-login.html';
    }
}

function showMessage(message, type) {
    const container = document.getElementById('messageContainer');
    container.innerHTML = `<div class="${type}-message">${message}</div>`;
    
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

function formatTime(timeString) {
    const date = new Date(timeString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hours ago`;
    } else {
        return `${diffDays} days ago`;
    }
}

function openAdminGiveawayTool() {
    // Open tools page in admin mode
    window.open('tools.html?admin=true&tool=giveaway', '_blank');
}

function openAdminAnalyticsTool() {
    // Open tools page in admin mode
    window.open('tools.html?admin=true&tool=analytics', '_blank');
}

function openAdminCommunityTool() {
    // Open tools page in admin mode
    window.open('tools.html?admin=true&tool=community', '_blank');
}

function showGiveawayTool() {
    document.getElementById('giveawayModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideGiveawayTool() {
    document.getElementById('giveawayModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function showAnalyticsTool() {
    document.getElementById('analyticsModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideAnalyticsTool() {
    document.getElementById('analyticsModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function showCommunityTool() {
    document.getElementById('communityModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideCommunityTool() {
    document.getElementById('communityModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function analyzeSubscribers() {
    alert('Giveaway analysis would run here using pre-configured API credentials. This is a demo version.');
}

function refreshAnalytics() {
    alert('Analytics would refresh here using pre-configured API credentials. This is a demo version.');
}

// Blog Management Functions
function initializeBlogManager() {
    // Initialize blog posts in localStorage if not present
    if (!localStorage.getItem('afterlife_blogs')) {
        const defaultBlogs = generateDefaultBlogs();
        localStorage.setItem('afterlife_blogs', JSON.stringify(defaultBlogs));
    }
}

function generateDefaultBlogs() {
    return [
        {
            id: Date.now() - 10000,
            title: "Welcome to Afterlife: A New Gaming Community",
            excerpt: "We're excited to announce the launch of Afterlife, a revolutionary gaming platform that brings together streamers, gamers, and content creators in one unified ecosystem.",
            content: `
                <h2>A New Era of Gaming Community</h2>
                <p>Welcome to Afterlife, where gaming transcends boundaries and creates lasting connections. Our platform is designed to revolutionize how gamers interact, compete, and grow together.</p>
                
                <h3>What Makes Us Different</h3>
                <p>At Afterlife, we believe in fostering genuine connections within the gaming community. Our platform offers unique features that set us apart from traditional gaming platforms:</p>
                
                <ul>
                    <li><strong>Integrated Streaming:</strong> Seamless live streaming capabilities with interactive features</li>
                    <li><strong>Community Tools:</strong> Advanced tools for tournament organization and community management</li>
                    <li><strong>Creator Support:</strong> Comprehensive support system for content creators and streamers</li>
                    <li><strong>Cross-Platform Integration:</strong> Works seamlessly across all major gaming platforms</li>
                </ul>
                
                <h3>Our Vision</h3>
                <p>We envision a world where every gamer, regardless of skill level or background, can find their place in a supportive and engaging community. Afterlife is more than just a platform – it's a movement towards better, more inclusive gaming experiences.</p>
                
                <p>Join us on this incredible journey as we shape the future of gaming together!</p>
            `,
            author: "Afterlife Team",
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            category: "Announcement",
            tags: ["gaming", "community", "launch"],
            likes: 45,
            dislikes: 2,
            comments: []
        }
    ];
}

document.getElementById('blogForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('blogTitle').value.trim();
    const category = document.getElementById('blogCategory').value;
    const author = document.getElementById('blogAuthor').value.trim();
    const tags = document.getElementById('blogTags').value.trim();
    const excerpt = document.getElementById('blogExcerpt').value.trim();
    const content = document.getElementById('blogContent').value.trim();
    
    if (!title || !excerpt || !content || !author) {
        showBlogMessage('Please fill in all required fields.', 'error');
        return;
    }

    const existingBlogs = JSON.parse(localStorage.getItem('afterlife_blogs') || '[]');
    
    if (editingBlogId) {
        // Update existing blog
        const blogIndex = existingBlogs.findIndex(b => b.id === editingBlogId);
        if (blogIndex !== -1) {
            existingBlogs[blogIndex] = {
                ...existingBlogs[blogIndex],
                title: title,
                category: category,
                author: author,
                tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                excerpt: excerpt,
                content: content,
                lastModified: new Date().toISOString()
            };
            showBlogMessage('Blog post updated successfully!', 'success');
        }
        editingBlogId = null;
        document.querySelector('#blogForm button[type="submit"]').textContent = 'Publish Blog Post';
        document.getElementById('cancelBlogEditBtn').style.display = 'none';
    } else {
        // Create new blog
        const newBlog = {
            id: Date.now(),
            title: title,
            category: category,
            author: author,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            excerpt: excerpt,
            content: content,
            date: new Date().toISOString(),
            likes: 0,
            dislikes: 0,
            comments: []
        };
        existingBlogs.unshift(newBlog);
        showBlogMessage('Blog post published successfully!', 'success');
    }

    localStorage.setItem('afterlife_blogs', JSON.stringify(existingBlogs));
    
    this.reset();
    document.getElementById('blogAuthor').value = 'Admin Team'; // Reset to default
    loadExistingBlogs();
    updateBlogStatistics();
});

function loadExistingBlogs() {
    const blogList = document.getElementById('blogList');
    const blogs = JSON.parse(localStorage.getItem('afterlife_blogs') || '[]');
    
    if (blogs.length === 0) {
        blogList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No blog posts found. Create your first blog post above!</p>';
        return;
    }
    
    blogList.innerHTML = blogs.map(blog => `
        <div class="notice-item" data-blog-id="${blog.id}">
            <div class="notice-item-checkbox">
                <input type="checkbox" name="blogSelect" value="${blog.id}" class="notice-checkbox" style="transform: scale(1.2);">
            </div>
            <div class="notice-item-content">
                <div class="notice-header">
                    <h4 style="margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                        ${blog.title}
                    </h4>
                    <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                        <span class="notice-badge ${blog.category.toLowerCase().replace(' ', '-')}" style="background: var(--primary); color: white; padding: 0.25rem 0.5rem; margin-right: 0.5rem; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; border-radius: 4px;">${blog.category}</span>
                        <span style="margin-right: 1rem;"><i class="fas fa-user"></i> ${blog.author}</span>
                        <span style="margin-right: 1rem;"><i class="fas fa-clock"></i> ${formatTime(blog.date)}</span>
                        <span style="margin-right: 1rem;"><i class="fas fa-thumbs-up"></i> ${blog.likes || 0} likes</span>
                        <span style="margin-right: 1rem;"><i class="fas fa-comment"></i> ${(blog.comments || []).length} comments</span>
                        ${blog.lastModified ? '<span style="color: var(--warning); margin-right: 1rem;"><i class="fas fa-edit"></i> Modified</span>' : ''}
                        <span style="color: var(--text-secondary); font-size: 0.7rem;">ID: #${blog.id.toString().slice(-6)}</span>
                    </div>
                </div>
                <p style="margin: 0.5rem 0; color: var(--text-secondary); line-height: 1.4;">${blog.excerpt.substring(0, 150)}${blog.excerpt.length > 150 ? '...' : ''}</p>
                ${blog.tags && blog.tags.length > 0 ? `<div style="margin-top: 0.5rem;"><small style="color: var(--text-secondary);"><i class="fas fa-tags"></i> ${blog.tags.join(', ')}</small></div>` : ''}
            </div>
            <div class="notice-item-actions">
                <button class="admin-btn secondary" onclick="editBlog(${blog.id})" style="padding: 0.5rem 1rem; margin: 0 0.25rem;" title="Edit Blog Post">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="admin-btn secondary" onclick="duplicateBlog(${blog.id})" style="padding: 0.5rem 1rem; margin: 0 0.25rem;" title="Duplicate Blog Post">
                    <i class="fas fa-copy"></i> Copy
                </button>
                <button class="admin-btn danger" onclick="deleteBlog(${blog.id})" style="padding: 0.5rem 1rem; margin: 0 0.25rem;" title="Delete Blog Post">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function updateBlogStatistics() {
    const blogs = JSON.parse(localStorage.getItem('afterlife_blogs') || '[]');
    const categories = [...new Set(blogs.map(blog => blog.category))];
    
    document.getElementById('totalBlogs').textContent = blogs.length;
    document.getElementById('totalBlogLikes').textContent = blogs.reduce((sum, blog) => sum + (blog.likes || 0), 0);
    document.getElementById('totalBlogComments').textContent = blogs.reduce((sum, blog) => sum + (blog.comments ? blog.comments.length : 0), 0);
    document.getElementById('blogCategories').textContent = categories.length;
}

function deleteBlog(id) {
    if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
        return;
    }
    
    const blogs = JSON.parse(localStorage.getItem('afterlife_blogs') || '[]');
    const updatedBlogs = blogs.filter(blog => blog.id !== id);
    
    localStorage.setItem('afterlife_blogs', JSON.stringify(updatedBlogs));
    
    showBlogMessage('Blog post deleted successfully!', 'success');
    loadExistingBlogs();
    updateBlogStatistics();
}

function editBlog(id) {
    const blogs = JSON.parse(localStorage.getItem('afterlife_blogs') || '[]');
    const blog = blogs.find(b => b.id === id);
    
    if (blog) {
        // Populate form with blog data
        document.getElementById('blogTitle').value = blog.title;
        document.getElementById('blogCategory').value = blog.category;
        document.getElementById('blogAuthor').value = blog.author;
        document.getElementById('blogTags').value = blog.tags ? blog.tags.join(', ') : '';
        document.getElementById('blogExcerpt').value = blog.excerpt;
        document.getElementById('blogContent').value = blog.content;
        
        // Set editing mode
        editingBlogId = id;
        document.querySelector('#blogForm button[type="submit"]').textContent = 'Update Blog Post';
        document.getElementById('cancelBlogEditBtn').style.display = 'block';
        
        // Scroll to form
        document.getElementById('blogForm').scrollIntoView({ behavior: 'smooth' });
        
        showBlogMessage('Blog post loaded for editing. Make your changes and click "Update Blog Post".', 'info');
    }
}

function cancelBlogEdit() {
    editingBlogId = null;
    document.getElementById('blogForm').reset();
    document.getElementById('blogAuthor').value = 'Admin Team'; // Reset to default
    document.querySelector('#blogForm button[type="submit"]').textContent = 'Publish Blog Post';
    document.getElementById('cancelBlogEditBtn').style.display = 'none';
    showBlogMessage('Edit cancelled.', 'info');
}

function duplicateBlog(id) {
    const blogs = JSON.parse(localStorage.getItem('afterlife_blogs') || '[]');
    const blog = blogs.find(b => b.id === id);
    
    if (blog) {
        const duplicatedBlog = {
            ...blog,
            id: Date.now(),
            title: blog.title + ' (Copy)',
            date: new Date().toISOString(),
            likes: 0,
            dislikes: 0,
            comments: []
        };
        
        blogs.unshift(duplicatedBlog);
        localStorage.setItem('afterlife_blogs', JSON.stringify(blogs));
        
        showBlogMessage('Blog post duplicated successfully!', 'success');
        loadExistingBlogs();
        updateBlogStatistics();
    }
}

function bulkDeleteBlogs() {
    const selectedBlogs = document.querySelectorAll('input[name="blogSelect"]:checked');
    if (selectedBlogs.length === 0) {
        showBlogMessage('Please select blog posts to delete.', 'warning');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedBlogs.length} blog posts? This action cannot be undone.`)) {
        return;
    }
    
    const blogs = JSON.parse(localStorage.getItem('afterlife_blogs') || '[]');
    const idsToDelete = Array.from(selectedBlogs).map(checkbox => parseInt(checkbox.value));
    const updatedBlogs = blogs.filter(blog => !idsToDelete.includes(blog.id));
    
    localStorage.setItem('afterlife_blogs', JSON.stringify(updatedBlogs));
    
    showBlogMessage(`${selectedBlogs.length} blog posts deleted successfully!`, 'success');
    loadExistingBlogs();
    updateBlogStatistics();
}

function selectAllBlogs() {
    const checkboxes = document.querySelectorAll('input[name="blogSelect"]');
    checkboxes.forEach(checkbox => checkbox.checked = true);
}

function deselectAllBlogs() {
    const checkboxes = document.querySelectorAll('input[name="blogSelect"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
}

function exportBlogs() {
    const blogs = JSON.parse(localStorage.getItem('afterlife_blogs') || '[]');
    if (blogs.length === 0) {
        showBlogMessage('No blog posts to export.', 'warning');
        return;
    }

    const dataStr = JSON.stringify(blogs, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `afterlife-blogs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showBlogMessage('Blog posts exported successfully!', 'success');
}

function refreshBlogList() {
    loadExistingBlogs();
    updateBlogStatistics();
    showBlogMessage('Blog list refreshed!', 'info');
}

function showBlogMessage(message, type) {
    const container = document.getElementById('blogMessageContainer');
    container.innerHTML = `<div class="${type}-message">${message}</div>`;
    
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        hideGiveawayTool();
        hideAnalyticsTool();
        hideCommunityTool();
    }
});

// Loading Screen
window.addEventListener('load', function() {
    setTimeout(() => {
        document.getElementById('loadingScreen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
        }, 300);
    }, 1000);
});

// Notification System
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type} animate-slide-in-right`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" aria-label="Close notification">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Mobile menu is handled by MobileMenuManager in theme-toggle.js
// No need for duplicate setup here