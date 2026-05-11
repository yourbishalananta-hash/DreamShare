let stockDatabase = [];
// Added a trailing slash or double checking the protocol
const RENDER_URL = 'https://dreamstock-backend.onrender.com/stocks/market-watch';

async function updateMarketData() {
    const container = document.getElementById('stock-list');
    if (container) {
        container.innerHTML = '<p style="text-align:center; color: #aaa;">Wake up call sent to server... fetching live data (30-60s)...</p>';
    }

    try {
        // Adding a timestamp ensures the "Host" is re-validated every time
        const response = await fetch(`${RENDER_URL}?t=${new Date().getTime()}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Safety check: ensure result.data exists before assigning
        if (result && result.data) {
            stockDatabase = result.data;
            console.log("Successfully loaded scripts from Render.");
            displayStocks();
        } else {
            throw new Error("Data format is incorrect");
        }

    } catch (error) {
        console.error("Connection Error:", error.message);
        if (container) {
            container.innerHTML = `<p style="color: #ff4d4d; text-align:center;">
                Connection failed. <br>
                <small>Error: ${error.message}</small>
            </p>`;
        }
    }
}

function displayStocks() {
    const container = document.getElementById('stock-list');
    if (!container) return;

    if (!stockDatabase || stockDatabase.length === 0) {
        container.innerHTML = "<p style='text-align:center;'>No stock data found.</p>";
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
