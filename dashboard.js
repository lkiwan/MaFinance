// Dashboard Manager
class DashboardManager {
    constructor() {
        this.user = null;
        this.stocks = [];
        this.portfolio = [];
        this.watchlist = [];
        this.alerts = [];
        this.portfolioChart = null;
    }

    async init() {
        await this.checkAuth();
        if (this.user) {
            await this.loadAllData();
            this.renderDashboard();
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
                // Not logged in
                document.getElementById('authMessage').classList.remove('hidden');
            }
        } catch (error) {
            console.error('Auth check error:', error);
            document.getElementById('authMessage').classList.remove('hidden');
        }
    }

    async loadAllData() {
        await Promise.all([
            this.loadStocks(),
            this.loadPortfolio(),
            this.loadWatchlist(),
            this.loadAlerts()
        ]);
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

    async loadPortfolio() {
        try {
            const response = await fetch('/api/portfolio');
            const data = await response.json();
            this.portfolio = data.portfolio || [];
        } catch (error) {
            console.error('Error loading portfolio:', error);
        }
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

    async loadAlerts() {
        try {
            const response = await fetch('/api/alerts');
            const data = await response.json();
            this.alerts = data.alerts || [];
        } catch (error) {
            console.error('Error loading alerts:', error);
        }
    }

    renderDashboard() {
        this.updateStats();
        this.renderMarketOverview();
        this.renderHoldings();
        this.renderWatchlist();
        this.renderAlerts();
        this.renderRecentActivity();
        this.renderPortfolioChart();
    }

    updateStats() {
        // Calculate portfolio value and P&L
        let totalValue = 0;
        let totalInvestment = 0;
        let totalPL = 0;

        this.portfolio.forEach(holding => {
            const currentPrice = holding.current_price || 0;
            const value = currentPrice * holding.shares;
            totalValue += value;
            totalInvestment += holding.total_investment || 0;
        });

        totalPL = totalValue - totalInvestment;
        const totalPLPercent = totalInvestment > 0 ? (totalPL / totalInvestment * 100) : 0;

        // Update portfolio value
        document.getElementById('portfolioValue').textContent = this.formatCurrency(totalValue);
        const changeText = `${totalPL >= 0 ? '+' : ''}${this.formatCurrency(totalPL)} (${totalPLPercent.toFixed(2)}%)`;
        document.getElementById('portfolioChange').textContent = changeText;

        // Update total P&L
        document.getElementById('totalPL').textContent = this.formatCurrency(totalPL);
        document.getElementById('totalPLPercent').textContent = `${totalPLPercent >= 0 ? '+' : ''}${totalPLPercent.toFixed(2)}%`;

        // Update color based on P&L
        const plElement = document.getElementById('totalPL').parentElement;
        if (totalPL >= 0) {
            plElement.classList.remove('from-red-500', 'to-red-600');
            plElement.classList.add('from-green-500', 'to-green-600');
        } else {
            plElement.classList.remove('from-green-500', 'to-green-600');
            plElement.classList.add('from-red-500', 'to-red-600');
        }

        // Update watchlist count
        document.getElementById('watchlistCount').textContent = this.watchlist.length;

        // Update alerts count (only non-triggered)
        const activeAlertsCount = this.alerts.filter(a => !a.triggered).length;
        document.getElementById('activeAlerts').textContent = activeAlertsCount;
    }

    renderMarketOverview() {
        // Calculate market stats
        let totalMarketCap = 0;
        let gainers = 0;
        let losers = 0;

        this.stocks.forEach(stock => {
            const marketCapStr = stock.marketCap;
            if (marketCapStr && marketCapStr !== 'N/A') {
                const value = parseFloat(marketCapStr.replace(/[^0-9.]/g, ''));
                if (marketCapStr.includes('B')) {
                    totalMarketCap += value;
                } else if (marketCapStr.includes('M')) {
                    totalMarketCap += value / 1000;
                }
            }

            if (stock.change > 0) gainers++;
            if (stock.change < 0) losers++;
        });

        document.getElementById('totalMarketCap').textContent = `${totalMarketCap.toFixed(2)} B MAD`;
        document.getElementById('gainersCount').textContent = gainers;
        document.getElementById('losersCount').textContent = losers;

        // Top gainers and losers
        const sortedByGain = [...this.stocks].sort((a, b) => b.change - a.change);
        const topGainers = sortedByGain.slice(0, 5);
        const topLosers = sortedByGain.slice(-5).reverse();

        this.renderTopStocks('topGainers', topGainers);
        this.renderTopStocks('topLosers', topLosers);
    }

    renderTopStocks(elementId, stocks) {
        const container = document.getElementById(elementId);
        container.innerHTML = stocks.map(stock => `
            <a href="/stocks.html?symbol=${encodeURIComponent(stock.symbol)}"
               class="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                <div>
                    <p class="font-semibold text-gray-900">${stock.symbol}</p>
                    <p class="text-xs text-gray-600">${this.formatCurrency(stock.price)}</p>
                </div>
                <span class="font-bold ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%
                </span>
            </a>
        `).join('');
    }

    renderHoldings() {
        const container = document.getElementById('holdingsTable');

        if (this.portfolio.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i data-feather="inbox" class="mx-auto mb-2"></i>
                    <p>No holdings yet. Start building your portfolio!</p>
                </div>
            `;
            feather.replace();
            return;
        }

        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b">
                        <tr>
                            <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Symbol</th>
                            <th class="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Shares</th>
                            <th class="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Avg Price</th>
                            <th class="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Current</th>
                            <th class="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">P&L</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.portfolio.slice(0, 5).map(holding => {
                            const currentPrice = holding.current_price || 0;
                            const avgPrice = holding.buy_price || 0;
                            const pl = (currentPrice - avgPrice) * holding.shares;
                            const plPercent = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice * 100) : 0;

                            return `
                                <tr class="border-b hover:bg-gray-50">
                                    <td class="py-3 px-4">
                                        <p class="font-semibold text-gray-900">${holding.symbol}</p>
                                        <p class="text-xs text-gray-600">${holding.name}</p>
                                    </td>
                                    <td class="text-right py-3 px-4 text-gray-900">${holding.shares}</td>
                                    <td class="text-right py-3 px-4 text-gray-900">${this.formatCurrency(avgPrice)}</td>
                                    <td class="text-right py-3 px-4 text-gray-900">${this.formatCurrency(currentPrice)}</td>
                                    <td class="text-right py-3 px-4">
                                        <div class="font-semibold ${pl >= 0 ? 'text-green-600' : 'text-red-600'}">
                                            ${pl >= 0 ? '+' : ''}${this.formatCurrency(pl)}
                                        </div>
                                        <div class="text-xs ${pl >= 0 ? 'text-green-600' : 'text-red-600'}">
                                            ${pl >= 0 ? '+' : ''}${plPercent.toFixed(2)}%
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderWatchlist() {
        const container = document.getElementById('watchlistActivity');

        if (this.watchlist.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <i data-feather="star" class="mx-auto mb-2"></i>
                    <p class="text-sm">No stocks in watchlist</p>
                </div>
            `;
            feather.replace();
            return;
        }

        container.innerHTML = this.watchlist.slice(0, 5).map(item => {
            const change = item.change || 0;
            return `
                <a href="/stocks.html?symbol=${encodeURIComponent(item.symbol)}"
                   class="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                    <div>
                        <p class="font-semibold text-gray-900">${item.symbol}</p>
                        <p class="text-xs text-gray-600">${item.name}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-semibold text-gray-900">${this.formatCurrency(item.current_price || 0)}</p>
                        <p class="text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}">
                            ${change >= 0 ? '+' : ''}${change.toFixed(2)}%
                        </p>
                    </div>
                </a>
            `;
        }).join('');
    }

    renderAlerts() {
        const container = document.getElementById('activeAlertsList');
        const activeAlerts = this.alerts.filter(a => !a.triggered).slice(0, 5);

        if (activeAlerts.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <i data-feather="bell-off" class="mx-auto mb-2"></i>
                    <p class="text-sm">No active alerts</p>
                </div>
            `;
            feather.replace();
            return;
        }

        container.innerHTML = activeAlerts.map(alert => {
            const condition = alert.condition === 'above' ? '↑' : '↓';
            return `
                <div class="p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center justify-between mb-1">
                        <p class="font-semibold text-gray-900">${alert.symbol}</p>
                        <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">${condition} ${this.formatCurrency(alert.target_price)}</span>
                    </div>
                    <p class="text-xs text-gray-600">Current: ${this.formatCurrency(alert.current_price || 0)}</p>
                </div>
            `;
        }).join('');
    }

    renderRecentActivity() {
        const container = document.getElementById('recentActivity');

        // Combine recent portfolio additions and watchlist additions
        const activities = [];

        this.portfolio.slice(0, 3).forEach(item => {
            activities.push({
                type: 'portfolio',
                symbol: item.symbol,
                name: item.name,
                date: item.buy_date || item.created_at,
                icon: 'briefcase'
            });
        });

        this.watchlist.slice(0, 2).forEach(item => {
            activities.push({
                type: 'watchlist',
                symbol: item.symbol,
                name: item.name,
                date: item.added_date,
                icon: 'star'
            });
        });

        // Sort by date
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (activities.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <i data-feather="clock" class="mx-auto mb-2"></i>
                    <p class="text-sm">No recent activity</p>
                </div>
            `;
            feather.replace();
            return;
        }

        container.innerHTML = activities.slice(0, 5).map(activity => `
            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div class="flex-shrink-0">
                    <i data-feather="${activity.icon}" class="text-gray-600"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-semibold text-gray-900 text-sm truncate">${activity.symbol}</p>
                    <p class="text-xs text-gray-600">${activity.type === 'portfolio' ? 'Added to portfolio' : 'Added to watchlist'}</p>
                </div>
            </div>
        `).join('');

        feather.replace();
    }

    renderPortfolioChart() {
        const ctx = document.getElementById('portfolioChart');
        if (!ctx) return;

        // Calculate real portfolio values
        let totalInvestment = 0;
        let totalCurrentValue = 0;

        this.portfolio.forEach(holding => {
            const currentPrice = holding.current_price || 0;
            const investmentValue = holding.total_investment || 0;
            const currentValue = currentPrice * holding.shares;

            totalInvestment += investmentValue;
            totalCurrentValue += currentValue;
        });

        // If no portfolio, show empty state
        if (this.portfolio.length === 0 || totalInvestment === 0) {
            totalInvestment = 0;
            totalCurrentValue = 0;
        }

        // Create stable chart showing investment vs current value
        const labels = ['Initial Investment', 'Current Value'];
        const data = [totalInvestment, totalCurrentValue];

        // Calculate if overall trend is positive
        const isPositive = totalCurrentValue >= totalInvestment;

        if (this.portfolioChart) {
            this.portfolioChart.destroy();
        }

        this.portfolioChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Amount (MAD)',
                    data: data,
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',  // Blue for investment
                        isPositive ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'  // Green/Red for current
                    ],
                    borderColor: [
                        'rgba(59, 130, 246, 1)',
                        isPositive ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)'
                    ],
                    borderWidth: 2,
                    borderRadius: 8,
                    barThickness: 80
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: isPositive ? '#10b981' : '#ef4444',
                        borderWidth: 2,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: (context) => 'Value: ' + this.formatCurrency(context.parsed.y)
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#374151',
                            font: {
                                size: 13,
                                weight: '600',
                                family: 'system-ui'
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#6b7280',
                            font: {
                                size: 12,
                                family: 'system-ui'
                            },
                            callback: (value) => this.formatCurrency(value)
                        }
                    }
                }
            }
        });
    }

    formatCurrency(value) {
        if (value === null || value === undefined || isNaN(value)) return '0.00 MAD';
        return `${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
    }
}

// Initialize dashboard
const dashboard = new DashboardManager();
document.addEventListener('DOMContentLoaded', () => {
    dashboard.init();
});
