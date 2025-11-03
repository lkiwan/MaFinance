
// --- UTILITY FUNCTIONS & MANAGERS ---
const utils = {
    showNotification: (message, type = 'info') => {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'fixed top-4 right-4 z-[9999] space-y-2';
            document.body.appendChild(container);
        }

        const notification = document.createElement('div');
        let bgColor, icon;
        
        switch (type) {
            case 'success':
                bgColor = 'bg-green-500';
                icon = '<i data-feather="check-circle" class="h-5 w-5 mr-2"></i>';
                break;
            case 'error':
                bgColor = 'bg-red-500';
                icon = '<i data-feather="x-circle" class="h-5 w-5 mr-2"></i>';
                break;
            case 'info':
            default:
                bgColor = 'bg-blue-500';
                icon = '<i data-feather="info" class="h-5 w-5 mr-2"></i>';
                break;
        }

        notification.className = `p-4 rounded-lg shadow-xl text-white max-w-sm flex items-center ${bgColor} animate-fade-in`;
        notification.innerHTML = `${icon}<span>${message}</span>`;
        
        container.appendChild(notification);
        feather.replace();
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
        
        console.log(`[Notification ${type.toUpperCase()}]: ${message}`);
    },
    debounce: (func, delay) => {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    },
    validateEmail: (email) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
};

const stockManager = {
    stocks: [],
    
    formatCurrency: (price) => {
        const numPrice = parseFloat(price);
        if (isNaN(numPrice) || numPrice === 0) return 'N/A';
        
        return new Intl.NumberFormat('en-MA', { 
            style: 'currency', 
            currency: 'MAD',
            minimumFractionDigits: 2
        }).format(numPrice);
    },
    
    getPriceChangeColor: (change) => {
        const numChange = parseFloat(change);
        if (isNaN(numChange)) return 'text-gray-600';
        
        if (numChange > 0) return 'price-up';
        if (numChange < 0) return 'price-down';
        return 'text-gray-600';
    },
    
    formatPercentage: (change) => {
        const numChange = parseFloat(change);
        if (isNaN(numChange)) return '0.00%';
        
        const sign = numChange > 0 ? '+' : '';
        return `${sign}${numChange.toFixed(2)}%`;
    },
    
    fetchStockDetails: async (symbol) => {
         try {
            // Appelle l'API Flask pour obtenir les détails et les données de graphique
            const response = await fetch(`/api/stocks/${symbol}`);
            if (!response.ok) throw new Error(`Failed to fetch details for ${symbol}`);
            return response.json();
        } catch (error) {
            console.error(`Error fetching stock details for ${symbol}:`, error);
            return null;
        }
    }
};
// --- END UTILITY FUNCTIONS & MANAGERS ---

feather.replace();

let allStocks = [];
let dataRefreshInterval;

function populateSectorFilter(sectors) {
    const sectorFilter = document.getElementById('sectorFilter');
    if (sectorFilter) {
        let allOption = sectorFilter.querySelector('option[value=""]');
        
        const options = Array.from(sectorFilter.options);
        options.filter(opt => opt.value !== "").forEach(opt => opt.remove());

        if (!allOption) {
            allOption = document.createElement('option');
            allOption.value = "";
            allOption.textContent = "All Sectors";
            sectorFilter.appendChild(allOption);
        }
        
        sectors.forEach(sector => {
            const option = document.createElement('option');
            option.value = sector.toLowerCase(); 
            option.textContent = sector;
            sectorFilter.appendChild(option);
        });
    }
}

function displayStatus(source, timestamp) {
    let statusMessage = document.getElementById('data-status-message');
    
    if (!statusMessage) {
        // Find main container to insert status message
        const mainContainer = document.querySelector('main .container.mx-auto.px-6');
        if (!mainContainer) return;
        
        statusMessage = document.createElement('p');
        statusMessage.id = 'data-status-message';
        statusMessage.className = 'text-center text-sm text-gray-500 mt-6 font-semibold';
        
        const grid = document.getElementById('stocksGrid');
        if (grid && grid.parentNode) {
            grid.parentNode.insertBefore(statusMessage, grid.nextSibling);
        } else {
            mainContainer.appendChild(statusMessage);
        }
    }

    let sourceText = '';
    if (source === 'SCRAPE') {
        sourceText = 'Delayed data via BVC website scraping.';
    } else {
        sourceText = 'Simulated data due to scrape failure (CSV file not found).';
    }
    
    statusMessage.innerHTML = `
        📊 Data delayed by up to 15 minutes — Source: Bourse de Casablanca. 
        <span class="block text-xs text-gray-400">(${sourceText} | Last Updated: ${timestamp})</span>
    `;
}

