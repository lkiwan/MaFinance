class CustomNavbar extends HTMLElement {
    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                nav {
                    background: white;
                    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
                    padding: 1rem 0;
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                }
                .nav-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .logo {
                    color: #3b82f6;
                    font-weight: bold;
                    font-size: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .nav-links {
                    display: flex;
                    gap: 2rem;
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    align-items: center;
                }
                a {
                    color: #374151;
                    text-decoration: none;
                    font-weight: 500;
                    transition: color 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }
                a:hover {
                    color: #3b82f6;
                }
                .auth-buttons {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }
                .btn-primary {
                    background: #3b82f6;
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 0.375rem;
                    transition: all 0.2s;
                }
                .btn-primary:hover {
                    background: #2563eb;
                    transform: translateY(-1px);
                }
                .btn-outline {
                    border: 1px solid #d1d5db;
                    color: #374151;
                    padding: 0.5rem 1rem;
                    border-radius: 0.375rem;
                    transition: all 0.2s;
                }
                .btn-outline:hover {
                    border-color: #3b82f6;
                    color: #3b82f6;
                }
                .mobile-menu-btn {
                    display: none;
                    background: none;
                    border: none;
                    color: #374151;
                    cursor: pointer;
                }
                @media (max-width: 768px) {
                    .nav-links {
                        display: none;
                        position: absolute;
                        top: 100%;
                        left: 0;
                        right: 0;
                        background: white;
                        flex-direction: column;
                        padding: 1rem;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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
                        <li><a href="/stocks.html"><i data-feather="bar-chart-2"></i> Stocks</a></li>
                        <li><a href="/about.html"><i data-feather="info"></i> About</a></li>
                        <li><a href="/contact.html"><i data-feather="mail"></i> Contact</a></li>
                    </ul>

                    <div class="auth-buttons">
                        <div data-auth="logged-out">
                            <a href="/login.html" class="btn-outline">Login</a>
                            <a href="/register.html" class="btn-primary">Register</a>
                        </div>
                        <div data-auth="logged-in" style="display: none;">
                            <a href="/profile.html" class="btn-outline">
                                <i data-feather="user"></i>
                                <span id="user-name">User</span>
                            </a>
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

        // Update auth status
        this.updateAuthStatus();
    }

    updateAuthStatus() {
        const authToken = localStorage.getItem('auth_token');
        const userEmail = localStorage.getItem('user_email');
        
        const loggedInElements = this.shadowRoot.querySelectorAll('[data-auth="logged-in"]');
        const loggedOutElements = this.shadowRoot.querySelectorAll('[data-auth="logged-out"]');
        const userNameElement = this.shadowRoot.getElementById('user-name');

        if (authToken && userEmail) {
            loggedInElements.forEach(el => el.style.display = 'flex');
            loggedOutElements.forEach(el => el.style.display = 'none');
            
            if (userNameElement) {
                userNameElement.textContent = userEmail.split('@')[0];
            }
        } else {
            loggedInElements.forEach(el => el.style.display = 'none');
            loggedOutElements.forEach(el => el.style.display = 'flex');
        }
    }
}

customElements.define('custom-navbar', CustomNavbar);