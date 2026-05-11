/**
 * Comprehensive Stock Database Array (2026 Edition)
 * Includes US Tech, Financials, Healthcare, Energy, Global ETFs, and Indian Markets.
 */
const stockDatabase = [
  // ========== US TECHNOLOGY & SEMICONDUCTORS ==========
  { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Semiconductors", exchange: "NASDAQ", country: "US" },
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", exchange: "NASDAQ", country: "US" },
  { symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology", exchange: "NASDAQ", country: "US" },
  { symbol: "GOOGL", name: "Alphabet Inc. (Class A)", sector: "Technology", exchange: "NASDAQ", country: "US" },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "E-Commerce", exchange: "NASDAQ", country: "US" },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Technology", exchange: "NASDAQ", country: "US" },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Automotive", exchange: "NASDAQ", country: "US" },
  { symbol: "AVGO", name: "Broadcom Inc.", sector: "Semiconductors", exchange: "NASDAQ", country: "US" },
  { symbol: "AMD", name: "Advanced Micro Devices", sector: "Semiconductors", exchange: "NASDAQ", country: "US" },
  { symbol: "MU", name: "Micron Technology", sector: "Semiconductors", exchange: "NASDAQ", country: "US" },
  { symbol: "ASML", name: "ASML Holding NV", sector: "Semiconductors", exchange: "NASDAQ", country: "Netherlands" },
  { symbol: "ORCL", name: "Oracle Corporation", sector: "Software", exchange: "NYSE", country: "US" },
  { symbol: "CRM", name: "Salesforce Inc.", sector: "Software", exchange: "NYSE", country: "US" },
  { symbol: "NFLX", name: "Netflix Inc.", sector: "Entertainment", exchange: "NASDAQ", country: "US" },
  { symbol: "ADBE", name: "Adobe Inc.", sector: "Software", exchange: "NASDAQ", country: "US" },

  // ========== US FINANCIALS & PAYMENTS ==========
  { symbol: "BRK.B", name: "Berkshire Hathaway Inc.", sector: "Conglomerate", exchange: "NYSE", country: "US" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Banking", exchange: "NYSE", country: "US" },
  { symbol: "V", name: "Visa Inc.", sector: "Financial Services", exchange: "NYSE", country: "US" },
  { symbol: "MA", name: "Mastercard Inc.", sector: "Financial Services", exchange: "NYSE", country: "US" },
  { symbol: "BAC", name: "Bank of America Corp", sector: "Banking", exchange: "NYSE", country: "US" },
  { symbol: "GS", name: "Goldman Sachs Group Inc.", sector: "Investment Banking", exchange: "NYSE", country: "US" },
  { symbol: "MS", name: "Morgan Stanley", sector: "Investment Banking", exchange: "NYSE", country: "US" },

  // ========== US HEALTHCARE & BIOTECH ==========
  { symbol: "LLY", name: "Eli Lilly and Company", sector: "Pharmaceuticals", exchange: "NYSE", country: "US" },
  { symbol: "UNH", name: "UnitedHealth Group Inc.", sector: "Healthcare Insurance", exchange: "NYSE", country: "US" },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", exchange: "NYSE", country: "US" },
  { symbol: "ABBV", name: "AbbVie Inc.", sector: "Pharmaceuticals", exchange: "NYSE", country: "US" },
  { symbol: "MRK", name: "Merck & Co Inc.", sector: "Pharmaceuticals", exchange: "NYSE", country: "US" },
  { symbol: "TMO", name: "Thermo Fisher Scientific", sector: "Life Sciences", exchange: "NYSE", country: "US" },

  // ========== US ENERGY & UTILITIES ==========
  { symbol: "XOM", name: "Exxon Mobil Corporation", sector: "Oil & Gas", exchange: "NYSE", country: "US" },
  { symbol: "CVX", name: "Chevron Corporation", sector: "Oil & Gas", exchange: "NYSE", country: "US" },
  { symbol: "NEE", name: "NextEra Energy", sector: "Utilities", exchange: "NYSE", country: "US" },
  { symbol: "COP", name: "ConocoPhillips", sector: "Oil & Gas", exchange: "NYSE", country: "US" },

  // ========== US CONSUMER & RETAIL ==========
  { symbol: "WMT", name: "Walmart Inc.", sector: "Retail", exchange: "NYSE", country: "US" },
  { symbol: "COST", name: "Costco Wholesale Corp", sector: "Retail", exchange: "NASDAQ", country: "US" },
  { symbol: "KO", name: "The Coca-Cola Company", sector: "Beverages", exchange: "NYSE", country: "US" },
  { symbol: "PEP", name: "PepsiCo Inc.", sector: "Beverages", exchange: "NASDAQ", country: "US" },
  { symbol: "PG", name: "Procter & Gamble Company", sector: "Consumer Goods", exchange: "NYSE", country: "US" },
  { symbol: "HD", name: "The Home Depot Inc.", sector: "Retail", exchange: "NYSE", country: "US" },
  { symbol: "DIS", name: "The Walt Disney Company", sector: "Entertainment", exchange: "NYSE", country: "US" },

  // ========== GLOBAL & SECTOR ETFs ==========
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", sector: "ETF", exchange: "NYSE", country: "US" },
  { symbol: "QQQ", name: "Invesco QQQ Trust (NASDAQ-100)", sector: "ETF", exchange: "NASDAQ", country: "US" },
  { symbol: "SOXL", name: "Direxion Daily Semi Bull 3X", sector: "Leveraged ETF", exchange: "NYSE", country: "US" },
  { symbol: "GLD", name: "SPDR Gold Shares", sector: "Commodities", exchange: "NYSE", country: "US" },
  { symbol: "VTI", name: "Vanguard Total Stock Market", sector: "ETF", exchange: "NYSE", country: "US" },
  { symbol: "XLE", name: "Energy Select Sector SPDR", sector: "Sector ETF", exchange: "NYSE", country: "US" },
  { symbol: "VXUS", name: "Vanguard Total Intl Stock", sector: "ETF", exchange: "NASDAQ", country: "Global" },

  // ========== INDIAN STOCK MARKET (NSE) ==========
  { symbol: "RELIANCE", name: "Reliance Industries Ltd", sector: "Conglomerate", exchange: "NSE", country: "India" },
  { symbol: "HDFCBANK", name: "HDFC Bank Limited", sector: "Banking", exchange: "NSE", country: "India" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Limited", sector: "Telecommunications", exchange: "NSE", country: "India" },
  { symbol: "TCS", name: "Tata Consultancy Services", sector: "Technology", exchange: "NSE", country: "India" },
  { symbol: "ICICIBANK", name: "ICICI Bank Limited", sector: "Banking", exchange: "NSE", country: "India" },
  { symbol: "SBIN", name: "State Bank of India", sector: "Banking", exchange: "NSE", country: "India" },
  { symbol: "INFY", name: "Infosys Limited", sector: "Technology", exchange: "NSE", country: "India" },
  { symbol: "LICI", name: "LIC of India", sector: "Insurance", exchange: "NSE", country: "India" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd", sector: "Consumer Goods", exchange: "NSE", country: "India" },
  { symbol: "ITC", name: "ITC Limited", sector: "Conglomerate", exchange: "NSE", country: "India" }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = stockDatabase;
}
// Function to display the stocks on the page
function renderStocks() {
    const listContainer = document.getElementById('stock-list');
    
    // Clear the "Loading" text
    listContainer.innerHTML = ''; 

    // Loop through the 57 stocks and create HTML for each
    stockDatabase.forEach(stock => {
        const stockHTML = `
            <div class="stock-card">
                <h3>${stock.symbol}</h3>
                <p>${stock.name}</p>
                <span>${stock.sector} | ${stock.exchange}</span>
            </div>
        `;
        listContainer.innerHTML += stockHTML;
    });
}

// Run the function as soon as the page loads
window.onload = renderStocks;
