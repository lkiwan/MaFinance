from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime

BVC_URL = "https://www.casablanca-bourse.com/fr/live-market/marche-actions-groupement"

def fetch_bvc_prices():
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    driver = webdriver.Chrome(options=options)
    driver.get(BVC_URL)

    try:
        # wait until table is present (max 15 seconds)
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "table tbody tr"))
        )
    except Exception:
        print("⚠️ Table not found — maybe page structure changed or needs more wait.")
    
    soup = BeautifulSoup(driver.page_source, "html.parser")
    driver.quit()

    rows = soup.select("table tbody tr")
    data = []

    for row in rows:
        cells = [c.text.strip() for c in row.find_all("td")]
        if len(cells) >= 15:  # Assurez-vous qu'il y a suffisamment de cellules
            stock_data = {
                "Instrument": cells[0],
                "Statut": cells[1],
                "Cours_Reference": cells[2],
                "Ouverture": cells[3],
                "Dernier_Cours": cells[4],
                "Quantite_Echangee": cells[5],
                "Volume": cells[6],
                "Variation_Pourcentage": cells[7],
                "Plus_Haut_Jour": cells[8],
                "Plus_Bas_Jour": cells[9],
                "Meilleur_Prix_Achat": cells[10],
                "Meilleur_Prix_Vente": cells[11],
                "Quantite_Meilleur_Prix_Achat": cells[12],
                "Quantite_Meilleur_Prix_Vente": cells[13],
                "Capitalisation": cells[14],
                "Nombre_Transactions": cells[15] if len(cells) > 15 else "N/A"
            }
            
            # Ajouter des champs compatibles avec l'ancien format pour la rétrocompatibilité
            stock_data["Ticker"] = cells[0]
            stock_data["Company"] = cells[0]  # Utiliser l'instrument comme nom de société
            stock_data["Last Price"] = cells[4]  # Dernier cours
            
            data.append(stock_data)
        elif len(cells) >= 3:
            # Format de secours si la structure de la table change
            data.append({
                "Ticker": cells[0],
                "Company": cells[1],
                "Last Price": cells[2],
                "Instrument": cells[0],
                "Statut": "N/A",
                "Cours_Reference": "N/A",
                "Ouverture": "N/A",
                "Dernier_Cours": cells[2],
                "Quantite_Echangee": "N/A",
                "Volume": "N/A",
                "Variation_Pourcentage": "N/A",
                "Plus_Haut_Jour": "N/A",
                "Plus_Bas_Jour": "N/A",
                "Meilleur_Prix_Achat": "N/A",
                "Meilleur_Prix_Vente": "N/A",
                "Quantite_Meilleur_Prix_Achat": "N/A",
                "Quantite_Meilleur_Prix_Vente": "N/A",
                "Capitalisation": "N/A",
                "Nombre_Transactions": "N/A"
            })

    df = pd.DataFrame(data)
    df["Timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if df.empty:
        print("❌ No data fetched — check if table selector changed or site blocks scraping.")
    else:
        print(f"✅ {len(df)} stocks fetched at {df['Timestamp'].iloc[0]}")
        print(f"✅ Columns: {', '.join(df.columns)}")

    return df


if __name__ == "__main__":
    df = fetch_bvc_prices()
    df.to_csv("bvc_prices_latest_new.csv", index=False)
    print("✅ Saved to bvc_prices_latest_new.csv")
