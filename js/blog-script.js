// Blog Management System
let currentBlogId = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeBlogSystem();
    loadBlogPosts();
    updateBlogStats();
    initializeFilters();
    
    // Initialize user interactions storage
    if (!localStorage.getItem('blog_interactions')) {
        localStorage.setItem('blog_interactions', JSON.stringify({}));
    }
    
    // Mobile menu is handled by MobileMenuManager in theme-toggle.js
    // No need for duplicate setup here
    
    // Back to top button
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });
        
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Close modal on escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeBlogModal();
        }
    });
    
    // Close modal on overlay click
    const blogModal = document.getElementById('blogModal');
    if (blogModal) {
        blogModal.addEventListener('click', function(event) {
            if (event.target === this) {
                closeBlogModal();
            }
        });
    }
});

function initializeBlogSystem() {
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
        },
        {
            id: Date.now() - 20000,
            title: "Top 5 MLBB Strategies for Competitive Play",
            excerpt: "Master the art of Mobile Legends: Bang Bang with these proven strategies used by professional players in ranked matches and tournaments.",
            content: `
                <h2>Dominate the Battlefield</h2>
                <p>Mobile Legends: Bang Bang continues to be one of the most competitive MOBA games. Whether you're climbing the ranked ladder or preparing for tournaments, these strategies will give you the edge you need.</p>
                
                <h3>1. Master the Draft Phase</h3>
                <p>The draft phase is where games are won or lost. Understanding hero synergies, counter-picks, and team composition is crucial for success.</p>
                
                <h3>2. Map Control and Vision</h3>
                <p>Control key areas of the map and maintain vision to secure objectives and prevent ganks. Ward placement can make or break your team's performance.</p>
                
                <h3>3. Timing Your Team Fights</h3>
                <p>Know when to engage and when to disengage. Perfect timing can turn a losing game into a victory.</p>
                
                <h3>4. Resource Management</h3>
                <p>Efficient farming, jungle control, and gold distribution among team members are essential for maintaining your advantage.</p>
                
                <h3>5. Communication is Key</h3>
                <p>Coordinate with your team using quick chat, voice communication, and clear callouts to maximize your team's potential.</p>
                
                <p>Practice these strategies consistently, and you'll see significant improvement in your gameplay and ranking!</p>
            `,
            author: "ProGamer Mike",
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            category: "Gaming Guide",
            tags: ["MLBB", "strategy", "competitive"],
            likes: 78,
            dislikes: 5,
            comments: []
        },
        {
            id: Date.now() - 30000,
            title: "Behind the Scenes: Building Afterlife's Streaming Technology",
            excerpt: "Discover the cutting-edge technology that powers Afterlife's seamless streaming experience and learn about our innovative approach to content delivery.",
            content: `
                <h2>Innovation in Streaming Technology</h2>
                <p>Building a robust streaming platform requires innovative solutions and cutting-edge technology. Today, we're pulling back the curtain to show you how Afterlife delivers exceptional streaming experiences.</p>
                
                <h3>Low-Latency Streaming</h3>
                <p>Our proprietary streaming protocol reduces latency to less than 1 second, enabling real-time interaction between streamers and their audience.</p>
                
                <h3>Adaptive Bitrate Technology</h3>
                <p>Our smart encoding system automatically adjusts video quality based on viewer's connection speed, ensuring smooth playback for everyone.</p>
                
                <h3>Global Content Delivery Network</h3>
                <p>With servers strategically placed around the world, we minimize buffering and provide consistent streaming quality regardless of geographic location.</p>
                
                <h3>AI-Powered Features</h3>
                <p>Machine learning algorithms help with automatic content moderation, stream quality optimization, and personalized content recommendations.</p>
                
                <h3>Developer-Friendly APIs</h3>
                <p>Our comprehensive API suite allows developers to integrate Afterlife's streaming capabilities into their own applications and games.</p>
                
                <p>This is just the beginning. We're constantly innovating to provide the best possible experience for our community!</p>
            `,
            author: "Tech Team Lead",
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            category: "Technology",
            tags: ["streaming", "technology", "innovation"],
            likes: 92,
            dislikes: 3,
            comments: []
        },
        {
            id: Date.now() - 40000,
            title: "Community Spotlight: Rising Stars in Competitive Gaming",
            excerpt: "Meet the talented gamers who are making waves in the competitive scene and learn about their journey to success through the Afterlife platform.",
            content: `
                <h2>Celebrating Our Community Champions</h2>
                <p>The Afterlife community is home to incredible talent across various gaming disciplines. Today, we're highlighting some of our rising stars who have achieved remarkable success.</p>
                
                <h3>Sarah "StormQueen" Chen - MLBB Champion</h3>
                <p>From casual player to professional esports athlete, Sarah's journey showcases the power of dedication and community support. Her innovative mage strategies have revolutionized the meta.</p>
                
                <h3>Alex "ShadowStrike" Rodriguez - FPS Prodigy</h3>
                <p>Alex's incredible aim and tactical awareness have made him one of the most feared players in competitive FPS games. His streaming content has inspired thousands of players.</p>
                
                <h3>Team Phoenix - Rising Tournament Champions</h3>
                <p>This five-member team met through Afterlife's community features and went on to win three major tournaments. Their teamwork and synergy are unmatched.</p>
                
                <h3>Luna "CodeBreaker" Kim - Strategy Mastermind</h3>
                <p>Luna's analytical approach to strategy games and her educational content have helped countless players improve their gameplay and understanding of complex mechanics.</p>
                
                <h3>How to Get Featured</h3>
                <p>Want to be featured in our next community spotlight? Engage with the community, share your knowledge, and participate in tournaments and events. We're always looking for inspiring stories!</p>
                
                <p>Congratulations to all our featured players and keep up the amazing work!</p>
            `,
            author: "Community Manager",
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            category: "Community",
            tags: ["community", "esports", "featured"],
            likes: 156,
            dislikes: 1,
            comments: []
        },
        {
            id: Date.now() - 50000,
            title: "Upcoming Features: What's Next for Afterlife",
            excerpt: "Get an exclusive preview of the exciting new features coming to Afterlife, including enhanced tournament systems, creator tools, and community features.",
            content: `
                <h2>The Future of Afterlife</h2>
                <p>We're constantly working to improve and expand the Afterlife platform. Here's a sneak peek at some exciting features coming your way in the next few months.</p>
                
                <h3>Enhanced Tournament System</h3>
                <p>Our new tournament framework will support larger competitions, better bracket management, and integrated streaming for all matches. Organizers will have powerful tools to create professional-level events.</p>
                
                <h3>Creator Monetization Platform</h3>
                <p>We're launching comprehensive monetization tools including subscriber tiers, virtual gifts, sponsored content management, and direct fan support options.</p>
                
                <h3>Advanced Analytics Dashboard</h3>
                <p>Streamers and content creators will get access to detailed analytics including audience insights, engagement metrics, and growth tracking tools.</p>
                
                <h3>Mobile App Launch</h3>
                <p>Our native mobile apps for iOS and Android will bring the full Afterlife experience to your pocket, with optimized interfaces for mobile gaming and streaming.</p>
                
                <h3>AI-Powered Coaching</h3>
                <p>Integrated AI coaching will analyze gameplay footage and provide personalized improvement suggestions for players looking to level up their skills.</p>
                
                <h3>Community Voting</h3>
                <p>We want to hear from you! Join our community forums to vote on which features should be prioritized and share your ideas for future improvements.</p>
                
                <p>Stay tuned for more updates as we continue to build the ultimate gaming platform together!</p>
            `,
            author: "Product Team",
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            category: "Updates",
            tags: ["features", "roadmap", "updates"],
            likes: 203,
            dislikes: 8,
            comments: []
        }
    ];
}

