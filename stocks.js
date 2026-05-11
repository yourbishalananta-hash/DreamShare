// This array will now be populated automatically from your API
let stockDatabase = [];

async function updateMarketData() {
    // When you deploy, replace this with your Render URL
    const API_URL = 'http://127.0.0.1:8000/stocks/market-watch';

    try {
        const response = await fetch(API_URL);
        const result = await response.json();
        
        // Overwrite the database with fresh data from Python
        stockDatabase = result.data;
        
        console.log("Successfully loaded 40 scripts.");
        
        // Call your UI render function here
        displayStocks(); 

    } catch (error) {
        console.error("Connection to Backend failed. Is main.py running?", error);
    }
}

// Example function to show data on your page
function displayStocks() {
    const container = document.getElementById('stock-list'); // Ensure you have this ID in your HTML
    if (!container) return;

    container.innerHTML = stockDatabase.map(stock => `
        <div class="stock-card">
            <h3>${stock.symbol}</h3>
            <p>Price: ₹${stock.price}</p>
            <p>RSI: ${stock.rsi}</p>
            <p class="${stock.status}">Signal: ${stock.status}</p>
        </div>
    `).join('');
}

// Load data immediately
updateMarketData();