function renderSearchResults(searchTerm) {
    const resultsContainer = document.getElementById('searchResults');
    
    if (!resultsContainer) return; 
    
    resultsContainer.innerHTML = '';
    
    if (!searchTerm) {
        resultsContainer.classList.add('hidden');
        return;
    }
    
    const stocksToSearch = allStocks;
    
    const matches = stocksToSearch.filter(stock => 
        (stock.name && stock.name.toLowerCase().includes(searchTerm)) || 
        (stock.symbol && stock.symbol.toLowerCase().includes(searchTerm)) ||
        (stock.sector && stock.sector.toLowerCase().includes(searchTerm))
    ).slice(0, 6);
    
    if (matches.length > 0) {
        resultsContainer.classList.remove('hidden');
        matches.forEach(stock => {
            const item = document.createElement('div');
            item.className = 'search-result-item flex justify-between items-center hover:bg-blue-50';
            item.innerHTML = `
                <span>${stock.name} (<span class="font-semibold">${stock.symbol}</span>)</span>
                <span class="text-sm text-gray-500">${stock.sector}</span>
            `;
            
            item.addEventListener('click', () => {
                const inputField = document.getElementById('searchStocks');
                inputField.value = stock.symbol;
                resultsContainer.classList.add('hidden');
                updateView();
            });
            
            resultsContainer.appendChild(item);
        });
        resultsContainer.classList.remove('hidden');
    } else {
        resultsContainer.classList.add('hidden');
    }
}

function hideSearchResults() {
    const resultsContainer = document.getElementById('searchResults');
    if (resultsContainer) {
        resultsContainer.classList.add('hidden');
    }
}


