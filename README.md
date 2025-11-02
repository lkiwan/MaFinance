# MaFinance Pro 📈

A professional web application for tracking and analyzing Moroccan stock market data from the Casablanca Stock Exchange (Bourse de Casablanca).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![Flask](https://img.shields.io/badge/flask-3.0.0-green.svg)

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

### Prerequisites

- Python 3.8 or higher
- Google Chrome browser (for web scraping)
- ChromeDriver (matching your Chrome version)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lkiwan/MaFinance.git
   cd MaFinance
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Install ChromeDriver**
   - Download ChromeDriver from [chromedriver.chromium.org](https://chromedriver.chromium.org/)
   - Ensure it matches your Chrome browser version
   - Add ChromeDriver to your system PATH

### Running the Application

1. **Scrape the latest market data** (optional, CSV files included)
   ```bash
   python bvc_hourly_scraper.py
   ```

2. **Start the Flask server**
   ```bash
   python app.py
   ```

3. **Open your browser**
   Navigate to `http://localhost:5000`

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

The application provides two main API endpoints:

- **GET /api/stocks**
  - Returns all stocks with their latest data
  - Response includes sectors list and timestamp

- **GET /api/stocks/<symbol>**
  - Returns detailed information for a specific stock
  - Includes chart data for visualization

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

- [ ] Add database support (PostgreSQL/SQLite)
- [ ] Implement user authentication
- [ ] Real historical price data integration
- [ ] User portfolios and watchlists
- [ ] Stock price alerts and notifications
- [ ] Advanced charting with technical indicators
- [ ] Mobile app (React Native)
- [ ] Email reports and newsletters
- [ ] API rate limiting and caching
- [ ] Multi-language support (French/Arabic)

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
