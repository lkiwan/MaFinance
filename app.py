from flask import Flask, jsonify, send_from_directory, abort
import pandas as pd
import numpy as np
import json
import os
import re
from datetime import datetime
# from logger import Logger # Assuming logger is defined elsewhere or commented out if not used

# Initialiser un logger basique si la classe Logger n'est pas définie
class BasicLogger:
    def info(self, msg):
        print(f"[INFO] {msg}")
    def error(self, msg):
        print(f"[ERROR] {msg}")
    def debug(self, msg):
        pass # Ignorer les logs de debug pour la simplicité

try:
    from logger import Logger
    logger = Logger()
except ImportError:
    logger = BasicLogger()

logger.info("Application démarrée")

app = Flask(__name__, static_folder='.') # Serve static files from the root directory

# Security headers
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    return response

# Support reading from the freshest available CSV among candidates
import os
CSV_CANDIDATES = ['bvc_prices_latest.csv', 'bvc_prices_latest_new.csv']

def get_csv_file():
    existing = [f for f in CSV_CANDIDATES if os.path.exists(f)]
    if not existing:
        raise FileNotFoundError("No CSV file found among candidates.")
    # pick the most recently modified
    return max(existing, key=lambda f: os.path.getmtime(f))

MOCK_SECTOR_MAPPING = {
    "TAQA MOROCCO": "Energy", "SODEP-Marsa Maroc": "Transportation", "ARADEI CAPITAL": "Real Estate", 
    "BALIMA": "Holding", "IMMORENTE INVEST": "Real Estate", "CARTIER SAADA": "Consumption", 
    "COSUMAR": "Food", "DARI COUSPATE": "Food", "LESIEUR CRISTAL": "Food", 
    "MUTANDIS SCA": "Consumption", "UNIMER": "Food", "AFMA": "Insurance", 
    "AGMA": "Insurance", "ATLANTASANAD": "Insurance", "SANLAM MAROC": "Insurance", 
    "WAFA ASSURANCE": "Insurance", "AFRIC INDUSTRIES SA": "Industry", "ALUMINIUM DU MAROC": "Industry", 
    "CIMENTS DU MAROC": "Construction", "COLORADO": "Construction", "JET CONTRACTORS": "Construction", 
    "LAFARGEHOLCIM MAROC": "Construction", "SONASID": "Industry", "TGCC S.A": "Construction", 
    "ATTIJARIWAFA BANK": "Banking", "BANK OF AFRICA": "Banking", "BCP": "Banking", 
    "BMCI": "Banking", "CDM": "Banking", "CFG BANK": "Banking", "CIH": "Banking", 
    "OULMES": "Beverage", "SOCIETE DES BOISSONS DU MAROC": "Beverage", "MAGHREB OXYGENE": "Chemicals", 
    "SNEP": "Chemicals", "AUTO HALL": "Automotive", "AUTO NEJMA": "Automotive", 
    "ENNAKL": "Automotive", "FENIE BROSSETTE": "Automotive", "LABEL VIE": "Retail", 
    "REALISATIONS MECANIQUES": "Industry", "STOKVIS NORD AFRIQUE": "Automotive", 
    "DELATTRE LEVIVIER MAROC": "Industry", "STROC INDUSTRIE": "Industry", "ALLIANCES": "Real Estate", 
    "DOUJA PROM ADDOHA": "Real Estate", "RESIDENCES DAR SAADA": "Real Estate", "RISMA": "Tourism", 
    "DISTY TECHNOLOGIES": "IT", "DISWAY": "IT", "HPS": "IT", "IB MAROC.COM": "IT", 
    "INVOLYS": "IT", "M2M Group": "IT", "MICRODATA": "IT", "S.M MONETIQUE": "IT", 
    "MANAGEM": "Mining", "MINIERE TOUISSIT": "Mining", "REBAB COMPANY": "Mining", 
    "SMI": "Mining", "AFRIQUIA GAZ": "Energy", "SAMIR": "Energy", 
    "TOTALENERGIES MARKETING MAROC": "Energy", "PROMOPHARM S.A.": "Health", "SOTHEMA": "Health", 
    "MED PAPER": "Paper", "DIAC SALAF": "Finance", "EQDOM": "Finance", "MAGHREBAIL": "Finance", 
    "MAROC LEASING": "Finance", "SALAFIN": "Finance", "DELTA HOLDING": "Holding", 
    "ZELLIDJA S.A": "Holding", "ITISSALAT AL-MAGHRIB": "Telecom", "CTM": "Transportation", 
    "AKDITAL": "Health", "VICENNE": "IT", "CMGP GROUP": "Agriculture",
}