function renderStocks(stocks) {
    const grid = document.getElementById('stocksGrid');
    grid.innerHTML = '';

    if (stocks.length === 0) {
         grid.innerHTML = `<div class="col-span-full text-center py-12"><p class="text-gray-600">No stocks found matching your criteria.</p></div>`;
        return;
    }
    
    const isFilteredOrSearched = document.getElementById('searchStocks').value.trim() !== '' || document.getElementById('sectorFilter').value !== '';
    let stocksToDisplay = stocks;
    
    if (document.getElementById('sortBy').value === 'top10' && !isFilteredOrSearched) {
         stocksToDisplay = stocks.slice(0, 10);
    } 
    
    stocksToDisplay.forEach(stock => {
        const template = document.getElementById('stockCardTemplate');
        const stockCard = template.content.cloneNode(true);
        
        // --- Set Card Data ---
        stockCard.querySelector('.stock-name').textContent = stock.name || stock.symbol;
        stockCard.querySelector('.stock-symbol').textContent = stock.symbol;
        
        const changeElement = stockCard.querySelector('.stock-change');
        changeElement.textContent = stockManager.formatPercentage(stock.change || 0);
        
        // Clear existing classes and add new ones
        changeElement.className = 'stock-change px-2 py-1 rounded-full text-xs font-medium ' + 
                                 ((stock.change || 0) > 0 ? 'bg-green-100 text-green-800' : 
                                  (stock.change || 0) < 0 ? 'bg-red-100 text-red-800' : 
                                  'bg-gray-100 text-gray-800');
        
        stockCard.querySelector('.stock-price').textContent = stockManager.formatCurrency(stock.price || 0);
        
        const volumeValue = stock.volume;
        stockCard.querySelector('.stock-volume').textContent = volumeValue ? volumeValue.toLocaleString() : '0';
        stockCard.querySelector('.stock-sector').textContent = stock.sector || 'N/A';
        stockCard.querySelector('.stock-marketcap').textContent = stock.marketCap || 'N/A';
        
        // --- Set Hidden Details Data (from 'details' object) ---
        if (stock.details) {
            stockCard.querySelector('.stock-statut').textContent = stock.details.statut || '-';
            stockCard.querySelector('.stock-cours-reference').textContent = stock.details.cours_reference || '-';
            stockCard.querySelector('.stock-ouverture').textContent = stock.details.ouverture || '-';
            stockCard.querySelector('.stock-plus-haut').textContent = stock.details.plus_haut_jour || '-';
            stockCard.querySelector('.stock-plus-bas').textContent = stock.details.plus_bas_jour || '-';
            stockCard.querySelector('.stock-prix-achat').textContent = stock.details.meilleur_prix_achat || '-';
            stockCard.querySelector('.stock-prix-vente').textContent = stock.details.meilleur_prix_vente || '-';
            stockCard.querySelector('.stock-quantite-achat').textContent = stock.details.quantite_meilleur_prix_achat ? stock.details.quantite_meilleur_prix_achat.toLocaleString() : '0';
            stockCard.querySelector('.stock-quantite-vente').textContent = stock.details.quantite_meilleur_prix_vente ? stock.details.quantite_meilleur_prix_vente.toLocaleString() : '0';
            stockCard.querySelector('.stock-transactions').textContent = stock.details.nombre_transactions ? stock.details.nombre_transactions.toLocaleString() : '0';
        }
        
        // --- Event Listeners for Buttons ---
        
        // 1. Add to Watchlist Button
        const watchlistButton = stockCard.querySelector('.stock-add-watchlist');

        // Check if stock is already in watchlist
        watchlistManager.isInWatchlist(stock.symbol).then(isInWatchlist => {
            if (isInWatchlist) {
                watchlistButton.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
                watchlistButton.classList.add('bg-green-500', 'hover:bg-green-600');
                watchlistButton.innerHTML = '<i data-feather="check" class="w-4 h-4"></i>';
                watchlistButton.disabled = true;
                watchlistButton.title = 'Already in Watchlist';
                feather.replace();
            }
        });

        watchlistButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            const success = await watchlistManager.addToWatchlist({
                symbol: stock.symbol,
                name: stock.name,
                price: stock.price
            });

            if (success) {
                // Change button appearance to show it's added
                watchlistButton.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
                watchlistButton.classList.add('bg-green-500', 'hover:bg-green-600');
                watchlistButton.innerHTML = '<i data-feather="check" class="w-4 h-4"></i>';
                watchlistButton.disabled = true;
                watchlistButton.title = 'Already in Watchlist';
                feather.replace();
            }
        });

        // 2. Toggle Details Button
        const toggleButton = stockCard.querySelector('.stock-toggle-details');
        const detailsContainer = stockCard.querySelector('.stock-details-container');

        toggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            detailsContainer.classList.toggle('hidden');
        });

        // 3. View Details (Page Navigation)
        const viewDetailsLink = stockCard.querySelector('.stock-view-details');
        // MODIFICATION CLÉ: Assurez-vous que le lien navigue vers la page de détails avec le symbole.
        viewDetailsLink.href = `stock-details.html?symbol=${encodeURIComponent(stock.symbol)}`;

        // 4. Analyse (Modal)
        const detailsLink = stockCard.querySelector('.stock-details-link');
        detailsLink.href = `#${stock.symbol}`;
        detailsLink.addEventListener('click', (e) => {
            e.preventDefault();
            openStockModal(stock);
        });
        
        // Make the entire card clickable to navigate to stock details
        const cardElement = stockCard.querySelector('.stock-card');
        if (cardElement) {
            cardElement.style.cursor = 'pointer';
            cardElement.addEventListener('click', (e) => {
                // Prevent navigation if clicking on buttons or links
                if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || 
                    e.target.closest('button') || e.target.closest('a')) {
                    return;
                }
                window.location.href = `stock-details.html?symbol=${encodeURIComponent(stock.symbol)}`;
            });
        }
        
        grid.appendChild(stockCard);
    });
}

function getFilteredAndSortedStocks() {
    const stocks = allStocks;
    
    const searchInput = document.getElementById('searchStocks');
    const sectorFilter = document.getElementById('sectorFilter');
    const sortByElement = document.getElementById('sortBy');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const sector = sectorFilter ? sectorFilter.value : '';
    const sortBy = sortByElement ? sortByElement.value : 'change';

    let filteredStocks = stocks;

    if (searchTerm) {
        filteredStocks = filteredStocks.filter(stock => 
            (stock.name && stock.name.toLowerCase().includes(searchTerm)) || 
            (stock.symbol && stock.symbol.toLowerCase().includes(searchTerm)) ||
            (stock.sector && stock.sector.toLowerCase().includes(searchTerm))
        );
        renderSearchResults(searchTerm);
    } else {
        hideSearchResults();
    }

    if (sector) {
        filteredStocks = filteredStocks.filter(stock => (stock.sector || '').toLowerCase() === sector);
    }

    let sortedStocks = [...filteredStocks];

    if (sortBy === 'top10') {
        sortedStocks.sort((a, b) => 
            Math.abs(b.change || 0) - Math.abs(a.change || 0)
        );
        
    } else {
        sortedStocks.sort((a, b) => {
            switch(sortBy) {
                case 'price': 
                    return (b.price || 0) - (a.price || 0);
                case 'change': 
                    return (b.change || 0) - (a.change || 0);
                case 'name':
                default: 
                    return (a.name || '').localeCompare(b.name || '');
            }
        });
    }
    
    return sortedStocks;
}

