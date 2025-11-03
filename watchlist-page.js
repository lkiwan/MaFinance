// Watchlist Page Functionality

let currentStockPrices = {};

// Tab switching
function switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active', 'border-blue-600', 'text-blue-600');
        btn.classList.add('border-transparent', 'text-gray-500');
    });

    const activeTab = document.getElementById(`${tab}-tab`);
    activeTab.classList.add('active', 'border-blue-600', 'text-blue-600');
    activeTab.classList.remove('border-transparent', 'text-gray-500');

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`${tab}-content`).classList.remove('hidden');

    // Load content
    if (tab === 'watchlist') loadWatchlist();
    else if (tab === 'portfolio') loadPortfolio();
    else if (tab === 'alerts') loadAlerts();

    feather.replace();
}

// Load current stock prices
async function loadStockPrices() {
    try {
        const response = await fetch('/api/stocks');
        if (response.ok) {
            const data = await response.json();
            data.stocks.forEach(stock => {
                currentStockPrices[stock.symbol] = {
                    price: stock.price,
                    change: stock.change,
                    volume: stock.volume,
                    name: stock.name
                };
            });
        }
    } catch (error) {
        console.error('Error loading stock prices:', error);
    }
}

// Load Watchlist
async function loadWatchlist() {
    await loadStockPrices();

    const watchlist = await watchlistManager.getWatchlist();
    const container = document.getElementById('watchlist-stocks');
    const emptyState = document.getElementById('watchlist-empty');

    document.getElementById('watchlist-count').textContent = watchlist.length;

    if (watchlist.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    container.innerHTML = watchlist.map(item => {
        const currentData = currentStockPrices[item.symbol] || {};
        const currentPrice = currentData.price || item.added_price;
        const priceChange = currentData.change || 0;
        const priceChangeFromAdded = item.added_price ? ((currentPrice - item.added_price) / item.added_price * 100) : 0;

        return `
            <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">${currentData.name || item.name}</h3>
                        <p class="text-sm text-gray-500">${item.symbol}</p>
                    </div>
                    <button onclick="watchlistManager.removeFromWatchlist('${item.symbol}')" class="text-gray-400 hover:text-red-600">
                        <i data-feather="trash-2"></i>
                    </button>
                </div>

                <div class="space-y-3">
                    <div>
                        <p class="text-sm text-gray-600">Current Price</p>
                        <p class="text-2xl font-bold text-gray-900">${currentPrice.toFixed(2)} MAD</p>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-xs text-gray-500">Today's Change</p>
                            <p class="text-sm font-semibold ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}">
                                ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%
                            </p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500">Since Added</p>
                            <p class="text-sm font-semibold ${priceChangeFromAdded >= 0 ? 'text-green-600' : 'text-red-600'}">
                                ${priceChangeFromAdded >= 0 ? '+' : ''}${priceChangeFromAdded.toFixed(2)}%
                            </p>
                        </div>
                    </div>

                    <div class="pt-3 border-t border-gray-200 text-xs text-gray-500">
                        Added: ${new Date(item.added_date).toLocaleDateString()} at ${item.added_price.toFixed(2)} MAD
                    </div>
                </div>

                <div class="flex gap-2 mt-4">
                    <a href="/stock-details.html?symbol=${item.symbol}" class="flex-1 text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        View Details
                    </a>
                    <button onclick="addToPortfolioFromWatchlist('${item.symbol}', '${(item.name || '').replace(/'/g, "\\'")}', ${currentPrice})" class="flex-1 text-center bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm">
                        Add to Portfolio
                    </button>
                </div>
            </div>
        `;
    }).join('');

    feather.replace();
}

// Load Portfolio
async function loadPortfolio() {
    await loadStockPrices();

    const portfolio = await watchlistManager.getPortfolio();
    const container = document.getElementById('portfolio-holdings');
    const emptyState = document.getElementById('portfolio-empty');

    document.getElementById('portfolio-count').textContent = portfolio.length;

    if (portfolio.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        updatePortfolioSummary(0, 0, 0, 0);
        return;
    }

    emptyState.classList.add('hidden');

    let totalInvestment = 0;
    let totalCurrentValue = 0;

    const rows = portfolio.map(holding => {
        const currentData = currentStockPrices[holding.symbol] || {};
        const currentPrice = currentData.price || holding.buy_price || holding.current_price || 0;
        const currentValue = holding.shares * currentPrice;
        const profit = currentValue - holding.total_investment;
        const profitPercentage = holding.total_investment > 0 ? (profit / holding.total_investment) * 100 : 0;

        totalInvestment += holding.total_investment;
        totalCurrentValue += currentValue;

        return `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-4">
                    <div class="font-semibold text-gray-900">${currentData.name || holding.name}</div>
                    <div class="text-sm text-gray-500">${holding.symbol}</div>
                </td>
                <td class="px-4 py-4 text-center">${holding.shares}</td>
                <td class="px-4 py-4 text-right">${holding.buy_price.toFixed(2)}</td>
                <td class="px-4 py-4 text-right">${currentPrice.toFixed(2)}</td>
                <td class="px-4 py-4 text-right">${holding.total_investment.toFixed(2)}</td>
                <td class="px-4 py-4 text-right font-semibold">${currentValue.toFixed(2)}</td>
                <td class="px-4 py-4 text-right font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${profit >= 0 ? '+' : ''}${profit.toFixed(2)}<br>
                    <span class="text-xs">(${profit >= 0 ? '+' : ''}${profitPercentage.toFixed(2)}%)</span>
                </td>
                <td class="px-4 py-4 text-center">
                    <button onclick="watchlistManager.removeFromPortfolio(${holding.id})" class="text-red-600 hover:text-red-800">
                        <i data-feather="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <table class="responsive-table w-full">
            <thead>
                <tr>
                    <th class="px-4 py-3 text-left">Stock</th>
                    <th class="px-4 py-3 text-center">Shares</th>
                    <th class="px-4 py-3 text-right">Buy Price</th>
                    <th class="px-4 py-3 text-right">Current Price</th>
                    <th class="px-4 py-3 text-right">Investment</th>
                    <th class="px-4 py-3 text-right">Current Value</th>
                    <th class="px-4 py-3 text-right">Profit/Loss</th>
                    <th class="px-4 py-3 text-center">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;

    const totalProfit = totalCurrentValue - totalInvestment;
    const returnPercentage = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;

    updatePortfolioSummary(totalInvestment, totalCurrentValue, totalProfit, returnPercentage);
    feather.replace();
}

function updatePortfolioSummary(investment, currentValue, profit, returnPercentage) {
    document.getElementById('total-investment').textContent = `${investment.toFixed(2)} MAD`;
    document.getElementById('current-value').textContent = `${currentValue.toFixed(2)} MAD`;

    const profitElement = document.getElementById('total-profit');
    profitElement.textContent = `${profit >= 0 ? '+' : ''}${profit.toFixed(2)} MAD`;
    profitElement.className = `text-3xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`;

    const returnElement = document.getElementById('return-percentage');
    returnElement.textContent = `${returnPercentage >= 0 ? '+' : ''}${returnPercentage.toFixed(2)}%`;
    returnElement.className = `text-3xl font-bold ${returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`;
}

// Load Alerts
async function loadAlerts() {
    // Fetch from backend API instead of localStorage
    let alerts = [];
    try {
        const response = await fetch('/api/alerts');
        if (response.ok) {
            const data = await response.json();
            alerts = data.alerts || [];
        }
    } catch (error) {
        console.error('Error loading alerts:', error);
    }

    const container = document.getElementById('alerts-list');
    const emptyState = document.getElementById('alerts-empty');

    const activeAlerts = alerts.filter(a => !a.triggered);
    document.getElementById('alerts-count').textContent = activeAlerts.length;

    if (alerts.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    container.innerHTML = alerts.map(alert => {
        const conditionText = alert.condition === 'above' ? '↑' : '↓';
        const conditionColor = alert.condition === 'above' ? 'text-green-600' : 'text-red-600';
        const targetPrice = alert.target_price || 0;
        const currentPrice = alert.current_price || 0;

        return `
            <div class="bg-white border ${alert.triggered ? 'border-gray-200 opacity-60' : 'border-blue-200'} rounded-lg p-4 flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 ${alert.triggered ? 'bg-gray-100' : 'bg-blue-100'} rounded-full flex items-center justify-center ${conditionColor} text-2xl font-bold">
                        ${conditionText}
                    </div>
                    <div>
                        <h4 class="font-semibold text-gray-900">${alert.name} (${alert.symbol})</h4>
                        <p class="text-sm text-gray-600">
                            Alert when price goes ${alert.condition} ${targetPrice.toFixed(2)} MAD
                        </p>
                        <p class="text-xs text-gray-500 mt-1">
                            Current Price: ${currentPrice.toFixed(2)} MAD
                        </p>
                        <p class="text-xs text-gray-500 mt-1">
                            Created: ${alert.created_date ? new Date(alert.created_date).toLocaleDateString() : 'N/A'}
                            ${alert.triggered ? ' • <span class="text-green-600 font-semibold">✓ Triggered</span>' : ''}
                        </p>
                    </div>
                </div>
                <button onclick="deleteAlert(${alert.id})" class="text-gray-400 hover:text-red-600">
                    <i data-feather="trash-2"></i>
                </button>
            </div>
        `;
    }).join('');

    feather.replace();
}

// Modal functions
function showAddPortfolioModal() {
    document.getElementById('add-portfolio-modal').classList.remove('hidden');
}

function closeAddPortfolioModal() {
    document.getElementById('add-portfolio-modal').classList.add('hidden');
    document.getElementById('add-portfolio-form').reset();
}

async function handleAddPortfolio(event) {
    event.preventDefault();

    const symbol = document.getElementById('portfolio-symbol').value.trim().toUpperCase();
    const name = document.getElementById('portfolio-name').value.trim();
    const shares = parseFloat(document.getElementById('portfolio-shares').value);
    const buyPrice = parseFloat(document.getElementById('portfolio-price').value);
    const buyDate = document.getElementById('portfolio-date').value;

    await watchlistManager.addToPortfolio(symbol, name, shares, buyPrice, new Date(buyDate).toISOString());
    closeAddPortfolioModal();
    await loadPortfolio();
}

function addToPortfolioFromWatchlist(symbol, name, currentPrice) {
    document.getElementById('portfolio-symbol').value = symbol;
    document.getElementById('portfolio-name').value = name;
    document.getElementById('portfolio-price').value = currentPrice.toFixed(2);
    showAddPortfolioModal();
}

function showAddAlertModal() {
    document.getElementById('add-alert-modal').classList.remove('hidden');
}

function closeAddAlertModal() {
    document.getElementById('add-alert-modal').classList.add('hidden');
    document.getElementById('add-alert-form').reset();
}

async function handleAddAlert(event) {
    event.preventDefault();

    const symbol = document.getElementById('alert-symbol').value.trim().toUpperCase();
    const name = document.getElementById('alert-name').value.trim();
    const targetPrice = parseFloat(document.getElementById('alert-price').value);
    const condition = document.getElementById('alert-condition').value;

    try {
        const response = await fetch('/api/alerts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                symbol: symbol,
                name: name,
                target_price: targetPrice,
                condition: condition
            })
        });

        if (response.ok) {
            showNotification('Alert created successfully!', 'success');
            closeAddAlertModal();
            loadAlerts();
            document.getElementById('add-alert-form').reset();
        } else {
            const data = await response.json();
            showNotification(data.message || 'Failed to create alert', 'error');
        }
    } catch (error) {
        console.error('Error creating alert:', error);
        showNotification('Failed to create alert. Please try again.', 'error');
    }
}

// Delete alert function
async function deleteAlert(alertId) {
    if (!confirm('Are you sure you want to delete this alert?')) {
        return;
    }

    try {
        const response = await fetch(`/api/alerts/${alertId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showNotification('Alert deleted successfully', 'success');
            loadAlerts();
        } else {
            showNotification('Failed to delete alert', 'error');
        }
    } catch (error) {
        console.error('Error deleting alert:', error);
        showNotification('Failed to delete alert', 'error');
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `px-6 py-3 rounded-lg shadow-lg text-white ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } animate-fade-in`;
    notification.textContent = message;
    container.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Update counts
async function updateCounts() {
    const stats = await watchlistManager.getStats();
    document.getElementById('watchlist-count').textContent = stats.watchlistCount;
    document.getElementById('portfolio-count').textContent = stats.portfolioCount;

    // Fetch alerts count from API
    try {
        const response = await fetch('/api/alerts');
        if (response.ok) {
            const data = await response.json();
            const activeAlerts = data.alerts ? data.alerts.filter(a => !a.triggered) : [];
            document.getElementById('alerts-count').textContent = activeAlerts.length;
        }
    } catch (error) {
        console.error('Error fetching alerts count:', error);
        document.getElementById('alerts-count').textContent = '0';
    }
}

// Listen for updates
window.addEventListener('watchlistUpdated', () => {
    updateCounts();
    loadWatchlist();
});

window.addEventListener('portfolioUpdated', () => {
    updateCounts();
    loadPortfolio();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateCounts();
    loadWatchlist();

    // Auto-refresh every 30 seconds
    setInterval(() => {
        const activeTab = document.querySelector('.tab-button.active').id.replace('-tab', '');
        if (activeTab === 'watchlist') loadWatchlist();
        else if (activeTab === 'portfolio') loadPortfolio();
    }, 30000);
});