# Fonction utilitaire pour nettoyer et convertir les valeurs numériques
def clean_numeric(value):
    if isinstance(value, str):
        # Supprimer les espaces et remplacer la virgule par un point
        value = value.replace(' ', '').replace(',', '.')
        # Remplacer les tirets par NaN (pour la conversion)
        if value in ('-', 'N/A', '') or value.isspace():
            return np.nan
        # Supprimer le symbole de pourcentage
        if '%' in value:
            try:
                return float(value.replace('%', ''))
            except ValueError:
                return np.nan
        try:
            return float(value)
        except ValueError:
            return np.nan
    elif value is None:
        return np.nan
    return float(value) if pd.notna(value) else np.nan

# Fonction de chargement et de nettoyage des données
def load_and_process_stocks():
    # Cache pour éviter de recharger le fichier à chaque requête
    CACHE_DURATION_SECONDS = 5
    if hasattr(app, 'stock_data_cache') and (datetime.now() - app.stock_data_cache['load_time']).total_seconds() < 60:
         return app.stock_data_cache['stocks'], app.stock_data_cache['timestamp'], app.stock_data_cache['source']

    try:
        csv_path = get_csv_file()
        logger.info(f"Tentative de chargement du fichier CSV: {csv_path}")
        # 1. Lecture du CSV
        # Utiliser l'argument sep=',' et l'engine python pour une meilleure robustesse
        df = pd.read_csv(csv_path, keep_default_na=False, sep=',', encoding='utf-8')
        
        # Le timestamp est le même pour toutes les lignes
        timestamp = df['Timestamp'].iloc[0] if not df.empty and 'Timestamp' in df.columns else datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        logger.info(f"Fichier CSV chargé avec succès. Timestamp: {timestamp}, Nombre de lignes: {len(df)}")

        # 2. Nettoyage des données
        numeric_cols = [
            'Cours_Reference', 'Ouverture', 'Dernier_Cours', 'Quantite_Echangee', 
            'Volume', 'Variation_Pourcentage', 'Plus_Haut_Jour', 'Plus_Bas_Jour',
            'Meilleur_Prix_Achat', 'Meilleur_Prix_Vente', 'Quantite_Meilleur_Prix_Achat', 
            'Quantite_Meilleur_Prix_Vente', 'Capitalisation', 'Nombre_Transactions',
            'Last Price'
        ]
        
        for col in numeric_cols:
            if col in df.columns:
                df[col] = df[col].apply(clean_numeric)

        # 3. Préparation du format pour le frontend
        stocks = []
        logger.info("Début de la préparation des données pour le frontend")
        
        # Mapping for better symbol lookup in case 'Instrument' is too long
        symbol_map = {row['Instrument'].strip(): row['Ticker'].strip() if 'Ticker' in df.columns and row['Ticker'].strip() else row['Instrument'].strip() for _, row in df.iterrows()}
        
        for _, row in df.iterrows():
            # Utiliser le Ticker s'il existe, sinon l'Instrument pour le 'symbol'
            instrument_name = row['Instrument'].strip()
            symbol = row['Ticker'].strip() if 'Ticker' in df.columns and row['Ticker'].strip() else instrument_name
            company_name = row['Company'].strip() if 'Company' in df.columns and row['Company'].strip() else instrument_name
            
            # Utiliser l'Instrument pour la recherche du secteur
            sector = MOCK_SECTOR_MAPPING.get(instrument_name, 'Other')
            
            # Formater la capitalisation (en utilisant la valeur nettoyée)
            market_cap_mad = row.get('Capitalisation')
            market_cap_str = 'N/A'
            if pd.notna(market_cap_mad) and market_cap_mad > 0:
                if market_cap_mad >= 1e9:
                    market_cap_str = f"{market_cap_mad / 1e9:.2f} B MAD"
                elif market_cap_mad >= 1e6:
                    market_cap_str = f"{market_cap_mad / 1e6:.2f} M MAD"
                else:
                    market_cap_str = f"{market_cap_mad:.2f} MAD"
            
            # Construire l'objet stock pour le frontend
            stock_data = {
                "symbol": symbol,
                "name": company_name, 
                "price": row['Dernier_Cours'] if pd.notna(row['Dernier_Cours']) else 0.0,
                "change": row['Variation_Pourcentage'] if pd.notna(row['Variation_Pourcentage']) else 0.0,
                "volume": int(row['Quantite_Echangee']) if pd.notna(row['Quantite_Echangee']) else 0,
                "sector": sector,
                "marketCap": market_cap_str,
                
                # Tous les détails pour le modal / page de détails
                "details": {
                    "statut": row['Statut'] if 'Statut' in row and row['Statut'] else '-',
                    "cours_reference": f"{row['Cours_Reference']:.2f}" if pd.notna(row['Cours_Reference']) else '-',
                    "ouverture": f"{row['Ouverture']:.2f}" if pd.notna(row['Ouverture']) else '-',
                    "dernier_cours": f"{row['Dernier_Cours']:.2f}" if pd.notna(row['Dernier_Cours']) else '-',
                    "quantite_echangee": str(int(row['Quantite_Echangee'])) if pd.notna(row['Quantite_Echangee']) else '0',
                    "volume_mad": f"{row['Volume']:.2f}" if pd.notna(row['Volume']) else '-',
                    "variation_pourcentage": f"{row['Variation_Pourcentage']:.2f}%" if pd.notna(row['Variation_Pourcentage']) else '0.00%',
                    "plus_haut_jour": f"{row['Plus_Haut_Jour']:.2f}" if pd.notna(row['Plus_Haut_Jour']) else '-',
                    "plus_bas_jour": f"{row['Plus_Bas_Jour']:.2f}" if pd.notna(row['Plus_Bas_Jour']) else '-',
                    "meilleur_prix_achat": f"{row['Meilleur_Prix_Achat']:.2f}" if pd.notna(row['Meilleur_Prix_Achat']) else '-',
                    "meilleur_prix_vente": f"{row['Meilleur_Prix_Vente']:.2f}" if pd.notna(row['Meilleur_Prix_Vente']) else '-',
                    "quantite_meilleur_prix_achat": str(int(row['Quantite_Meilleur_Prix_Achat'])) if pd.notna(row['Quantite_Meilleur_Prix_Achat']) else '0',
                    "quantite_meilleur_prix_vente": str(int(row['Quantite_Meilleur_Prix_Vente'])) if pd.notna(row['Quantite_Meilleur_Prix_Vente']) else '0',
                    "capitalisation": market_cap_str,
                    "nombre_transactions": str(int(row['Nombre_Transactions'])) if pd.notna(row['Nombre_Transactions']) else '0',
                    "price": row['Dernier_Cours'] if pd.notna(row['Dernier_Cours']) else 0.0,
                    "change": row['Variation_Pourcentage'] if pd.notna(row['Variation_Pourcentage']) else 0.0,
                    "volume": int(row['Quantite_Echangee']) if pd.notna(row['Quantite_Echangee']) else 0,
                    "sector": sector,
                    "marketCap": market_cap_str,
                    "description": f"Description simulée pour {symbol}. Cette société opère dans le secteur {sector} et est un acteur clé du marché marocain. Source: Casablanca Bourse CSV Data.",
                    "symbol": symbol,
                    "name": company_name
                }
            }
            stocks.append(stock_data)
            
        # 4. Gestion du Cache
        app.stock_data_cache = {
            'stocks': stocks,
            'timestamp': timestamp,
            'source': "SCRAPE",
            'load_time': datetime.now()
        }
        
        return stocks, timestamp, "SCRAPE"

    except FileNotFoundError:
        logger.error(f"ERROR: Le fichier {CSV_FILE} est introuvable. Tentative de chargement de données de simulation.")
        # Simuler des données en cas d'échec
        mock_stocks = [
             { "symbol": "ATW", "name": "ATTIJARIWAFA BANK", "price": 780.0, "change": 1.52, "volume": 86343, "sector": "Banking", "marketCap": "167.81 B MAD", "details": { "statut": "T", "cours_reference": "768.30", "ouverture": "770.00", "dernier_cours": "780.00", "quantite_echangee": "86343", "volume_mad": "67334876.80", "variation_pourcentage": "1.52%", "plus_haut_jour": "784.90", "plus_bas_jour": "770.00", "meilleur_prix_achat": "772.00", "meilleur_prix_vente": "781.90", "quantite_meilleur_prix_achat": "450", "quantite_meilleur_prix_vente": "150", "capitalisation": "167.81 B MAD", "nombre_transactions": "148", "price": 780.0, "change": 1.52, "volume": 86343, "sector": "Banking", "marketCap": "167.81 B MAD", "description": "Description simulée pour ATW.", "symbol": "ATW", "name": "ATTIJARIWAFA BANK" } },
             { "symbol": "CSR", "name": "COSUMAR", "price": 212.0, "change": -0.47, "volume": 109576, "sector": "Food", "marketCap": "20.03 B MAD", "details": { "statut": "T", "cours_reference": "213.00", "ouverture": "211.05", "dernier_cours": "212.00", "quantite_echangee": "109576", "volume_mad": "23124352.60", "variation_pourcentage": "-0.47%", "plus_haut_jour": "213.95", "plus_bas_jour": "210.20", "meilleur_prix_achat": "210.20", "meilleur_prix_vente": "213.95", "quantite_meilleur_prix_achat": "90", "quantite_meilleur_prix_vente": "498", "capitalisation": "20.03 B MAD", "nombre_transactions": "87", "price": 212.0, "change": -0.47, "volume": 109576, "sector": "Food", "marketCap": "20.03 B MAD", "description": "Description simulée pour CSR.", "symbol": "CSR", "name": "COSUMAR" } },
             { "symbol": "IAM", "name": "ITISSALAT AL-MAGHRIB", "price": 121.0, "change": -0.08, "volume": 216625, "sector": "Telecom", "marketCap": "106.37 B MAD", "details": { "statut": "T", "cours_reference": "121.10", "ouverture": "121.00", "dernier_cours": "121.00", "quantite_echangee": "216625", "volume_mad": "26198500.70", "variation_pourcentage": "-0.08%", "plus_haut_jour": "121.45", "plus_bas_jour": "120.00", "meilleur_prix_achat": "120.00", "meilleur_prix_vente": "121.40", "quantite_meilleur_prix_achat": "20", "quantite_meilleur_prix_vente": "15", "capitalisation": "106.37 B MAD", "nombre_transactions": "135", "price": 121.0, "change": -0.08, "volume": 216625, "sector": "Telecom", "marketCap": "106.37 B MAD", "description": "Description simulée pour IAM.", "symbol": "IAM", "name": "ITISSALAT AL-MAGHRIB" } },
        ]
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        app.stock_data_cache = {
            'stocks': mock_stocks,
            'timestamp': timestamp,
            'source': "MOCK",
            'load_time': datetime.now()
        }
        return mock_stocks, timestamp, "MOCK"
        
    except Exception as e:
        logger.error(f"FATAL ERROR processing data: {e}")
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        app.stock_data_cache = {
            'stocks': [],
            'timestamp': timestamp,
            'source': "MOCK",
            'load_time': datetime.now()
        }
        return [], timestamp, "MOCK"