function updateView() {
    const updatedStocks = getFilteredAndSortedStocks();
    renderStocks(updatedStocks);
}

function startAutoRefresh() {
    if (dataRefreshInterval) clearInterval(dataRefreshInterval);
    
    dataRefreshInterval = setInterval(() => {
        loadStocks(false);
    }, 60000); // 60 secondes
}

async function openStockModal(stock) {
    const modal = document.getElementById('stockModal');
    const modalStockName = document.getElementById('modalStockName');
    const modalContent = document.getElementById('modalContent');
    
    modalStockName.textContent = `${stock.name || stock.symbol} (${stock.symbol})`;
    
    modalContent.innerHTML = `
        <div class="text-center py-8">
            <div class="loading-spinner mx-auto mb-4"></div>
            <p class="text-gray-600">Fetching detailed data...</p>
        </div>
    `;
    modal.classList.remove('hidden');

    const fullData = await stockManager.fetchStockDetails(stock.symbol); 
    
    if (!fullData || !fullData.details) {
        modalContent.innerHTML = '<p class="text-red-500 text-center py-8">Failed to load stock details.</p>';
        return;
    }

    const details = fullData.details;
    const chartData = fullData.chart_data;

    const createDetailRow = (label, value) => `
        <div class="flex justify-between border-b border-gray-100 py-2">
            <span class="text-gray-600">${label}</span>
            <span class="text-gray-900 font-medium">${value}</span>
        </div>
    `;

    // Générer le contenu du modal (similaire à votre code original)
    modalContent.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Stock Information Column -->
            <div>
                <h3 class="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Overview</h3>
                <div class="space-y-1">
                    ${createDetailRow('Current Price', `<span class="text-xl font-bold ${stockManager.getPriceChangeColor(details.change)}">${stockManager.formatCurrency(details.price)}</span>`)}
                    ${createDetailRow('Daily Change', `<span class="font-semibold ${stockManager.getPriceChangeColor(details.change)}">${stockManager.formatPercentage(details.change)}</span>`)}
                    ${createDetailRow('Volume Échangé', (details.quantite_echangee || 0).toLocaleString())}
                    ${createDetailRow('Volume (MAD)', details.volume_mad || 'N/A')}
                    ${createDetailRow('Sector', details.sector || 'N/A')}
                    ${createDetailRow('Market Cap', details.marketCap || 'N/A')}
                    ${createDetailRow('Cours de Référence', details.cours_reference || 'N/A')}
                    ${createDetailRow('Ouverture', details.ouverture || 'N/A')}
                    ${createDetailRow('Plus Haut Jour', details.plus_haut_jour || 'N/A')}
                    ${createDetailRow('Plus Bas Jour', details.plus_bas_jour || 'N/A')}
                    ${createDetailRow('Meilleur Prix Achat', details.meilleur_prix_achat || 'N/A')}
                    ${createDetailRow('Meilleur Prix Vente', details.meilleur_prix_vente || 'N/A')}
                    ${createDetailRow('Nb. Transactions', (details.nombre_transactions || 0).toLocaleString())}
                </div>
            </div>
            
            <!-- Description & Chart Column -->
            <div>
                <h3 class="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Description</h3>
                <p class="text-gray-600 mb-6">${details.description.split('. Source:')[0] || 'No detailed description available.'}</p>

                <h3 class="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Performance Chart (Last 5 Days)</h3>
                <div style="position: relative; height: 300px; width: 100%; max-width: 100%;">
                    <canvas id="stockChart"></canvas>
                </div>
            </div>
        </div>
    `;
    
    // Initialize chart
    setTimeout(() => {
        if (typeof Chart !== 'undefined' && document.getElementById('stockChart')) {
            const ctx = document.getElementById('stockChart').getContext('2d');
            const isPositive = details.change >= 0;

            // Create gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            if (isPositive) {
                gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
                gradient.addColorStop(1, 'rgba(16, 185, 129, 0.01)');
            } else {
                gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
                gradient.addColorStop(1, 'rgba(239, 68, 68, 0.01)');
            }

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        label: 'Price (MAD)',
                        data: chartData.prices,
                        borderColor: isPositive ? '#10b981' : '#ef4444',
                        backgroundColor: gradient,
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: isPositive ? '#10b981' : '#ef4444',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointHoverBackgroundColor: isPositive ? '#10b981' : '#ef4444',
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
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
                            titleFont: {
                                size: 14,
                                weight: 'bold',
                                family: 'system-ui'
                            },
                            bodyFont: {
                                size: 13,
                                family: 'system-ui'
                            },
                            callbacks: {
                                title: function(context) {
                                    return context[0].label;
                                },
                                label: function(context) {
                                    return 'Price: ' + stockManager.formatCurrency(context.parsed.y);
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    size: 12,
                                    family: 'system-ui'
                                },
                                color: '#6b7280'
                            },
                            border: {
                                display: true,
                                color: '#e5e7eb'
                            }
                        },
                        y: {
                            beginAtZero: false,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                font: {
                                    size: 12,
                                    family: 'system-ui'
                                },
                                color: '#6b7280',
                                padding: 8,
                                callback: function(value) {
                                    return stockManager.formatCurrency(value);
                                }
                            },
                            border: {
                                display: true,
                                color: '#e5e7eb'
                            }
                        }
                    }
                }
            });
        } else {
             console.error("Chart.js not loaded or canvas element missing.");
        }
    }, 100);
}


async function loadStocks(showLoading = true) {
    const grid = document.getElementById('stocksGrid');
    if (!grid) {
        return;
    }
    
    if (showLoading) {
        grid.innerHTML = `<div class="col-span-full text-center py-12">
            <div class="loading-spinner mx-auto mb-4"></div>
            <p class="text-gray-600">Chargement des données boursières en cours...</p>
        </div>`;
    }
    
    try {
        const response = await fetch('/api/stocks'); 
        if (!response.ok) throw new Error('Failed to fetch data from API endpoint.');
        
        const data = await response.json();
        
        allStocks = data.stocks;
        stockManager.stocks = data.stocks;
        
        if (typeof displayStatus === 'function') {
            displayStatus(data.source, data.timestamp);
        }
        
        if (showLoading && typeof utils !== 'undefined' && utils.showNotification) {
             const message = data.source === 'SCRAPE' 
                ? `Market data successfully loaded from BVC scrape at ${data.timestamp}`
                : `Simulated data loaded at ${data.timestamp}`;
            utils.showNotification(message, 'success');
        }
        
        if (data.sectors && typeof populateSectorFilter === 'function') {
            populateSectorFilter(data.sectors); 
        }

        if (typeof updateView === 'function') {
            updateView();
        } else if (typeof renderStocks === 'function') {
            renderStocks(allStocks);
        }

    } catch (error) {
        console.error('Error loading stocks:', error);
        
        // Fallback pour afficher le message d'erreur et une grille vide/spinner
        utils.showNotification('Could not load market data from API.', 'error');
        
        if (typeof displayStatus === 'function') {
            displayStatus('MOCK', new Date().toLocaleTimeString());
        }
        
        grid.innerHTML = `<div class="col-span-full text-center py-12">
            <p class="text-red-500 font-semibold mb-2">Error: Failed to load data.</p>
            <p class="text-gray-600">Ensure the Flask server is running and the CSV file exists.</p>
        </div>`;
    }
}


// --- START OF FILE script.js (CORRECTED) ---

// ... (fonctions utils et stockManager) ...

// --- Event Listeners and Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    // S'assurer que le script s'exécute uniquement sur la page stocks.html
    if (document.getElementById('stocksGrid')) {
        loadStocks(true);
        // Démarrer le rafraîchissement automatique de 60s
        if (typeof startAutoRefresh === 'function') {
            startAutoRefresh();
        }
    }
    
    const searchInput = document.getElementById('searchStocks');
    const sectorFilter = document.getElementById('sectorFilter');
    const sortBy = document.getElementById('sortBy');
    const closeModal = document.getElementById('closeModal');

    // Autocomplete/Search listeners
    if (searchInput) {
        const debouncedUpdateView = utils.debounce(updateView, 300);
        
        searchInput.addEventListener('input', function(event) {
            const searchTerm = searchInput.value.trim().toLowerCase();
            renderSearchResults(searchTerm); // Trigger dropdown update
            debouncedUpdateView(); // Trigger main grid update
        });

        // Hide search results on blur (with a small delay)
        searchInput.addEventListener('blur', () => {
            setTimeout(hideSearchResults, 200);
        });
        
        // Show search results on focus if there's text
        searchInput.addEventListener('focus', () => {
            const searchTerm = searchInput.value.trim().toLowerCase();
            if (searchTerm) {
                renderSearchResults(searchTerm);
            }
        });
    }

    // Filter/Sort listeners
    if (sectorFilter) {
        sectorFilter.addEventListener('change', updateView);
    }
    
    if (sortBy) {
        sortBy.addEventListener('change', updateView);
    }
    
    // Modal close listener
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            const stockModal = document.getElementById('stockModal');
            if (stockModal) {
                stockModal.classList.add('hidden');
            }
        });
    }
});
// --- END OF FILE script.js (CORRECTED) ---