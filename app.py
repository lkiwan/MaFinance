from flask import Flask, jsonify, send_from_directory, abort, request, session
import pandas as pd
import numpy as np
import json
import os
import re
import secrets
from datetime import datetime, timedelta
from bvc_hourly_scraper import fetch_bvc_prices
from init_db import get_db_connection, hash_password, init_database
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
app.secret_key = os.getenv('SECRET_KEY', secrets.token_hex(32))  # Use environment variable or generate random key

# Initialize database on startup
init_database()

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

# Configuration for auto-refresh
AUTO_SCRAPE_ENABLED = False  # Set to False to disable automatic scraping
DATA_REFRESH_MINUTES = 1    # Scrape new data if CSV is older than this (changed from 15 to 1 minute)

def should_refresh_data():
    """Check if we need to fetch fresh data from BVC"""
    if not AUTO_SCRAPE_ENABLED:
        return False

    try:
        csv_path = get_csv_file()
        file_age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(csv_path))
        return file_age > timedelta(minutes=DATA_REFRESH_MINUTES)
    except FileNotFoundError:
        # No CSV exists, need to scrape
        return True
    except Exception as e:
        logger.error(f"Error checking file age: {e}")
        return False

def scrape_and_save_data():
    """Fetch fresh data from BVC and save to CSV and SQLite database"""
    try:
        logger.info("[AUTO-REFRESH] Fetching fresh data from Casablanca Stock Exchange...")
        df = fetch_bvc_prices()

        if not df.empty:
            output_file = "bvc_prices_latest_new.csv"
            df.to_csv(output_file, index=False)
            logger.info(f"[SUCCESS] Fresh data saved to {output_file}")

            # Also save to SQLite database
            save_stocks_to_database(df)

            return True
        else:
            logger.error("[ERROR] Scraper returned empty data")
            return False
    except Exception as e:
        logger.error(f"[ERROR] Error during scraping: {e}")
        return False