function loadBlogPosts() {
    const blogs = JSON.parse(localStorage.getItem('afterlife_blogs') || '[]');
    displayBlogPosts(blogs);
}

function displayBlogPosts(blogs) {
    const blogGrid = document.getElementById('blogGrid');
    const interactions = JSON.parse(localStorage.getItem('blog_interactions') || '{}');
    
    if (blogs.length === 0) {
        blogGrid.innerHTML = `
            <div class="no-blogs">
                <i class="fas fa-blog" style="font-size: 4rem; color: var(--primary); margin-bottom: 1rem;"></i>
                <h3>No blog posts yet</h3>
                <p>Check back later for exciting content from our community!</p>
            </div>
        `;
        return;
    }
    
    blogGrid.innerHTML = blogs.map(blog => {
        const userInteraction = interactions[blog.id] || {};
        return `
            <div class="blog-card animate-fade-in" onclick="openBlogModal(${blog.id})">
                <div class="blog-image">
                    <i class="fas fa-${getCategoryIcon(blog.category)}"></i>
                </div>
                <div class="blog-content">
                    <h3 class="blog-title">${blog.title}</h3>
                    <div class="blog-meta">
                        <span><i class="fas fa-user"></i> ${blog.author}</span>
                        <span><i class="fas fa-calendar"></i> ${formatDate(blog.date)}</span>
                        <span><i class="fas fa-tag"></i> ${blog.category}</span>
                    </div>
                    <p class="blog-excerpt">${blog.excerpt}</p>
                    <div class="blog-actions">
                        <div class="interaction-buttons">
                            <button class="interaction-btn ${userInteraction.liked ? 'liked' : ''}" onclick="event.stopPropagation(); toggleLike(${blog.id})">
                                <i class="fas fa-thumbs-up"></i>
                                <span>${blog.likes || 0}</span>
                            </button>
                            <button class="interaction-btn ${userInteraction.disliked ? 'disliked' : ''}" onclick="event.stopPropagation(); toggleDislike(${blog.id})">
                                <i class="fas fa-thumbs-down"></i>
                                <span>${blog.dislikes || 0}</span>
                            </button>
                            <button class="interaction-btn" onclick="event.stopPropagation(); openBlogModal(${blog.id})">
                                <i class="fas fa-comment"></i>
                                <span>${(blog.comments || []).length}</span>
                            </button>
                        </div>
                        <button class="read-more-btn" onclick="event.stopPropagation(); openBlogModal(${blog.id})">
                            Read More
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function initializeFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', applyFilters);
    }
}

function applyFilters() {
    const blogs = JSON.parse(localStorage.getItem('afterlife_blogs') || '[]');
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const sortFilter = document.getElementById('sortFilter')?.value || 'date-desc';
    
    let filteredBlogs = [...blogs];
    
    // Apply category filter
    if (categoryFilter) {
        filteredBlogs = filteredBlogs.filter(blog => blog.category === categoryFilter);
    }
    
    // Apply sorting
    switch (sortFilter) {
        case 'date-desc':
            filteredBlogs.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'date-asc':
            filteredBlogs.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'likes-desc':
            filteredBlogs.sort((a, b) => (b.likes || 0) - (a.likes || 0));
            break;
        case 'comments-desc':
            filteredBlogs.sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0));
            break;
    }
    
    displayBlogPosts(filteredBlogs);
}

function updateBlogStats() {
    const blogs = JSON.parse(localStorage.getItem('afterlife_blogs') || '[]');
    
    const totalPosts = blogs.length;
    const totalLikes = blogs.reduce((sum, blog) => sum + (blog.likes || 0), 0);
    const totalComments = blogs.reduce((sum, blog) => sum + (blog.comments?.length || 0), 0);
    
    // Animate the numbers
    animateNumber('totalPosts', totalPosts);
    animateNumber('totalLikes', totalLikes);
    animateNumber('totalComments', totalComments);
}

function animateNumber(elementId, targetNumber) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const duration = 1000; // 1 second
    const steps = 60; // 60 fps
    const increment = targetNumber / steps;
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= targetNumber) {
            current = targetNumber;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, duration / steps);
}

function getCategoryIcon(category) {
    const icons = {
        'Announcement': 'bullhorn',
        'Gaming Guide': 'gamepad',
        'Technology': 'microchip',
        'Community': 'users',
        'Updates': 'rocket',
        'Tutorial': 'book',
        'News': 'newspaper',
        'Review': 'star'
    };
    return icons[category] || 'blog';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function openBlogModal(blogId) {
    const blogs = JSON.parse(localStorage.getItem('afterlife_blogs') || '[]');
    const blog = blogs.find(b => b.id === blogId);
    
    if (!blog) return;
    
    currentBlogId = blogId;
    const interactions = JSON.parse(localStorage.getItem('blog_interactions') || '{}');
    const userInteraction = interactions[blogId] || {};
    
    // Populate modal content
    document.getElementById('modalTitle').textContent = blog.title;
    document.getElementById('modalMeta').innerHTML = `
        <span><i class="fas fa-user"></i> ${blog.author}</span>
        <span><i class="fas fa-calendar"></i> ${formatDate(blog.date)}</span>
        <span><i class="fas fa-tag"></i> ${blog.category}</span>
    `;
    document.getElementById('modalContent').innerHTML = blog.content;
    
    // Update interaction buttons
    const likeBtn = document.getElementById('modalLikeBtn');
    const dislikeBtn = document.getElementById('modalDislikeBtn');
    
    likeBtn.className = `interaction-btn ${userInteraction.liked ? 'liked' : ''}`;
    dislikeBtn.className = `interaction-btn ${userInteraction.disliked ? 'disliked' : ''}`;
    
    document.getElementById('modalLikeCount').textContent = blog.likes || 0;
    document.getElementById('modalDislikeCount').textContent = blog.dislikes || 0;
    
    // Load comments
    loadComments(blogId);
    
    // Show modal
    document.getElementById('blogModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeBlogModal() {
    document.getElementById('blogModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    currentBlogId = null;
}

function toggleLike(blogId) {
    const blogs = JSON.parse(localStorage.getItem('afterlife_blogs') || '[]');
    const interactions = JSON.parse(localStorage.getItem('blog_interactions') || '{}');
    
    const blogIndex = blogs.findIndex(b => b.id === blogId);
    if (blogIndex === -1) return;
    
    if (!interactions[blogId]) {
        interactions[blogId] = {};
    }
    
    const userInteraction = interactions[blogId];
    
    // If already liked, remove like
    if (userInteraction.liked) {
        userInteraction.liked = false;
        blogs[blogIndex].likes = Math.max(0, (blogs[blogIndex].likes || 0) - 1);
    } else {
        // Add like
        userInteraction.liked = true;
        blogs[blogIndex].likes = (blogs[blogIndex].likes || 0) + 1;
        
        // Remove dislike if present
        if (userInteraction.disliked) {
            userInteraction.disliked = false;
            blogs[blogIndex].dislikes = Math.max(0, (blogs[blogIndex].dislikes || 0) - 1);
        }
    }
    
    // Save changes
    localStorage.setItem('afterlife_blogs', JSON.stringify(blogs));
    localStorage.setItem('blog_interactions', JSON.stringify(interactions));
    
    // Update UI
    applyFilters(); // Use applyFilters instead of loadBlogPosts to maintain current filter state
    updateBlogStats(); // Update statistics
    
    if (currentBlogId === blogId) {
        // Update modal if open
        const likeBtn = document.getElementById('modalLikeBtn');
        const dislikeBtn = document.getElementById('modalDislikeBtn');
        
        likeBtn.className = `interaction-btn ${userInteraction.liked ? 'liked' : ''}`;
        dislikeBtn.className = `interaction-btn ${userInteraction.disliked ? 'disliked' : ''}`;
        
        document.getElementById('modalLikeCount').textContent = blogs[blogIndex].likes || 0;
        document.getElementById('modalDislikeCount').textContent = blogs[blogIndex].dislikes || 0;
    }
}

function toggleDislike(blogId) {
    const blogs = JSON.parse(localStorage.getItem('afterlife_blogs') || '[]');
    const interactions = JSON.parse(localStorage.getItem('blog_interactions') || '{}');
    
    const blogIndex = blogs.findIndex(b => b.id === blogId);
    if (blogIndex === -1) return;
    
    if (!interactions[blogId]) {
        interactions[blogId] = {};
    }
    
    const userInteraction = interactions[blogId];
    
    // If already disliked, remove dislike
    if (userInteraction.disliked) {
        userInteraction.disliked = false;
        blogs[blogIndex].dislikes = Math.max(0, (blogs[blogIndex].dislikes || 0) - 1);
    } else {
        // Add dislike
        userInteraction.disliked = true;
        blogs[blogIndex].dislikes = (blogs[blogIndex].dislikes || 0) + 1;
        
        // Remove like if present
        if (userInteraction.liked) {
            userInteraction.liked = false;
            blogs[blogIndex].likes = Math.max(0, (blogs[blogIndex].likes || 0) - 1);
        }
    }
    
    // Save changes
    localStorage.setItem('afterlife_blogs', JSON.stringify(blogs));
    localStorage.setItem('blog_interactions', JSON.stringify(interactions));
    
    // Update UI
    applyFilters(); // Use applyFilters instead of loadBlogPosts to maintain current filter state
    updateBlogStats(); // Update statistics
    
    if (currentBlogId === blogId) {
        // Update modal if open
        const likeBtn = document.getElementById('modalLikeBtn');
        const dislikeBtn = document.getElementById('modalDislikeBtn');
        
        likeBtn.className = `interaction-btn ${userInteraction.liked ? 'liked' : ''}`;
        dislikeBtn.className = `interaction-btn ${userInteraction.disliked ? 'disliked' : ''}`;
        
        document.getElementById('modalLikeCount').textContent = blogs[blogIndex].likes || 0;
        document.getElementById('modalDislikeCount').textContent = blogs[blogIndex].dislikes || 0;
    }
}

function addComment() {
    const commentInput = document.getElementById('commentInput');
    const commentText = commentInput.value.trim();
    
    if (!commentText) {
        alert('Please enter a comment before posting.');
        return;
    }
    
    if (!currentBlogId) return;
    
    const blogs = JSON.parse(localStorage.getItem('afterlife_blogs') || '[]');
    const blogIndex = blogs.findIndex(b => b.id === currentBlogId);
    
    if (blogIndex === -1) return;
    
    // Create new comment
    const newComment = {
        id: Date.now(),
        text: commentText,
        author: 'Anonymous User', // In a real app, this would be the logged-in user
        date: new Date().toISOString()
    };
    
    // Add comment to blog
    if (!blogs[blogIndex].comments) {
        blogs[blogIndex].comments = [];
    }
    blogs[blogIndex].comments.unshift(newComment);
    
    // Save changes
    localStorage.setItem('afterlife_blogs', JSON.stringify(blogs));
    
    // Clear input and reload comments
    commentInput.value = '';
    loadComments(currentBlogId);
    applyFilters(); // Update comment count in grid
    updateBlogStats(); // Update statistics
    
    // Show success message
    showNotification('Comment posted successfully!', 'success');
}

function loadComments(blogId) {
    const blogs = JSON.parse(localStorage.getItem('afterlife_blogs') || '[]');
    const blog = blogs.find(b => b.id === blogId);
    
    if (!blog) return;
    
    const comments = blog.comments || [];
    const commentsList = document.getElementById('commentsList');
    const commentCount = document.getElementById('commentCount');
    
    commentCount.textContent = comments.length;
    
    if (comments.length === 0) {
        commentsList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <i class="fas fa-comments" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
        `;
        return;
    }
    
    commentsList.innerHTML = comments.map(comment => `
        <div class="comment">
            <div class="comment-meta">
                <span><i class="fas fa-user"></i> ${comment.author}</span>
                <span><i class="fas fa-clock"></i> ${formatDate(comment.date)}</span>
            </div>
            <div class="comment-text">${comment.text}</div>
        </div>
    `).join('');
}

// Use global notification system from theme-toggle.js
// function showNotification is provided globally

// Loading Screen Management
window.addEventListener('load', function() {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 300);
        }
    }, 1000);
});
