class CustomFooter extends HTMLElement {
    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                footer {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #fff;
                    padding: 4rem 0 2rem;
                    margin-top: 4rem;
                }
                .footer-container {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 0 1.5rem;
                }
                .footer-grid {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr 1fr;
                    gap: 3rem;
                    margin-bottom: 3rem;
                }
                .footer-section h3 {
                    color: #fff;
                    font-size: 1.125rem;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                }
                .footer-section ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .footer-section li {
                    margin-bottom: 0.75rem;
                }
                .footer-section a {
                    color: rgba(255, 255, 255, 0.85);
                    text-decoration: none;
                    transition: all 0.3s;
                    display: inline-block;
                    font-size: 0.95rem;
                }
                .footer-section a:hover {
                    color: #fff;
                    transform: translateX(4px);
                }
                .footer-section p {
                    color: rgba(255, 255, 255, 0.85);
                    line-height: 1.7;
                    margin-bottom: 1rem;
                    font-size: 0.95rem;
                }
                .brand-section {
                    max-width: 350px;
                }
                .logo-footer {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #fff;
                    margin-bottom: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .social-links {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1.5rem;
                }
                .social-link {
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s;
                    text-decoration: none;
                    color: #fff;
                }
                .social-link:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: translateY(-3px);
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
                }
                .footer-divider {
                    height: 1px;
                    background: rgba(255, 255, 255, 0.2);
                    margin: 2.5rem 0;
                }
                .footer-bottom {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 1.5rem;
                }
                .footer-bottom-links {
                    display: flex;
                    gap: 2rem;
                    flex-wrap: wrap;
                }
                .footer-bottom-links a {
                    color: rgba(255, 255, 255, 0.85);
                    text-decoration: none;
                    font-size: 0.875rem;
                    transition: color 0.3s;
                }
                .footer-bottom-links a:hover {
                    color: #fff;
                }
                .copyright {
                    color: rgba(255, 255, 255, 0.85);
                    font-size: 0.875rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .badge {
                    display: inline-block;
                    background: rgba(255, 255, 255, 0.2);
                    color: #fff;
                    padding: 0.375rem 1rem;
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    margin-top: 1rem;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }
                @media (max-width: 1024px) {
                    .footer-grid {
                        grid-template-columns: 1fr 1fr;
                        gap: 2.5rem;
                    }
                }
                @media (max-width: 640px) {
                    footer {
                        padding: 3rem 0 1.5rem;
                    }
                    .footer-grid {
                        grid-template-columns: 1fr;
                        gap: 2rem;
                    }
                    .footer-bottom {
                        flex-direction: column;
                        text-align: center;
                    }
                    .brand-section {
                        max-width: 100%;
                    }
                }
            </style>
            <footer>
                <div class="footer-container">
                    <div class="footer-grid">
                        <!-- Brand Section -->
                        <div class="footer-section brand-section">
                            <div class="logo-footer">
                                <i data-feather="trending-up"></i>
                                MaFinance Pro
                            </div>
                            <p>
                                Your trusted platform for Moroccan stock market analysis. Real-time data, advanced analytics, and professional insights from the Casablanca Stock Exchange.
                            </p>
                            <span class="badge">100% Free & Secure</span>
                            <div class="social-links">
                                <a href="https://github.com/lkiwan" class="social-link" aria-label="GitHub" target="_blank">
                                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                    </svg>
                                </a>
                                <a href="#" class="social-link" aria-label="LinkedIn">
                                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/>
                                    </svg>
                                </a>
                                <a href="#" class="social-link" aria-label="Twitter">
                                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                                    </svg>
                                </a>
                                <a href="#" class="social-link" aria-label="Facebook">
                                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                                    </svg>
                                </a>
                            </div>
                        </div>

                        <!-- Quick Links -->
                        <div class="footer-section">
                            <h3>Platform</h3>
                            <ul>
                                <li><a href="/">Home</a></li>
                                <li><a href="/dashboard.html">Dashboard</a></li>
                                <li><a href="/stocks.html">Live Stocks</a></li>
                                <li><a href="/watchlist.html">Watchlist</a></li>
                                <li><a href="/alerts.html">Price Alerts</a></li>
                            </ul>
                        </div>

                        <!-- Resources -->
                        <div class="footer-section">
                            <h3>Resources</h3>
                            <ul>
                                <li><a href="https://www.casablanca-bourse.com/" target="_blank">Market Data</a></li>
                                <li><a href="#">Market Guide</a></li>
                                <li><a href="#">API Docs</a></li>
                                <li><a href="#">Support</a></li>
                            </ul>
                        </div>

                        <!-- Legal -->
                        <div class="footer-section">
                            <h3>Legal</h3>
                            <ul>
                                <li><a href="#">Privacy Policy</a></li>
                                <li><a href="#">Terms of Service</a></li>
                                <li><a href="#">Disclaimer</a></li>
                                <li><a href="#">Cookie Policy</a></li>
                            </ul>
                        </div>
                    </div>

                    <div class="footer-divider"></div>

                    <div class="footer-bottom">
                        <div class="copyright">
                            &copy; ${new Date().getFullYear()} MaFinance Pro. Made with ❤️ in Morocco.
                        </div>
                        <div class="footer-bottom-links">
                            <a href="https://www.casablanca-bourse.com/" target="_blank" rel="noopener">Casablanca Stock Exchange</a>
                            <a href="#">Sitemap</a>
                            <a href="#">Accessibility</a>
                        </div>
                    </div>
                </div>
            </footer>
        `;

        // Replace feather icons
        setTimeout(() => {
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
        }, 100);
    }
}

customElements.define('custom-footer', CustomFooter);
