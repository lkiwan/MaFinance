class CustomNavbar extends HTMLElement {
    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                nav {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    padding: 1rem 0;
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                }
                .nav-container {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 0 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .logo {
                    color: white;
                    font-weight: 700;
                    font-size: 1.75rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    text-decoration: none;
                    transition: transform 0.2s;
                }
                .logo:hover {
                    transform: scale(1.05);
                }
                .nav-links {
                    display: flex;
                    gap: 2rem;
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    align-items: center;
                }
                .nav-links a {
                    color: rgba(255, 255, 255, 0.9);
                    text-decoration: none;
                    font-weight: 500;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    border-radius: 0.375rem;
                }
                .nav-links a:hover {
                    color: white;
                    background: rgba(255, 255, 255, 0.1);
                }
                .auth-buttons {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }
                .btn-primary {
                    background: white;
                    color: #667eea;
                    padding: 0.5rem 1.25rem;
                    border-radius: 0.5rem;
                    transition: all 0.2s;
                    font-weight: 600;
                    text-decoration: none;
                    display: inline-block;
                }
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }
                .btn-outline {
                    border: 2px solid rgba(255, 255, 255, 0.8);
                    color: white;
                    padding: 0.5rem 1.25rem;
                    border-radius: 0.5rem;
                    transition: all 0.2s;
                    font-weight: 600;
                    text-decoration: none;
                    display: inline-block;
                }
                .btn-outline:hover {
                    background: white;
                    color: #667eea;
                    border-color: white;
                }
                .profile-dropdown {
                    position: relative;
                }
                .profile-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    border: none;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .profile-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
                .dropdown-menu {
                    position: absolute;
                    top: calc(100% + 0.5rem);
                    right: 0;
                    background: white;
                    border-radius: 0.5rem;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                    min-width: 200px;
                    overflow: hidden;
                    display: none;
                    opacity: 0;
                    transform: translateY(-10px);
                    transition: all 0.2s;
                }
                .dropdown-menu.active {
                    display: block;
                    opacity: 1;
                    transform: translateY(0);
                }
                .dropdown-header {
                    padding: 1rem;
                    border-bottom: 1px solid #e5e7eb;
                    background: #f9fafb;
                }
                .dropdown-header .user-name {
                    font-weight: 600;
                    color: #111827;
                    display: block;
                }
                .dropdown-header .user-email {
                    font-size: 0.875rem;
                    color: #6b7280;
                    display: block;
                    margin-top: 0.25rem;
                }
                .dropdown-item {
                    padding: 0.75rem 1rem;
                    color: #374151;
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                    background: none;
                    width: 100%;
                    text-align: left;
                    font-size: 0.95rem;
                }
                .dropdown-item:hover {
                    background: #f3f4f6;
                    color: #667eea;
                }
                .dropdown-item.danger:hover {
                    background: #fee2e2;
                    color: #dc2626;
                }
                .mobile-menu-btn {
                    display: none;
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 0.375rem;
                }
                @media (max-width: 768px) {
                    .nav-links {
                        display: none;
                        position: absolute;
                        top: 100%;
                        left: 0;
                        right: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        flex-direction: column;
                        padding: 1rem;
                        gap: 0.5rem;
                    }
                    .nav-links.active {
                        display: flex;
                    }
                    .mobile-menu-btn {
                        display: block;
                    }
                }
            </style>
            <nav>
                <div class="nav-container">
                    <a href="/" class="logo">
                        <i data-feather="trending-up"></i>
                        MaFinance Pro
                    </a>

                    <ul class="nav-links">
                        <li><a href="/"><i data-feather="home"></i> Home</a></li>
                        <li><a href="/dashboard.html"><i data-feather="layout"></i> Dashboard</a></li>
                        <li><a href="/stocks.html"><i data-feather="bar-chart-2"></i> Stocks</a></li>
                        <li><a href="/watchlist.html"><i data-feather="star"></i> Watchlist</a></li>
                        <li><a href="/alerts.html"><i data-feather="bell"></i> Alerts</a></li>
                    </ul>

                    <div class="auth-buttons">
                        <div data-auth="logged-out">
                            <a href="/login.html" class="btn-outline">Login</a>
                            <a href="/register.html" class="btn-primary">Register</a>
                        </div>
                        <div data-auth="logged-in" style="display: none;">
                            <div class="profile-dropdown">
                                <button class="profile-btn" id="profileBtn">
                                    <i data-feather="user"></i>
                                    <span id="user-name">User</span>
                                    <i data-feather="chevron-down" style="width: 16px; height: 16px;"></i>
                                </button>
                                <div class="dropdown-menu" id="dropdownMenu">
                                    <div class="dropdown-header">
                                        <span class="user-name" id="dropdown-name">User</span>
                                        <span class="user-email" id="dropdown-email">user@example.com</span>
                                    </div>
                                    <button class="dropdown-item danger" id="logoutBtn">
                                        <i data-feather="log-out"></i>
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button class="mobile-menu-btn">
                        <i data-feather="menu"></i>
                    </button>
                </div>
            </nav>
        `;

        // Add mobile menu functionality
        const mobileMenuBtn = this.shadowRoot.querySelector('.mobile-menu-btn');
        const navLinks = this.shadowRoot.querySelector('.nav-links');

        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        // Add profile dropdown functionality
        const profileBtn = this.shadowRoot.getElementById('profileBtn');
        const dropdownMenu = this.shadowRoot.getElementById('dropdownMenu');

        if (profileBtn && dropdownMenu) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle('active');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                dropdownMenu.classList.remove('active');
            });

            dropdownMenu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // Add logout functionality
        const logoutBtn = this.shadowRoot.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Update auth status
        this.updateAuthStatus();

        // Replace feather icons initially
        setTimeout(() => {
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
        }, 100);
    }

    async updateAuthStatus() {
        const loggedInElements = this.shadowRoot.querySelectorAll('[data-auth="logged-in"]');
        const loggedOutElements = this.shadowRoot.querySelectorAll('[data-auth="logged-out"]');
        const userNameElement = this.shadowRoot.getElementById('user-name');
        const dropdownNameElement = this.shadowRoot.getElementById('dropdown-name');
        const dropdownEmailElement = this.shadowRoot.getElementById('dropdown-email');

        try {
            // Check authentication with backend API
            const response = await fetch('/api/me');

            if (response.ok) {
                const data = await response.json();
                const user = data.user;

                // User is logged in
                loggedInElements.forEach(el => el.style.display = 'block');
                loggedOutElements.forEach(el => el.style.display = 'none');

                if (userNameElement && user) {
                    const displayName = user.full_name || user.email.split('@')[0];
                    userNameElement.textContent = displayName;

                    if (dropdownNameElement) {
                        dropdownNameElement.textContent = displayName;
                    }
                    if (dropdownEmailElement) {
                        dropdownEmailElement.textContent = user.email;
                    }
                }

                // Replace feather icons
                setTimeout(() => {
                    if (typeof feather !== 'undefined') {
                        feather.replace();
                    }
                }, 100);
            } else {
                // User is not logged in
                loggedInElements.forEach(el => el.style.display = 'none');
                loggedOutElements.forEach(el => el.style.display = 'flex');

                // Clear any old localStorage data
                localStorage.removeItem('user_email');
                localStorage.removeItem('user_name');
            }
        } catch (error) {
            // Error checking auth, assume not logged in
            loggedInElements.forEach(el => el.style.display = 'none');
            loggedOutElements.forEach(el => el.style.display = 'flex');
        }
    }

    async handleLogout() {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST'
            });

            if (response.ok) {
                // Clear localStorage
                localStorage.removeItem('user_email');
                localStorage.removeItem('user_name');

                // Redirect to home page
                window.location.href = '/';
            } else {
                alert('Failed to logout. Please try again.');
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('Failed to logout. Please try again.');
        }
    }
}

customElements.define('custom-navbar', CustomNavbar);