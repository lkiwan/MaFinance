import os
from datetime import datetime
import hashlib

# Check if running in production (Render)
DATABASE_URL = os.getenv('DATABASE_URL')
IS_PRODUCTION = DATABASE_URL is not None

if IS_PRODUCTION:
    # PostgreSQL for production
    import psycopg2
    from psycopg2.extras import RealDictCursor

    def get_db_connection():
        """Create a PostgreSQL database connection"""
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return conn
else:
    # SQLite for local development
    import sqlite3
    DATABASE_PATH = 'mafinance.db'

    def get_db_connection():
        """Create a SQLite database connection"""
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        return conn

def hash_password(password):
    """Hash a password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def init_database():
    """Initialize the database with all required tables"""
    conn = get_db_connection()
    cursor = conn.cursor()

    if IS_PRODUCTION:
        # PostgreSQL syntax
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS stocks (
                id SERIAL PRIMARY KEY,
                symbol TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                sector TEXT,
                price REAL,
                change REAL,
                volume INTEGER,
                market_cap REAL,
                statut TEXT,
                cours_reference REAL,
                ouverture REAL,
                plus_haut REAL,
                plus_bas REAL,
                prix_achat REAL,
                prix_vente REAL,
                quantite_achat INTEGER,
                quantite_vente INTEGER,
                nombre_transactions INTEGER,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS watchlists (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                symbol TEXT NOT NULL,
                name TEXT,
                added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                added_price REAL,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                UNIQUE(user_id, symbol)
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS portfolios (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                symbol TEXT NOT NULL,
                name TEXT,
                shares REAL NOT NULL,
                buy_price REAL NOT NULL,
                buy_date TIMESTAMP,
                total_investment REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS price_alerts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                symbol TEXT NOT NULL,
                name TEXT,
                target_price REAL NOT NULL,
                condition TEXT NOT NULL,
                triggered BOOLEAN DEFAULT FALSE,
                created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                triggered_date TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                session_token TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
    else:
        # SQLite syntax
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS stocks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                sector TEXT,
                price REAL,
                change REAL,
                volume INTEGER,
                market_cap REAL,
                statut TEXT,
                cours_reference REAL,
                ouverture REAL,
                plus_haut REAL,
                plus_bas REAL,
                prix_achat REAL,
                prix_vente REAL,
                quantite_achat INTEGER,
                quantite_vente INTEGER,
                nombre_transactions INTEGER,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS watchlists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                symbol TEXT NOT NULL,
                name TEXT,
                added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                added_price REAL,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                UNIQUE(user_id, symbol)
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS portfolios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                symbol TEXT NOT NULL,
                name TEXT,
                shares REAL NOT NULL,
                buy_price REAL NOT NULL,
                buy_date TIMESTAMP,
                total_investment REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS price_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                symbol TEXT NOT NULL,
                name TEXT,
                target_price REAL NOT NULL,
                condition TEXT NOT NULL,
                triggered BOOLEAN DEFAULT 0,
                created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                triggered_date TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_token TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')

    # Create indexes for better performance
    try:
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON stocks(symbol)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_watchlists_user ON watchlists(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_portfolios_user ON portfolios(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_alerts_user ON price_alerts(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token)')
    except Exception as e:
        print(f"[WARNING] Could not create some indexes: {e}")

    conn.commit()
    conn.close()

    db_type = "PostgreSQL" if IS_PRODUCTION else "SQLite"
    print(f"[SUCCESS] Database ({db_type}) initialized successfully!")
    if not IS_PRODUCTION:
        print(f"[INFO] Database file created at: {os.path.abspath(DATABASE_PATH)}")

def create_demo_user():
    """Create a demo user for testing"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute('''
            INSERT INTO users (email, password_hash, full_name)
            VALUES (%s, %s, %s)
        ''' if IS_PRODUCTION else '''
            INSERT INTO users (email, password_hash, full_name)
            VALUES (?, ?, ?)
        ''', ('demo@mafinance.com', hash_password('demo123'), 'Demo User'))
        conn.commit()
        print("[SUCCESS] Demo user created: demo@mafinance.com / demo123")
    except Exception as e:
        print(f"[INFO] Demo user already exists or error: {e}")

    conn.close()

if __name__ == '__main__':
    print("[INFO] Initializing MaFinance Pro Database...")
    init_database()
    create_demo_user()
    print("[INFO] Database setup complete!")