@app.route('/api/stocks', methods=['GET'])
def get_all_stocks():
    """Endpoint pour obtenir la liste complète des actions."""
    logger.info("Appel à l'API /api/stocks")
    stocks, timestamp, source = load_and_process_stocks()
    
    # Remplir les options de secteur
    sectors = sorted(list(set(s['sector'] for s in stocks)))
    
    # Le reste de la logique de /api/stocks pour insérer ATW/CSR est maintenant dans load_and_process_stocks 
    # ou sera simplifiée car les données CSV fournies les contiennent.
    # Pour s'assurer qu'ATW est en premier (utile pour la démo), nous pouvons trier si nécessaire.
    
    return jsonify({
        "status": "success",
        "timestamp": timestamp,
        "source": source,
        "stocks": stocks,
        "sectors": sectors
    })

@app.route('/api/stocks/<symbol>', methods=['GET'])
def get_stock_details(symbol):
    """Endpoint pour obtenir les détails d'une seule action (y compris les données de graphique simulées)."""
    # Input validation - only allow alphanumeric characters, spaces, and hyphens
    if not re.match(r'^[a-zA-Z0-9\s\-\.]+$', symbol):
        abort(400, description="Invalid symbol format")

    # Limit symbol length to prevent abuse
    if len(symbol) > 50:
        abort(400, description="Symbol too long")

    logger.info(f"Appel à l'API /api/stocks/{symbol}")
    stocks, _, _ = load_and_process_stocks()

    # Recherche par Symbol (Ticker) ou par Nom d'Instrument
    stock = next((s for s in stocks if s['symbol'].upper() == symbol.upper() or s['name'].upper() == symbol.upper()), None)

    if not stock:
        # Tenter une recherche approximative par nom d'instrument complet
        stock = next((s for s in stocks if symbol.upper() in s['name'].upper()), None)
        
    if not stock:
        abort(404, description=f"Stock with symbol {symbol} not found.")

    # Générer des données de graphique simulées pour la page de détails
    price = stock['price']
    change = stock['change'] / 100 # Convertir en décimal

    chart_labels = ["Day -4", "Day -3", "Day -2", "Day -1", "Today"]
    chart_prices = [
        price * (1 - (change * 4)), 
        price * (1 - (change * 2)), 
        price * (1 - (change * 0.5)), 
        price * (1 - (change * 0.1)), 
        price
    ]
    # Ajouter une petite variation aléatoire pour rendre le graphique plus réaliste
    chart_prices = [p + np.random.uniform(-0.005, 0.005) * price for p in chart_prices]
    
    # Arrondir les prix pour l'affichage
    chart_prices = [round(p, 2) for p in chart_prices]

    return jsonify({
        "status": "success",
        "details": stock['details'], # Retourne tous les détails
        "chart_data": {
            "labels": chart_labels,
            "prices": chart_prices
        }
    })

# Endpoint pour servir les fichiers statiques (inchangé)
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if path.endswith('.html') or path.endswith('.js') or path.endswith('.css') or path.endswith('.ico'):
        return send_from_directory('.', path)
    abort(404)

if __name__ == '__main__':
    print("Starting Flask app...")
    # Get debug mode from environment variable, default to False for production
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    port = int(os.getenv('FLASK_PORT', '5000'))

    print(f"Debug mode: {debug_mode}")
    print(f"Running on port: {port}")

    app.run(debug=debug_mode, port=port, host='0.0.0.0')