def save_stocks_to_database(df):
    """Save stock data to SQLite database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        for _, row in df.iterrows():
            instrument_name = row['Instrument'].strip()
            symbol = row['Ticker'].strip() if 'Ticker' in df.columns and row['Ticker'].strip() else instrument_name
            company_name = row['Company'].strip() if 'Company' in df.columns and row['Company'].strip() else instrument_name
            sector = MOCK_SECTOR_MAPPING.get(instrument_name, 'Other')

            cursor.execute('''
                INSERT OR REPLACE INTO stocks (
                    symbol, name, sector, price, change, volume, market_cap,
                    statut, cours_reference, ouverture, plus_haut, plus_bas,
                    prix_achat, prix_vente, quantite_achat, quantite_vente,
                    nombre_transactions, last_updated
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ''', (
                symbol,
                company_name,
                sector,
                clean_numeric(row.get('Dernier_Cours', 0)),
                clean_numeric(row.get('Variation_Pourcentage', 0)),
                int(clean_numeric(row.get('Quantite_Echangee', 0))) if pd.notna(clean_numeric(row.get('Quantite_Echangee', 0))) else 0,
                clean_numeric(row.get('Capitalisation', 0)),
                row.get('Statut', '-'),
                clean_numeric(row.get('Cours_Reference', 0)),
                clean_numeric(row.get('Ouverture', 0)),
                clean_numeric(row.get('Plus_Haut_Jour', 0)),
                clean_numeric(row.get('Plus_Bas_Jour', 0)),
                clean_numeric(row.get('Meilleur_Prix_Achat', 0)),
                clean_numeric(row.get('Meilleur_Prix_Vente', 0)),
                int(clean_numeric(row.get('Quantite_Meilleur_Prix_Achat', 0))) if pd.notna(clean_numeric(row.get('Quantite_Meilleur_Prix_Achat', 0))) else 0,
                int(clean_numeric(row.get('Quantite_Meilleur_Prix_Vente', 0))) if pd.notna(clean_numeric(row.get('Quantite_Meilleur_Prix_Vente', 0))) else 0,
                int(clean_numeric(row.get('Nombre_Transactions', 0))) if pd.notna(clean_numeric(row.get('Nombre_Transactions', 0))) else 0
            ))

        conn.commit()
        conn.close()
        logger.info("[SUCCESS] Stock data saved to database")
    except Exception as e:
        logger.error(f"[ERROR] Error saving to database: {e}")

# Fonction de chargement et de nettoyage des données
def load_and_process_stocks():
    # Cache pour éviter de recharger le fichier à chaque requête
    CACHE_DURATION_SECONDS = 60
    if hasattr(app, 'stock_data_cache') and (datetime.now() - app.stock_data_cache['load_time']).total_seconds() < CACHE_DURATION_SECONDS:
         return app.stock_data_cache['stocks'], app.stock_data_cache['timestamp'], app.stock_data_cache['source']

    # Check if we need to scrape fresh data
    if should_refresh_data():
        scrape_and_save_data()

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


# ===== AUTHENTICATION ROUTES =====

@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()

    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"status": "error", "message": "Email and password are required"}), 400

    email = data['email'].strip().lower()
    password = data['password']
    full_name = data.get('full_name', '').strip()

    # Basic email validation
    if '@' not in email or len(email) < 5:
        return jsonify({"status": "error", "message": "Invalid email format"}), 400

    # Password strength check
    if len(password) < 6:
        return jsonify({"status": "error", "message": "Password must be at least 6 characters"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if user already exists
        cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"status": "error", "message": "Email already registered"}), 400

        # Insert new user
        cursor.execute('''
            INSERT INTO users (email, password_hash, full_name)
            VALUES (?, ?, ?)
        ''', (email, hash_password(password), full_name))

        conn.commit()
        user_id = cursor.lastrowid
        conn.close()

        logger.info(f"New user registered: {email}")
        return jsonify({
            "status": "success",
            "message": "Registration successful",
            "user": {"id": user_id, "email": email, "full_name": full_name}
        })

    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({"status": "error", "message": "Registration failed"}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """User login"""
    data = request.get_json()

    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"status": "error", "message": "Email and password are required"}), 400

    email = data['email'].strip().lower()
    password = data['password']

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT id, email, password_hash, full_name
            FROM users
            WHERE email = ?
        ''', (email,))

        user = cursor.fetchone()

        if not user or user['password_hash'] != hash_password(password):
            conn.close()
            return jsonify({"status": "error", "message": "Invalid email or password"}), 401

        # Update last login
        cursor.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', (user['id'],))
        conn.commit()
        conn.close()

        # Set session
        session['user_id'] = user['id']
        session['email'] = user['email']

        logger.info(f"User logged in: {email}")
        return jsonify({
            "status": "success",
            "message": "Login successful",
            "user": {
                "id": user['id'],
                "email": user['email'],
                "full_name": user['full_name']
            }
        })

    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({"status": "error", "message": "Login failed"}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    """User logout"""
    session.clear()
    return jsonify({"status": "success", "message": "Logged out successfully"})

@app.route('/api/me', methods=['GET'])
def get_current_user():
    """Get current logged-in user info"""
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Not authenticated"}), 401

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, email, full_name, created_at, last_login
            FROM users
            WHERE id = ?
        ''', (session['user_id'],))

        user = cursor.fetchone()
        conn.close()

        if not user:
            session.clear()
            return jsonify({"status": "error", "message": "User not found"}), 404

        return jsonify({
            "status": "success",
            "user": {
                "id": user['id'],
                "email": user['email'],
                "full_name": user['full_name'],
                "created_at": user['created_at'],
                "last_login": user['last_login']
            }
        })

    except Exception as e:
        logger.error(f"Get user error: {e}")
        return jsonify({"status": "error", "message": "Failed to fetch user"}), 500

# ===== WATCHLIST ROUTES =====

@app.route('/api/watchlist', methods=['GET'])
def get_watchlist():
    """Get user's watchlist"""
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Not authenticated"}), 401

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT w.id, w.symbol, w.name, w.added_date, w.added_price,
                   s.price as current_price, s.change
            FROM watchlists w
            LEFT JOIN stocks s ON w.symbol = s.symbol
            WHERE w.user_id = ?
            ORDER BY w.added_date DESC
        ''', (session['user_id'],))

        watchlist = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return jsonify({"status": "success", "watchlist": watchlist})

    except Exception as e:
        logger.error(f"Get watchlist error: {e}")
        return jsonify({"status": "error", "message": "Failed to fetch watchlist"}), 500

@app.route('/api/watchlist', methods=['POST'])
def add_to_watchlist():
    """Add stock to watchlist"""
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Not authenticated"}), 401

    data = request.get_json()
    if not data or not data.get('symbol'):
        return jsonify({"status": "error", "message": "Symbol is required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if already in watchlist
        cursor.execute('''
            SELECT id FROM watchlists
            WHERE user_id = ? AND symbol = ?
        ''', (session['user_id'], data['symbol']))

        if cursor.fetchone():
            conn.close()
            return jsonify({"status": "error", "message": "Stock already in watchlist"}), 400

        # Add to watchlist
        cursor.execute('''
            INSERT INTO watchlists (user_id, symbol, name, added_price)
            VALUES (?, ?, ?, ?)
        ''', (session['user_id'], data['symbol'], data.get('name', ''), data.get('price', 0)))

        conn.commit()
        conn.close()

        return jsonify({"status": "success", "message": "Added to watchlist"})

    except Exception as e:
        logger.error(f"Add to watchlist error: {e}")
        return jsonify({"status": "error", "message": "Failed to add to watchlist"}), 500

@app.route('/api/watchlist/<symbol>', methods=['DELETE'])
def remove_from_watchlist(symbol):
    """Remove stock from watchlist"""
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Not authenticated"}), 401

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            DELETE FROM watchlists
            WHERE user_id = ? AND symbol = ?
        ''', (session['user_id'], symbol))

        conn.commit()
        conn.close()

        return jsonify({"status": "success", "message": "Removed from watchlist"})

    except Exception as e:
        logger.error(f"Remove from watchlist error: {e}")
        return jsonify({"status": "error", "message": "Failed to remove from watchlist"}), 500

