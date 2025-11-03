// Centralized Watchlist & Portfolio Manager
// Now uses SQLite database backend via API calls

class WatchlistManager {
    constructor() {
        // Keep localStorage keys for backwards compatibility (migration support)
        this.STORAGE_KEY = 'mafinance_watchlist';
        this.PORTFOLIO_KEY = 'mafinance_portfolio';
        this.ALERTS_KEY = 'mafinance_price_alerts';
    }

    // ===== HELPER METHODS =====

    async checkAuth() {
        /**
         * Check if user is authenticated
         * Returns true if authenticated, false otherwise
         */
        try {
            const response = await fetch('/api/me');
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    async requireAuth() {
        /**
         * Redirect to login if not authenticated
         */
        const isAuthenticated = await this.checkAuth();
        if (!isAuthenticated) {
            this.showNotification('Please login to use this feature', 'warning');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1500);
            return false;
        }
        return true;
    }

    // ===== WATCHLIST FUNCTIONS =====

    async getWatchlist() {
        if (!(await this.requireAuth())) return [];

        try {
            const response = await fetch('/api/watchlist');
            if (response.ok) {
                const data = await response.json();
                return data.watchlist || [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching watchlist:', error);
            return [];
        }
    }

    async addToWatchlist(stock) {
        if (!(await this.requireAuth())) return false;

        try {
            const response = await fetch('/api/watchlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    symbol: stock.symbol,
                    name: stock.name,
                    price: stock.price
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification(`${stock.name} added to watchlist!`, 'success');
                this.dispatchWatchlistUpdate();
                return true;
            } else {
                this.showNotification(data.message || 'Failed to add to watchlist', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error adding to watchlist:', error);
            this.showNotification('Failed to add to watchlist', 'error');
            return false;
        }
    }

    async removeFromWatchlist(symbol) {
        if (!(await this.requireAuth())) return false;

        try {
            const response = await fetch(`/api/watchlist/${symbol}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showNotification(`${symbol} removed from watchlist`, 'info');
                this.dispatchWatchlistUpdate();
                return true;
            } else {
                this.showNotification('Failed to remove from watchlist', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error removing from watchlist:', error);
            this.showNotification('Failed to remove from watchlist', 'error');
            return false;
        }
    }

    async isInWatchlist(symbol) {
        if (!(await this.checkAuth())) return false;

        const watchlist = await this.getWatchlist();
        return watchlist.some(s => s.symbol === symbol);
    }

    async clearWatchlist() {
        if (!(await this.requireAuth())) return false;

        if (confirm('Are you sure you want to clear your entire watchlist?')) {
            try {
                const watchlist = await this.getWatchlist();
                for (const item of watchlist) {
                    await this.removeFromWatchlist(item.symbol);
                }
                this.showNotification('Watchlist cleared', 'info');
                this.dispatchWatchlistUpdate();
                return true;
            } catch (error) {
                console.error('Error clearing watchlist:', error);
                this.showNotification('Failed to clear watchlist', 'error');
                return false;
            }
        }
        return false;
    }

    // ===== PORTFOLIO FUNCTIONS =====

    async getPortfolio() {
        if (!(await this.requireAuth())) return [];

        try {
            const response = await fetch('/api/portfolio');
            if (response.ok) {
                const data = await response.json();
                return data.portfolio || [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching portfolio:', error);
            return [];
        }
    }

    async addToPortfolio(symbol, name, shares, buyPrice, buyDate = new Date().toISOString()) {
        if (!(await this.requireAuth())) return false;

        try {
            const response = await fetch('/api/portfolio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    symbol,
                    name,
                    shares: parseFloat(shares),
                    buy_price: parseFloat(buyPrice),
                    buy_date: buyDate
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification(`${shares} shares of ${name} added to portfolio!`, 'success');
                this.dispatchPortfolioUpdate();
                return true;
            } else {
                this.showNotification(data.message || 'Failed to add to portfolio', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error adding to portfolio:', error);
            this.showNotification('Failed to add to portfolio', 'error');
            return false;
        }
    }

    async removeFromPortfolio(id) {
        if (!(await this.requireAuth())) return false;

        try {
            const response = await fetch(`/api/portfolio/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showNotification('Holding removed from portfolio', 'info');
                this.dispatchPortfolioUpdate();
                return true;
            } else {
                this.showNotification('Failed to remove from portfolio', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error removing from portfolio:', error);
            this.showNotification('Failed to remove from portfolio', 'error');
            return false;
        }
    }

    async updatePortfolioHolding(id, shares, buyPrice) {
        // Not implemented in backend yet, but kept for compatibility
        this.showNotification('Update feature coming soon', 'info');
        return false;
    }

    async calculatePortfolioValue(currentPrices) {
        const portfolio = await this.getPortfolio();
        let totalInvestment = 0;
        let currentValue = 0;

        portfolio.forEach(holding => {
            totalInvestment += holding.total_investment;
            const currentPrice = holding.current_price || holding.buy_price;
            currentValue += holding.shares * currentPrice;
        });

        const profit = currentValue - totalInvestment;
        const profitPercentage = totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0;

        return {
            totalInvestment,
            currentValue,
            profit,
            profitPercentage
        };
    }

    // ===== PRICE ALERTS FUNCTIONS =====

    async getPriceAlerts() {
        if (!(await this.requireAuth())) return [];

        try {
            const response = await fetch('/api/alerts');
            if (response.ok) {
                const data = await response.json();
                return data.alerts || [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching price alerts:', error);
            return [];
        }
    }

    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            alert('This browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    async addPriceAlert(symbol, name, targetPrice, condition = 'above') {
        if (!(await this.requireAuth())) return false;

        const hasPermission = await this.requestNotificationPermission();

        if (!hasPermission) {
            this.showNotification('Please enable browser notifications to use price alerts', 'warning');
            return false;
        }

        try {
            const response = await fetch('/api/alerts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    symbol,
                    name,
                    target_price: parseFloat(targetPrice),
                    condition
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification(`Price alert set for ${name}`, 'success');
                return true;
            } else {
                this.showNotification(data.message || 'Failed to create alert', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error creating price alert:', error);
            this.showNotification('Failed to create alert', 'error');
            return false;
        }
    }

    async removePriceAlert(id) {
        if (!(await this.requireAuth())) return false;

        try {
            const response = await fetch(`/api/alerts/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showNotification('Price alert removed', 'info');
                return true;
            } else {
                this.showNotification('Failed to remove alert', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error removing price alert:', error);
            this.showNotification('Failed to remove alert', 'error');
            return false;
        }
    }

    checkPriceAlerts(currentPrices) {
        // This function is now handled by the frontend checking alerts periodically
        // The backend stores alerts, frontend checks and triggers notifications
        this.getPriceAlerts().then(alerts => {
            alerts.forEach(alert => {
                if (alert.triggered) return;

                const currentPrice = currentPrices[alert.symbol];
                if (!currentPrice) return;

                let shouldTrigger = false;
                if (alert.condition === 'above' && currentPrice >= alert.target_price) {
                    shouldTrigger = true;
                } else if (alert.condition === 'below' && currentPrice <= alert.target_price) {
                    shouldTrigger = true;
                }

                if (shouldTrigger) {
                    this.triggerPriceAlert(alert, currentPrice);
                }
            });
        });
    }

    triggerPriceAlert(alert, currentPrice) {
        // Browser notification
        if (Notification.permission === 'granted') {
            new Notification('MaFinance Pro - Price Alert!', {
                body: `${alert.name} (${alert.symbol}) is ${alert.condition} ${alert.target_price.toFixed(2)} MAD. Current: ${currentPrice.toFixed(2)} MAD`,
                icon: '/static/favicon.ico',
                badge: '/static/favicon.ico',
                tag: `price-alert-${alert.id}`
            });
        }

        // Visual notification
        this.showNotification(
            `ALERT: ${alert.name} reached ${currentPrice.toFixed(2)} MAD (target: ${alert.target_price.toFixed(2)})`,
            'warning',
            10000
        );
    }

    // ===== UTILITY FUNCTIONS =====

    showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notification-container') || this.createNotificationContainer();

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span>${this.getNotificationIcon(type)}</span>
                <span>${message}</span>
            </div>
        `;

        container.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;';
        document.body.appendChild(container);
        return container;
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    dispatchWatchlistUpdate() {
        window.dispatchEvent(new Event('watchlistUpdated'));
    }

    dispatchPortfolioUpdate() {
        window.dispatchEvent(new Event('portfolioUpdated'));
    }

    // ===== EXPORT/IMPORT FUNCTIONS =====

    async exportData() {
        if (!(await this.requireAuth())) return;

        try {
            const [watchlist, portfolio, alerts] = await Promise.all([
                this.getWatchlist(),
                this.getPortfolio(),
                this.getPriceAlerts()
            ]);

            const data = {
                watchlist,
                portfolio,
                alerts,
                exportDate: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mafinance-data-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);

            this.showNotification('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Export failed', 'error');
        }
    }

    importData(file) {
        // Import functionality would require backend endpoints to bulk insert data
        // For now, this is a placeholder
        this.showNotification('Import feature coming soon', 'info');
    }

    // ===== STATISTICS =====

    async getStats() {
        if (!(await this.checkAuth())) {
            return {
                watchlistCount: 0,
                portfolioCount: 0,
                alertsCount: 0
            };
        }

        try {
            const [watchlist, portfolio, alerts] = await Promise.all([
                this.getWatchlist(),
                this.getPortfolio(),
                this.getPriceAlerts()
            ]);

            return {
                watchlistCount: watchlist.length,
                portfolioCount: portfolio.length,
                alertsCount: alerts.filter(a => !a.triggered).length
            };
        } catch (error) {
            console.error('Error fetching stats:', error);
            return {
                watchlistCount: 0,
                portfolioCount: 0,
                alertsCount: 0
            };
        }
    }
}

// Create global instance
window.watchlistManager = new WatchlistManager();

// Auto-check price alerts every minute (if on the page)
if (typeof window !== 'undefined') {
    setInterval(async () => {
        try {
            const response = await fetch('/api/stocks');
            if (response.ok) {
                const data = await response.json();
                const currentPrices = {};
                data.stocks.forEach(stock => {
                    currentPrices[stock.symbol] = stock.price;
                });
                window.watchlistManager.checkPriceAlerts(currentPrices);
            }
        } catch (error) {
            console.error('Error checking price alerts:', error);
        }
    }, 60000); // Check every minute
}
