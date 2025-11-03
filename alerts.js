// Price Alerts Manager
class AlertsManager {
    constructor() {
        this.user = null;
        this.watchlist = [];
        this.portfolio = [];
        this.alerts = [];
        this.stocks = [];
        this.selectedStock = null;
        this.currentPrice = 0;
    }

    async init() {
        await this.checkAuth();
        if (this.user) {
            await this.loadData();
            this.setupEventListeners();
            this.populateStockOptions();
            this.renderAlerts();
        }
        feather.replace();
    }

    async checkAuth() {
        try {
            const response = await fetch('/api/me');
            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
            } else {
                document.getElementById('authMessage').classList.remove('hidden');
            }
        } catch (error) {
            console.error('Auth check error:', error);
            document.getElementById('authMessage').classList.remove('hidden');
        }
    }

    async loadData() {
        await Promise.all([
            this.loadWatchlist(),
            this.loadPortfolio(),
            this.loadAlerts(),
            this.loadStocks()
        ]);
    }

    async loadWatchlist() {
        try {
            const response = await fetch('/api/watchlist');
            const data = await response.json();
            this.watchlist = data.watchlist || [];
        } catch (error) {
            console.error('Error loading watchlist:', error);
        }
    }

    async loadPortfolio() {
        try {
            const response = await fetch('/api/portfolio');
            const data = await response.json();
            this.portfolio = data.portfolio || [];
        } catch (error) {
            console.error('Error loading portfolio:', error);
        }
    }

    async loadAlerts() {
        try {
            const response = await fetch('/api/alerts');
            const data = await response.json();
            this.alerts = data.alerts || [];
        } catch (error) {
            console.error('Error loading alerts:', error);
        }
    }

    async loadStocks() {
        try {
            const response = await fetch('/api/stocks');
            const data = await response.json();
            this.stocks = data.stocks || [];
        } catch (error) {
            console.error('Error loading stocks:', error);
        }
    }

    populateStockOptions() {
        const watchlistGroup = document.getElementById('watchlistGroup');
        const portfolioGroup = document.getElementById('portfolioGroup');

        // Clear existing options
        watchlistGroup.innerHTML = '';
        portfolioGroup.innerHTML = '';

        // Populate watchlist
        if (this.watchlist.length > 0) {
            this.watchlist.forEach(item => {
                const option = document.createElement('option');
                option.value = JSON.stringify({
                    symbol: item.symbol,
                    name: item.name,
                    price: item.current_price || 0
                });
                option.textContent = `${item.symbol} - ${item.name}`;
                watchlistGroup.appendChild(option);
            });
        } else {
            watchlistGroup.innerHTML = '<option disabled>No items in watchlist</option>';
        }

        // Populate portfolio
        if (this.portfolio.length > 0) {
            this.portfolio.forEach(item => {
                const option = document.createElement('option');
                option.value = JSON.stringify({
                    symbol: item.symbol,
                    name: item.name,
                    price: item.current_price || 0
                });
                option.textContent = `${item.symbol} - ${item.name}`;
                portfolioGroup.appendChild(option);
            });
        } else {
            portfolioGroup.innerHTML = '<option disabled>No items in portfolio</option>';
        }
    }

    setupEventListeners() {
        // Stock selection
        document.getElementById('stockSelect').addEventListener('change', (e) => {
            if (e.target.value) {
                this.selectedStock = JSON.parse(e.target.value);
                this.currentPrice = this.selectedStock.price;
                this.updateCurrentPriceDisplay();
            }
        });

        // Condition buttons
        document.querySelectorAll('.condition-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.condition-btn').forEach(b => {
                    b.classList.remove('border-blue-500', 'bg-blue-50', 'text-blue-700');
                    b.classList.add('border-gray-300');
                });
                btn.classList.remove('border-gray-300');
                btn.classList.add('border-blue-500', 'bg-blue-50', 'text-blue-700');
                document.getElementById('alertCondition').value = btn.dataset.condition;
                feather.replace();
            });
        });

        // Price increment/decrement
        document.getElementById('increasePrice').addEventListener('click', () => {
            const input = document.getElementById('targetPrice');
            const current = parseFloat(input.value) || this.currentPrice;
            input.value = (current + 1).toFixed(2);
        });

        document.getElementById('decreasePrice').addEventListener('click', () => {
            const input = document.getElementById('targetPrice');
            const current = parseFloat(input.value) || this.currentPrice;
            if (current > 1) {
                input.value = (current - 1).toFixed(2);
            }
        });

        // Quick adjust buttons
        document.querySelectorAll('.quick-adjust-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const percent = parseFloat(btn.dataset.percent);
                const newPrice = this.currentPrice * (1 + percent / 100);
                document.getElementById('targetPrice').value = newPrice.toFixed(2);
            });
        });

        // Form submission
        document.getElementById('alertForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createAlert();
        });
    }

    updateCurrentPriceDisplay() {
        const display = document.getElementById('currentPriceDisplay');
        const priceElement = document.getElementById('currentPrice');

        priceElement.textContent = this.formatCurrency(this.currentPrice);
        display.classList.remove('hidden');

        // Set target price to current price initially
        document.getElementById('targetPrice').value = this.currentPrice.toFixed(2);

        // Show quick adjust buttons
        document.getElementById('quickAdjust').style.display = 'flex';
    }

    async createAlert() {
        const condition = document.getElementById('alertCondition').value;
        const targetPrice = parseFloat(document.getElementById('targetPrice').value);

        if (!this.selectedStock || !condition || !targetPrice) {
            alert('Please fill all required fields');
            return;
        }

        try {
            const response = await fetch('/api/alerts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    symbol: this.selectedStock.symbol,
                    name: this.selectedStock.name,
                    target_price: targetPrice,
                    condition: condition
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Show success message
                this.showNotification('Alert created successfully!', 'success');

                // Reset form
                document.getElementById('alertForm').reset();
                document.getElementById('currentPriceDisplay').classList.add('hidden');
                document.getElementById('quickAdjust').style.display = 'none';
                document.querySelectorAll('.condition-btn').forEach(b => {
                    b.classList.remove('border-blue-500', 'bg-blue-50', 'text-blue-700');
                    b.classList.add('border-gray-300');
                });

                // Reload alerts
                await this.loadAlerts();
                this.renderAlerts();
            } else {
                alert(data.message || 'Failed to create alert');
            }
        } catch (error) {
            console.error('Error creating alert:', error);
            alert('Failed to create alert. Please try again.');
        }
    }

    renderAlerts() {
        const container = document.getElementById('alertsList');
        const noAlerts = document.getElementById('noAlerts');

        const activeAlerts = this.alerts.filter(a => !a.triggered);

        if (activeAlerts.length === 0) {
            container.innerHTML = '';
            noAlerts.classList.remove('hidden');
            feather.replace();
            return;
        }

        noAlerts.classList.add('hidden');

        container.innerHTML = activeAlerts.map(alert => {
            const progress = alert.current_price ?
                ((alert.current_price - alert.target_price) / alert.target_price * 100) : 0;
            const isAbove = alert.condition === 'above';
            const icon = isAbove ? 'trending-up' : 'trending-down';
            const color = isAbove ? 'blue' : 'red';

            return `
                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                            <h3 class="font-bold text-gray-900">${alert.symbol}</h3>
                            <p class="text-sm text-gray-600">${alert.name}</p>
                        </div>
                        <button onclick="alertsManager.deleteAlert(${alert.id})"
                                class="text-gray-400 hover:text-red-600 transition">
                            <i data-feather="trash-2"></i>
                        </button>
                    </div>

                    <div class="space-y-2">
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-gray-600">Current Price:</span>
                            <span class="font-semibold text-gray-900">${this.formatCurrency(alert.current_price || 0)}</span>
                        </div>

                        <div class="flex items-center justify-between text-sm">
                            <span class="text-gray-600">Target Price:</span>
                            <span class="font-semibold text-${color}-600">
                                <i data-feather="${icon}" class="inline-block" style="width: 14px; height: 14px;"></i>
                                ${this.formatCurrency(alert.target_price)}
                            </span>
                        </div>

                        <div class="mt-3 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div class="bg-${color}-500 h-full transition-all"
                                 style="width: ${Math.min(Math.abs(progress), 100)}%"></div>
                        </div>

                        <p class="text-xs text-gray-500 text-center mt-2">
                            ${Math.abs(progress).toFixed(2)}% ${isAbove ? 'to target' : 'from target'}
                        </p>
                    </div>
                </div>
            `;
        }).join('');

        feather.replace();
    }

    async deleteAlert(alertId) {
        if (!confirm('Are you sure you want to delete this alert?')) {
            return;
        }

        try {
            const response = await fetch(`/api/alerts/${alertId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showNotification('Alert deleted successfully', 'success');
                await this.loadAlerts();
                this.renderAlerts();
            } else {
                alert('Failed to delete alert');
            }
        } catch (error) {
            console.error('Error deleting alert:', error);
            alert('Failed to delete alert');
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } z-50 animate-fade-in`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    formatCurrency(value) {
        if (value === null || value === undefined || isNaN(value)) return '0.00 MAD';
        return `${parseFloat(value).toFixed(2)} MAD`;
    }
}

// Initialize
const alertsManager = new AlertsManager();
document.addEventListener('DOMContentLoaded', () => {
    alertsManager.init();
});