# ===== PORTFOLIO ROUTES =====

@app.route('/api/portfolio', methods=['GET'])
def get_portfolio():
    """Get user's portfolio"""
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Not authenticated"}), 401

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT p.id, p.symbol, p.name, p.shares, p.buy_price, p.buy_date, p.total_investment,
                   s.price as current_price
            FROM portfolios p
            LEFT JOIN stocks s ON p.symbol = s.symbol
            WHERE p.user_id = ?
            ORDER BY p.created_at DESC
        ''', (session['user_id'],))

        portfolio = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return jsonify({"status": "success", "portfolio": portfolio})

    except Exception as e:
        logger.error(f"Get portfolio error: {e}")
        return jsonify({"status": "error", "message": "Failed to fetch portfolio"}), 500

@app.route('/api/portfolio', methods=['POST'])
def add_to_portfolio():
    """Add holding to portfolio"""
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Not authenticated"}), 401

    data = request.get_json()
    required_fields = ['symbol', 'name', 'shares', 'buy_price']
    if not data or not all(data.get(field) for field in required_fields):
        return jsonify({"status": "error", "message": "Missing required fields"}), 400

    try:
        shares = float(data['shares'])
        buy_price = float(data['buy_price'])
        total_investment = shares * buy_price

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO portfolios (user_id, symbol, name, shares, buy_price, buy_date, total_investment)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (session['user_id'], data['symbol'], data['name'], shares, buy_price,
              data.get('buy_date', datetime.now().isoformat()), total_investment))

        conn.commit()
        conn.close()

        return jsonify({"status": "success", "message": "Added to portfolio"})

    except Exception as e:
        logger.error(f"Add to portfolio error: {e}")
        return jsonify({"status": "error", "message": "Failed to add to portfolio"}), 500

@app.route('/api/portfolio/<int:holding_id>', methods=['DELETE'])
def remove_from_portfolio(holding_id):
    """Remove holding from portfolio"""
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Not authenticated"}), 401

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            DELETE FROM portfolios
            WHERE id = ? AND user_id = ?
        ''', (holding_id, session['user_id']))

        conn.commit()
        conn.close()

        return jsonify({"status": "success", "message": "Removed from portfolio"})

    except Exception as e:
        logger.error(f"Remove from portfolio error: {e}")
        return jsonify({"status": "error", "message": "Failed to remove from portfolio"}), 500

# ===== PRICE ALERTS ROUTES =====

@app.route('/api/alerts', methods=['GET'])
def get_price_alerts():
    """Get user's price alerts"""
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Not authenticated"}), 401

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT a.id, a.symbol, a.name, a.target_price, a.condition, a.triggered,
                   a.created_date, a.triggered_date,
                   s.price as current_price
            FROM price_alerts a
            LEFT JOIN stocks s ON a.symbol = s.symbol
            WHERE a.user_id = ?
            ORDER BY a.created_date DESC
        ''', (session['user_id'],))

        alerts = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return jsonify({"status": "success", "alerts": alerts})

    except Exception as e:
        logger.error(f"Get alerts error: {e}")
        return jsonify({"status": "error", "message": "Failed to fetch alerts"}), 500

@app.route('/api/alerts', methods=['POST'])
def add_price_alert():
    """Add a price alert"""
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Not authenticated"}), 401

    data = request.get_json()
    required_fields = ['symbol', 'name', 'target_price', 'condition']
    if not data or not all(data.get(field) for field in required_fields):
        return jsonify({"status": "error", "message": "Missing required fields"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO price_alerts (user_id, symbol, name, target_price, condition)
            VALUES (?, ?, ?, ?, ?)
        ''', (session['user_id'], data['symbol'], data['name'],
              float(data['target_price']), data['condition']))

        conn.commit()
        conn.close()

        return jsonify({"status": "success", "message": "Price alert created"})

    except Exception as e:
        logger.error(f"Add alert error: {e}")
        return jsonify({"status": "error", "message": "Failed to create alert"}), 500

@app.route('/api/alerts/<int:alert_id>', methods=['DELETE'])
def remove_price_alert(alert_id):
    """Remove a price alert"""
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Not authenticated"}), 401

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            DELETE FROM price_alerts
            WHERE id = ? AND user_id = ?
        ''', (alert_id, session['user_id']))

        conn.commit()
        conn.close()

        return jsonify({"status": "success", "message": "Alert removed"})

    except Exception as e:
        logger.error(f"Remove alert error: {e}")
        return jsonify({"status": "error", "message": "Failed to remove alert"}), 500

@app.route('/api/refresh', methods=['POST'])
def refresh_data():
    """Endpoint pour forcer le rafraîchissement des données depuis BVC"""
    logger.info("Manual refresh requested")
    success = scrape_and_save_data()

    if success:
        # Clear cache to force reload
        if hasattr(app, 'stock_data_cache'):
            delattr(app, 'stock_data_cache')

        return jsonify({
            "status": "success",
            "message": "Data refreshed successfully from Casablanca Stock Exchange",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
    else:
        return jsonify({
            "status": "error",
            "message": "Failed to refresh data. Check server logs for details."
        }), 500

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
