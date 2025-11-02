

let detailsRefreshInterval;

// Fonction de rafraîchissement spécifique pour la page de détails
function startDetailsAutoRefresh(symbol) {
    // Arrêter tout intervalle précédent
    if (detailsRefreshInterval) clearInterval(detailsRefreshInterval);
    
    // Rafraîchir toutes les 15 secondes
    detailsRefreshInterval = setInterval(() => {
        loadStockDetails(symbol);
        console.log(`Refreshing details for ${symbol}...`);
    }, 15000); // 15 secondes
}

// Fonction pour arrêter le rafraîchissement (par exemple si l'utilisateur quitte la page)
function stopDetailsAutoRefresh() {
    if (detailsRefreshInterval) clearInterval(detailsRefreshInterval);
}

// Assurez-vous que les fonctions d'utilité et de formatage sont disponibles
// Le reste de la logique pour charger les détails restera dans la balise <script> de stock-details.html

// Exportez la fonction de rafraîchissement pour qu'elle puisse être appelée depuis stock-details.html
window.startDetailsAutoRefresh = startDetailsAutoRefresh;
window.stopDetailsAutoRefresh = stopDetailsAutoRefresh;
