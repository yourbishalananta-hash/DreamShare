let stockDatabase = [];
const RENDER_URL = 'https://dreamstock-backend.onrender.com/stocks/market-watch';

async function updateMarketData() {
    const container = document.getElementById('stock-list');
    if (container) {
        container.innerHTML = '<p style="text-align:center; color: #aaa;">Wake up call sent to server... fetching live data (30-60s)...</p>';
    }

    try {
        const response = await fetch(RENDER_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const result = await response.json();
        stockDatabase = result.data;
        
        console.log("Successfully loaded 40 scripts from Render.");
        displayStocks(); 

    } catch (error) {
        console.error("Backend Error:", error);
        if (container) {
            container.innerHTML = `<p style="color: #ff4d4d; text-align:center;">Failed to load data. Please refresh in a minute.</p>`;
        }
    }
}

function displayStocks() {
    const container = document.getElementById('stock-list');
    if (!container) return;

    if (stockDatabase.length === 0) {
        container.innerHTML = "<p>No data available.</p>";
        return;
    }

    container.innerHTML = stockDatabase.map(stock => `
        <div class="stock-card">
            <h3>${stock.symbol}</h3>
            <div class="price-row">
                <span class="label">Price:</span>
                <span class="value">₹${stock.price}</span>
            </div>
            <div class="rsi-row">
                <span class="label">RSI (14):</span>
                <span class="value">${stock.rsi}</span>
            </div>
            <div class="status-tag ${stock.status}">${stock.status}</div>
        </div>
    `).join('');
}

// Auto-run on load
updateMarketData();
