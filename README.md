# MaFinance Pro 📈

A professional web application for tracking and analyzing Moroccan stock market data from the Casablanca Stock Exchange (Bourse de Casablanca).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![Flask](https://img.shields.io/badge/flask-3.0.0-green.svg)

---

## ⚡ Deploy to Production (FREE)

Deploy your own instance online in 5 minutes - no credit card required:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/lkiwan/MaFinance)

**Includes:**
- ✅ Live web app with HTTPS/SSL
- ✅ PostgreSQL database (1GB storage)
- ✅ Auto-deploy on git push
- ✅ User accounts, watchlists, and alerts

📖 **Full deployment guide**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

## 🌟 Features

- **Real-time Market Data**: Live stock prices from Casablanca Stock Exchange
- **Advanced Search**: Search stocks by name, symbol, or sector with autocomplete
- **Sector Filtering**: Filter stocks by industry sectors (Banking, Real Estate, IT, etc.)
- **Multiple Sorting Options**: Sort by name, price, change, or view top 10 movers
- **Detailed Stock Information**: View comprehensive stock details including:
  - Current price and daily change
  - Volume and market capitalization
  - Day high/low, best bid/ask prices
  - Number of transactions
- **Interactive Charts**: Visualize stock performance with Chart.js
- **Auto-refresh**: Market data refreshes automatically every 60 seconds
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Built with Tailwind CSS for a professional look

## 📊 Covered Stocks

The application tracks 60+ Moroccan companies across multiple sectors:
- **Banking**: Attijariwafa Bank, BCP, Bank of Africa, CIH, etc.
- **Real Estate**: Aradei Capital, Douja Prom Addoha, Residences Dar Saada
- **IT & Telecom**: HPS, Disway, M2M Group, Itissalat Al-Maghrib
- **Energy**: Taqa Morocco, Afriquia Gaz, TotalEnergies Marketing Maroc
- **Mining**: Managem, Miniere Touissit, SMI
- **Insurance**: Wafa Assurance, Saham, Atlantasanad
- **Food & Beverage**: Cosumar, Lesieur Cristal, Dari Couspate, Oulmes
- **Construction**: Ciments du Maroc, LafargeHolcim Maroc, TGCC
- And many more...

## 🚀 Getting Started

### Option 1: Deploy Online (Recommended)
Click the **"Deploy to Render"** button above for instant deployment with PostgreSQL database, user accounts, watchlists, and alerts.

### Option 2: Run Locally

#### Prerequisites

- Python 3.8 or higher
- pip package manager

#### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lkiwan/MaFinance.git
   cd MaFinance
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Initialize database**
   ```bash
   python init_db.py
   ```

4. **Start the application**
   ```bash
   bash start.sh
   ```

5. **Open your browser**
   Navigate to `http://localhost:5000`

**Features available locally:**
- Stock dashboard and search
- User registration and login
- Watchlist management
- Price alerts
- All features work with SQLite database

## 📁 Project Structure

```
MaFinance/
├── app.py                      # Flask backend API
├── bvc_hourly_scraper.py      # Web scraper for BVC data
├── logger.py                   # Custom logger module
├── requirements.txt            # Python dependencies
├── README.md                   # This file
├── .gitignore                  # Git ignore rules
├── index.html                  # Landing page
├── stocks.html                 # Main stocks dashboard
├── stock-details.html          # Individual stock details page
├── script.js                   # Main JavaScript logic
├── stock-details.js            # Stock details page logic
├── style.css                   # Custom styles
├── bvc_prices_latest.csv      # Stock data CSV
├── components/                 # Reusable UI components
│   ├── navbar.js
│   └── footer.js
├── static/                     # Static assets
│   └── favicon.ico
└── logs/                       # Application logs
```

## 🔧 Configuration

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stocks` | GET | Get all Moroccan stocks |
| `/api/stocks/<symbol>` | GET | Get stock details by symbol |
| `/api/watchlist` | GET | Get user's watchlist |
| `/api/watchlist` | POST | Add stock to watchlist |
| `/api/watchlist/<id>` | DELETE | Remove from watchlist |
| `/api/alerts` | GET | Get user's price alerts |
| `/api/alerts` | POST | Create new price alert |
| `/api/alerts/<id>` | DELETE | Delete price alert |
| `/register` | POST | Register new user account |
| `/login` | POST | User login |
| `/logout` | POST | User logout |

### Data Sources

The application uses web scraping to fetch data from:
- **Primary Source**: Casablanca Stock Exchange website
- **Fallback**: Simulated data if scraping fails

**Note**: Data is delayed by up to 15 minutes as per market regulations.

## 🛠️ Technologies Used

### Backend
- **Flask**: Python web framework
- **Pandas**: Data manipulation and analysis
- **NumPy**: Numerical computations
- **Selenium**: Web scraping automation
- **BeautifulSoup4**: HTML parsing

### Frontend
- **Tailwind CSS**: Utility-first CSS framework
- **Vanilla JavaScript**: No frameworks, pure JS
- **Chart.js**: Interactive charts
- **Feather Icons**: Beautiful icon set
- **Vanta.js**: Animated background effects

## 📝 Usage

### Searching Stocks
1. Use the search bar on the stocks page
2. Type a company name, symbol, or sector
3. Select from autocomplete suggestions or press Enter

### Filtering and Sorting
- **Sector Filter**: Select a specific industry sector from the dropdown
- **Sort Options**:
  - By Name (A-Z)
  - By Price (High to Low)
  - By Change (% Gain/Loss)
  - Top 10 Movers (Biggest changes)

### Viewing Stock Details
- Click on any stock card to view detailed information
- Use the "Analyse" button for a quick modal view
- Navigate to dedicated detail page with the "View Details" button

## 🔒 Security Considerations

- CORS is not configured by default
- No authentication system implemented yet
- Debug mode should be disabled in production
- Input validation needed for user inputs
- Recommend adding rate limiting for API endpoints

## 🚧 Known Limitations

- Web scraping may break if BVC website structure changes
- Historical chart data is currently simulated
- No database - relies on CSV files
- No pagination for large stock lists
- Auto-refresh limited to 60-second intervals

## 🔮 Future Enhancements

**Recently Added:**
- ✅ Database support (PostgreSQL/SQLite)
- ✅ User authentication and registration
- ✅ User watchlists
- ✅ Stock price alerts
- ✅ One-click Render deployment

**Coming Soon:**
- [ ] Real historical price data integration
- [ ] Email notifications for alerts
- [ ] Advanced charting with technical indicators
- [ ] Portfolio tracking with performance analytics
- [ ] Mobile app (React Native)
- [ ] API rate limiting and caching
- [ ] Multi-language support (French/Arabic)
- [ ] Real-time price updates (WebSockets)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👤 Author

**lkiwan**
- GitHub: [@lkiwan](https://github.com/lkiwan)

## 🙏 Acknowledgments

- Data sourced from [Casablanca Stock Exchange](https://www.casablanca-bourse.com/)
- Built with love for the Moroccan financial community
- Inspired by modern fintech applications

## ⚠️ Disclaimer

This application is for educational and informational purposes only. It is not intended to provide financial advice. Always consult with a qualified financial advisor before making investment decisions.

Market data is delayed and may not reflect real-time prices. The accuracy of data depends on the availability and reliability of the source.

---

**Made with ❤️ in Morocco**
