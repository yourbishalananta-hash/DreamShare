(function() {
  // Current state
  let currentSymbol = "AAPL";
  let activeTab = "overview";

  const marketIndices = {
    "S&P 500": { value: 5120.45, change: 0.62 },
    "NASDAQ": { value: 18250.30, change: 1.15 },
    "DJIA": { value: 38940.12, change: -0.24 },
    "VIX": { value: 15.80, change: -3.42 }
  };

  function getStockInfo(sym) {
    const found = stockDatabase.find(s => s.symbol === sym);
    return found || { 
      symbol: sym, name: sym, sector: "General", exchange: "OTC", 
      country: "US", basePrice: 150 + Math.random() * 200 
    };
  }

  function generatePriceSeries(symbol, days = 50) {
    const info = getStockInfo(symbol);
    const base = info.basePrice;
    const vol = symbol === 'TSLA' ? 0.035 : 0.018;
    let price = base - 3 + Math.random() * 6;
    const res = [];
    const now = new Date();
    for (let i = days; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      price += (Math.random() - 0.48) * vol * price;
      price = Math.max(price, base * 0.62);
      res.push({ date: d.toISOString().slice(0,10), price: +price.toFixed(2) });
    }
    return res;
  }

  function computeFullIndicators(prices) {
    const close = prices.map(p => p.price);
    const current = close[close.length-1];
    const sma20 = close.slice(-20).reduce((a,b)=>a+b,0)/20;
    const sma50 = close.length >= 50 ? close.slice(-50).reduce((a,b)=>a+b,0)/50 : sma20;
    
    let rsi = 50;
    if (close.length > 14) {
      const changes = [];
      for (let i=close.length-14; i<close.length; i++) changes.push(close[i]-close[i-1]);
      const gains = changes.filter(c=>c>0).reduce((a,b)=>a+b,0)/14;
      const losses = Math.abs(changes.filter(c=>c<0).reduce((a,b)=>a+b,0))/14;
      if (losses !== 0) rsi = 100 - (100/(1+(gains/losses)));
    }
    
    const ema12 = close.slice(-12).reduce((a,b)=>a+b,0)/12;
    const ema26 = close.slice(-26).reduce((a,b)=>a+b,0)/26;
    const macd = ema12 - ema26;
    
    const std20 = Math.sqrt(close.slice(-20).map(p => Math.pow(p-sma20,2)).reduce((a,b)=>a+b,0)/20);
    const upperBB = sma20 + 2*std20;
    const lowerBB = sma20 - 2*std20;
    
    return { 
      current: +current.toFixed(2), sma20: +sma20.toFixed(2), sma50: +sma50.toFixed(2),
      rsi: +rsi.toFixed(1), macd: +macd.toFixed(2), 
      upperBB: +upperBB.toFixed(2), lowerBB: +lowerBB.toFixed(2)
    };
  }

  // FIXED: Properly separate gainers and losers
  function getAllMarketData() {
    const allData = stockDatabase.map(s => {
      const info = getStockInfo(s.symbol);
      const randomChange = (Math.random() * 10 - 3); // Range: -3 to +7
      const price = (info.basePrice * (1 + randomChange/100)).toFixed(2);
      const change = parseFloat(randomChange.toFixed(2));
      const volume = (Math.random()*8+1).toFixed(2) + 'M';
      const turnover = (Math.random()*1200+150).toFixed(1) + 'M';
      const transactions = Math.floor(Math.random()*18000+2500);
      return { 
        symbol: s.symbol, 
        name: info.name, 
        sector: info.sector,
        price, 
        change, 
        volume, 
        turnover, 
        transactions 
      };
    });
    return allData;
  }

  // FIXED: Gainers have positive change, Losers have negative change
  function getTopGainers(count = 5) {
    const allData = getAllMarketData();
    return allData
      .filter(stock => stock.change > 0) // ONLY positive changes
      .sort((a, b) => b.change - a.change)
      .slice(0, count);
  }

  function getTopLosers(count = 5) {
    const allData = getAllMarketData();
    return allData
      .filter(stock => stock.change < 0) // ONLY negative changes
      .sort((a, b) => a.change - b.change)
      .slice(0, count);
  }

  function showModal(title, data, columns) {
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    
    let html = `
      <button class="modal-close" onclick="document.getElementById('modalOverlay').classList.remove('active')">
        <i class="fas fa-times"></i>
      </button>
      <h2 style="margin-bottom:1rem;">${title}</h2>
      <div class="list-row header-row">
        ${columns.map(c => `<span>${c}</span>`).join('')}
      </div>
    `;
    
    data.forEach(item => {
      html += `<div class="list-row">`;
      columns.forEach(col => {
        if (col === 'Symbol') html += `<span><strong>${item.symbol}</strong></span>`;
        else if (col === 'Name') html += `<span style="color:#6b7a99;">${item.name}</span>`;
        else if (col === 'Price') html += `<span>$${item.price}</span>`;
        else if (col === 'Change' || col === 'Change%') html += `<span class="${item.change>=0?'positive':'negative'}">${item.change>=0?'+':''}${item.change}%</span>`;
        else if (col === 'Volume') html += `<span>${item.volume}</span>`;
        else if (col === 'Turnover') html += `<span>${item.turnover}</span>`;
        else if (col === 'Transactions') html += `<span>${item.transactions.toLocaleString()}</span>`;
      });
      html += `</div>`;
    });
    
    content.innerHTML = html;
    overlay.classList.add('active');
    
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  }

  // Render Market Overview section
  function renderMarketOverview() {
    const allStocks = getAllMarketData();
    const container = document.getElementById('stock-list');
    
    let html = '<div class="market-grid">';
    
    allStocks.forEach(stock => {
      const isPositive = stock.change >= 0;
      html += `
        <div class="stock-card" data-symbol="${stock.symbol}" style="cursor: pointer;">
          <div class="stock-info">
            <h4>${stock.symbol}</h4>
            <p>${stock.name} · ${stock.sector}</p>
          </div>
          <div class="stock-price">
            <div class="price">$${stock.price}</div>
            <div class="change ${isPositive ? 'positive' : 'negative'}">
              ${isPositive ? '+' : ''}${stock.change}%
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Add click handlers
    document.querySelectorAll('.stock-card').forEach(card => {
      card.addEventListener('click', function() {
        const sym = this.dataset.symbol;
        currentSymbol = sym;
        document.getElementById('globalSymbolInput').value = sym;
        switchTab('overview');
      });
    });
  }

  // ---------- SUGGESTIONS / AUTOCOMPLETE ----------
  function setupAutocomplete() {
    const input = document.getElementById('globalSymbolInput');
    const dropdown = document.getElementById('suggestionsDropdown');
    const searchWrapper = document.getElementById('searchWrapper');
    
    input.addEventListener('focus', function() {
      const val = this.value.trim().toUpperCase();
      if (val.length === 0) {
        showAllSuggestions(dropdown);
      } else {
        filterSuggestions(val, dropdown);
      }
    });
    
    input.addEventListener('input', function() {
      const val = this.value.trim().toUpperCase();
      if (val.length === 0) {
        showAllSuggestions(dropdown);
      } else {
        filterSuggestions(val, dropdown);
      }
    });
    
    dropdown.addEventListener('click', function(e) {
      const item = e.target.closest('.suggestion-item');
      if (item) {
        const sym = item.dataset.symbol;
        input.value = sym;
        dropdown.classList.remove('active');
        currentSymbol = sym;
        switchTab(activeTab);
      }
    });
    
    document.addEventListener('click', function(e) {
      if (!searchWrapper.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
    
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') dropdown.classList.remove('active');
      if (e.key === 'Enter') {
        const val = this.value.trim().toUpperCase();
        if (val && stockDatabase.find(s => s.symbol === val)) {
          dropdown.classList.remove('active');
          currentSymbol = val;
          switchTab(activeTab);
        }
      }
    });
  }
  
  function showAllSuggestions(dropdown) {
    const allStocks = stockDatabase;
    
    if (allStocks.length === 0) {
      dropdown.innerHTML = '<div class="no-results">No stocks available</div>';
      dropdown.classList.add('active');
      return;
    }
    
    let html = '<div class="dropdown-header">📊 All Available Stocks (' + allStocks.length + ')</div>';
    
    allStocks.forEach(stock => {
      const priceChange = (Math.random() * 4 - 2).toFixed(2);
      const isPositive = parseFloat(priceChange) >= 0;
      
      html += `
        <div class="suggestion-item" data-symbol="${stock.symbol}">
          <div class="sym-main">
            <span class="sym-symbol">${stock.symbol}</span>
            <span class="sym-name">${stock.name}</span>
          </div>
          <div style="text-align:right;">
            <span class="sym-price">$${stock.basePrice.toFixed(2)}</span>
            <span class="${isPositive ? 'positive' : 'negative'}" style="font-size:0.75rem; display:block;">
              ${isPositive ? '+' : ''}${priceChange}%
            </span>
          </div>
        </div>
      `;
    });
    
    dropdown.innerHTML = html;
    dropdown.classList.add('active');
  }
  
  function filterSuggestions(query, dropdown) {
    const matchingStocks = stockDatabase.filter(stock => 
      stock.symbol.startsWith(query)
    );
    
    if (matchingStocks.length === 0) {
      dropdown.innerHTML = `
        <div class="dropdown-header">🔍 Search Results for "${query}"</div>
        <div class="no-results">
          <i class="fas fa-search" style="font-size:1.5rem; display:block; margin-bottom:0.5rem;"></i>
          No stocks found starting with "${query}"<br>
          <span style="font-size:0.75rem;">Try different letters</span>
        </div>
      `;
    } else {
      let html = `<div class="dropdown-header">🔍 Stocks starting with "${query}" (${matchingStocks.length} found)</div>`;
      
      matchingStocks.forEach(stock => {
        const priceChange = (Math.random() * 4 - 2).toFixed(2);
        const isPositive = parseFloat(priceChange) >= 0;
        
        const highlightedSym = stock.symbol.replace(
          new RegExp(`^(${query})`, 'i'),
          '<span style="background:#fff3cd; padding:0.1rem 0.3rem; border-radius:0.3rem;">\$1</span>'
        );
        
        html += `
          <div class="suggestion-item" data-symbol="\${stock.symbol}">
            <div class="sym-main">
              <span class="sym-symbol">${highlightedSym}</span>
              <span class="sym-name">${stock.name} · <span class="sym-sector">${stock.sector}</span></span>
            </div>
            <div style="text-align:right;">
              <span class="sym-price">$${stock.basePrice.toFixed(2)}</span>
              <span class="${isPositive ? 'positive' : 'negative'}" style="font-size:0.75rem; display:block;">
                ${isPositive ? '+' : ''}${priceChange}%
              </span>
            </div>
          </div>
        `;
      });
      
      dropdown.innerHTML = html;
    }
    
    dropdown.classList.add('active');
  }

  // ---------- RENDERERS ----------
  function renderOverview() {
    const topGainers = getTopGainers(5);
    const topLosers = getTopLosers(5);
    const allData = getAllMarketData();
    const topTurnover = [...allData].sort((a,b) => parseFloat(b.turnover) - parseFloat(a.turnover)).slice(0, 5);
    const topVolume = [...allData].sort((a,b) => parseFloat(b.volume) - parseFloat(a.volume)).slice(0, 5);
    const topTransactions = [...allData].sort((a,b) => b.transactions - a.transactions).slice(0, 5);
    
    const news = [
      "Fed holds rates steady, signals cautious approach",
      "AI chip demand drives semiconductor rally",
      "Oil prices dip on supply increase expectations",
      "Retail earnings beat forecasts, consumer strong",
      "Global markets mixed amid geopolitical concerns"
    ];

    return `
      <div class="grid-2col" style="margin-bottom:1.5rem;">
        <div>
          <div class="card-title"><i class="fas fa-chart-line"></i> ${currentSymbol} · Price Action</div>
          <canvas id="overviewMiniChart" height="170"></canvas>
        </div>
        <div>
          <div class="card-title"><i class="fas fa-newspaper"></i> Latest Market News</div>
          ${news.map(n => `<div class="news-item"><i class="fas fa-circle" style="font-size:0.35rem; color:#2d6a9f; margin-top:0.4rem;"></i> ${n}</div>`).join('')}
        </div>
      </div>
      
      <div class="grid-3col">
        <div>
          <div class="card-title"><i class="fas fa-arrow-up positive"></i> Top Gainers</div>
          ${topGainers.length > 0 ? topGainers.map(g => `<div class="list-row"><span><strong>${g.symbol}</strong></span><span>$${g.price}</span><span class="positive">+${g.change}%</span></div>`).join('') : '<p style="color:#6b7a99;">No gainers today</p>'}
          <button class="see-more-btn" onclick="window.showAllGainers()">See All Gainers <i class="fas fa-chevron-right"></i></button>
        </div>
        <div>
          <div class="card-title"><i class="fas fa-arrow-down negative"></i> Top Losers</div>
          ${topLosers.length > 0 ? topLosers.map(l => `<div class="list-row"><span><strong>${l.symbol}</strong></span><span>$${l.price}</span><span class="negative">${l.change}%</span></div>`).join('') : '<p style="color:#6b7a99;">No losers today</p>'}
          <button class="see-more-btn" onclick="window.showAllLosers()">See All Losers <i class="fas fa-chevron-right"></i></button>
        </div>
        <div>
          <div class="card-title"><i class="fas fa-fire"></i> Top Turnover</div>
          ${topTurnover.map(t => `<div class="list-row"><span><strong>${t.symbol}</strong></span><span>${t.turnover}</span></div>`).join('')}
          <button class="see-more-btn" onclick="window.showAllTurnover()">See All Turnover <i class="fas fa-chevron-right"></i></button>
        </div>
      </div>
      
      <div class="grid-3col" style="margin-top:1.2rem;">
        <div>
          <div class="card-title"><i class="fas fa-chart-bar"></i> Top Volume</div>
          ${topVolume.map(t => `<div class="list-row"><span><strong>${t.symbol}</strong></span><span>${t.volume}</span></div>`).join('')}
          <button class="see-more-btn" onclick="window.showAllVolume()">See All Volume <i class="fas fa-chevron-right"></i></button>
        </div>
        <div>
          <div class="card-title"><i class="fas fa-exchange-alt"></i> Top Transactions</div>
          ${topTransactions.map(t => `<div class="list-row"><span><strong>${t.symbol}</strong></span><span>${t.transactions.toLocaleString()} trades</span></div>`).join('')}
          <button class="see-more-btn" onclick="window.showAllTransactions()">See All Transactions <i class="fas fa-chevron-right"></i></button>
        </div>
        <div>
          <div class="card-title"><i class="fas fa-globe"></i> Market Indices</div>
          ${Object.entries(marketIndices).map(([name, data]) => 
            `<div class="list-row"><span><strong>${name}</strong></span><span>${data.value.toLocaleString()}</span><span class="${data.change>=0?'positive':'negative'}">${data.change>=0?'+':''}${data.change}%</span></div>`
          ).join('')}
        </div>
      </div>
    `;
  }

  function renderMarketDepth(symbol = currentSymbol) {
    const info = getStockInfo(symbol);
    const bids = [], asks = [];
    for (let i=0; i<7; i++) {
      bids.push({ price: (info.basePrice - 0.22*i - Math.random()*0.5).toFixed(2), volume: Math.floor(Math.random()*900+150) });
      asks.push({ price: (info.basePrice + 0.2*i + Math.random()*0.45).toFixed(2), volume: Math.floor(Math.random()*800+130) });
    }
    return `
      <div class="inline-search">
        <input type="text" id="depthSymbolInput" placeholder="Symbol" value="${symbol}">
        <button id="depthSearchBtn"><i class="fas fa-search"></i> Load</button>
      </div>
      <div class="grid-2col">
        <div><div class="card-title"><i class="fas fa-arrow-down positive"></i> Bid (Buyers)</div>
          ${bids.map(b => `<div class="depth-row"><span class="positive">$${b.price}</span><span>${b.volume} shares</span></div>`).join('')}
        </div>
        <div><div class="card-title"><i class="fas fa-arrow-up negative"></i> Ask (Sellers)</div>
          ${asks.map(a => `<div class="depth-row"><span class="negative">$${a.price}</span><span>${a.volume} shares</span></div>`).join('')}
        </div>
      </div>
      <p style="margin-top:0.8rem;"><strong>Spread:</strong> $${(asks[0].price - bids[0].price).toFixed(2)}</p>
    `;
  }

  function renderTechnicalScreener(symbol = null) {
    const filterSymbol = symbol || '';
    const symbols = stockDatabase.filter(s => !filterSymbol || s.symbol.includes(filterSymbol.toUpperCase()));
    const rows = symbols.map(s => {
      const ind = computeFullIndicators(generatePriceSeries(s.symbol, 55));
      const signal = ind.rsi > 70 ? 'Overbought' : ind.rsi < 30 ? 'Oversold' : ind.macd > 0 ? 'Bullish' : 'Bearish';
      return `<div class="list-row">
        <span><strong>${s.symbol}</strong></span>
        <span>$${ind.current}</span>
        <span>RSI ${ind.rsi}</span>
        <span>MACD ${ind.macd}</span>
        <span class="badge">${signal}</span>
      </div>`;
    }).join('');
    return `
      <div class="inline-search">
        <input type="text" id="techSymbolFilter" placeholder="Filter symbol..." value="${filterSymbol}">
        <button id="techFilterBtn"><i class="fas fa-filter"></i> Apply</button>
      </div>
      <div class="card-title"><i class="fas fa-chart-simple"></i> Technical Screener</div>
      <div class="list-row header-row">
        <span>Symbol</span><span>Price</span><span>RSI</span><span>MACD</span><span>Signal</span>
      </div>
      ${rows}
    `;
  }

  function renderFundamental(symbol = currentSymbol) {
    const info = getStockInfo(symbol);
    return `
      <div class="inline-search">
        <input type="text" id="fundSymbolInput" placeholder="Symbol" value="${symbol}">
        <button id="fundSearchBtn"><i class="fas fa-search"></i> Load</button>
      </div>
      <div class="card-title"><i class="fas fa-coins"></i> Fundamental Analysis · ${symbol}</div>
      <div class="indicator-grid">
        <div><strong>Exchange:</strong> ${info.exchange}</div>
        <div><strong>Country:</strong> ${info.country}</div>
        <div><strong>Sector:</strong> ${info.sector}</div>
        <div><strong>Base Price:</strong> $${info.basePrice.toFixed(2)}</div>
      </div>
    `;
  }

  function renderFloorsheet(symbol = currentSymbol) {
    const brokers = ["GOLDMAN", "MORGAN", "JPMS", "CITI", "BOFA", "WELLS", "UBS", "CSFB"];
    const trans = [];
    for (let i=0; i<9; i++) {
      trans.push({
        time: `${10+Math.floor(Math.random()*5)}:${Math.floor(Math.random()*60).toString().padStart(2,'0')}`,
        price: (getStockInfo(symbol).basePrice + (Math.random()-0.5)*3.2).toFixed(2),
        volume: Math.floor(Math.random()*2500+150),
        buyer: brokers[Math.floor(Math.random()*brokers.length)],
        seller: brokers[Math.floor(Math.random()*brokers.length)]
      });
    }
    return `
      <div class="inline-search">
        <input type="text" id="floorSymbolInput" placeholder="Symbol" value="${symbol}">
        <button id="floorSearchBtn"><i class="fas fa-search"></i> Load</button>
      </div>
      <div class="card-title"><i class="fas fa-receipt"></i> Floorsheet · ${symbol}</div>
      <div class="floorsheet-row header-row">
        <span>Time</span><span>Price</span><span>Vol</span><span>Buyer</span><span>Seller</span>
      </div>
      ${trans.map(t => `<div class="floorsheet-row">
        <span>${t.time}</span>
        <span>$${t.price}</span>
        <span>${t.volume}</span>
        <span class="broker-tag">${t.buyer}</span>
        <span class="broker-tag">${t.seller}</span>
      </div>`).join('')}
    `;
  }

  function renderForecast(symbol = currentSymbol) {
    const prices = generatePriceSeries(symbol, 40);
    const last = prices[prices.length-1].price;
    return `
      <div class="inline-search">
        <input type="text" id="forecastSymbolInput" placeholder="Symbol" value="${symbol}">
        <button id="forecastSearchBtn"><i class="fas fa-search"></i> Load</button>
      </div>
      <div class="grid-2col">
        <div><canvas id="forecastChart" height="190"></canvas></div>
        <div>
          <h3>📊 30-Day Forecast</h3>
          <p>High: <strong>$${(last*1.07).toFixed(2)}</strong></p>
          <p>Low: <strong>$${(last*0.93).toFixed(2)}</strong></p>
          <p>Confidence: 74%</p>
        </div>
      </div>
    `;
  }

  function renderAIAnalysis(symbol = currentSymbol) {
    const ind = computeFullIndicators(generatePriceSeries(symbol, 60));
    const info = getStockInfo(symbol);
    const sentimentScore = (ind.rsi/100*0.4 + (ind.macd>0?0.3:0) + (ind.current>ind.sma20?0.3:0))*100;
    return `
      <div class="inline-search">
        <input type="text" id="aiSymbolInput" placeholder="Symbol" value="${symbol}">
        <button id="aiSearchBtn"><i class="fas fa-search"></i> Load</button>
      </div>
      <div class="ai-box">
        <h3><i class="fas fa-brain"></i> Advanced AI Analysis · ${symbol} (${info.name})</h3>
        <div class="grid-2col" style="margin-top:1rem;">
          <div>
            <p><strong>🧠 Sentiment Score:</strong> ${sentimentScore.toFixed(1)}/100</p>
            <p><strong>📈 Trend:</strong> ${ind.current > ind.sma20 ? 'Bullish' : 'Bearish'}</p>
            <p><strong>📊 RSI:</strong> ${ind.rsi}</p>
            <p><strong>📉 MACD:</strong> ${ind.macd}</p>
          </div>
          <div>
            <p><strong>🎯 Support:</strong> $${ind.lowerBB}</p>
            <p><strong>🎯 Resistance:</strong> $${ind.upperBB}</p>
            <p><strong>💡 Recommendation:</strong> ${sentimentScore>65?'Strong Buy': sentimentScore>45?'Buy on dips': sentimentScore>30?'Hold':'Sell'}</p>
          </div>
        </div>
      </div>
    `;
  }

  function switchTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[data-tab="${tabId}"]`)?.classList.add('active');
    const container = document.getElementById('tabContent');
    let html = '';
    switch(tabId) {
      case 'overview': html = renderOverview(); break;
      case 'marketdepth': html = renderMarketDepth(); break;
      case 'technicals': html = renderTechnicalScreener(); break;
      case 'fundamental': html = renderFundamental(); break;
      case 'floorsheet': html = renderFloorsheet(); break;
      case 'forecast': html = renderForecast(); break;
      case 'ai': html = renderAIAnalysis(); break;
      default: html = renderOverview();
    }
    container.innerHTML = html;
    attachTabEvents(tabId);
    if (tabId === 'overview') setTimeout(drawOverviewMiniChart, 40);
    if (tabId === 'forecast') setTimeout(drawForecastChart, 50);
  }

  function attachTabEvents(tabId) {
    const bindSearch = (inputId, btnId) => {
      document.getElementById(btnId)?.addEventListener('click', () => {
        const sym = document.getElementById(inputId)?.value.trim().toUpperCase();
        if (sym) { 
          currentSymbol = sym; 
          switchTab(tabId); 
        }
      });
    };
    if (tabId === 'marketdepth') bindSearch('depthSymbolInput', 'depthSearchBtn');
    if (tabId === 'fundamental') bindSearch('fundSymbolInput', 'fundSearchBtn');
    if (tabId === 'floorsheet') bindSearch('floorSymbolInput', 'floorSearchBtn');
    if (tabId === 'forecast') bindSearch('forecastSymbolInput', 'forecastSearchBtn');
    if (tabId === 'ai') bindSearch('aiSymbolInput', 'aiSearchBtn');
    if (tabId === 'technicals') {
      document.getElementById('techFilterBtn')?.addEventListener('click', () => {
        const filter = document.getElementById('techSymbolFilter')?.value || '';
        const container = document.getElementById('tabContent');
        container.innerHTML = renderTechnicalScreener(filter);
        attachTabEvents('technicals');
      });
    }
  }

  function drawOverviewMiniChart() {
    const canvas = document.getElementById('overviewMiniChart');
    if (!canvas) return;
    const data = generatePriceSeries(currentSymbol, 35);
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map(d=>d.date),
        datasets: [{
          data: data.map(d=>d.price),
          borderColor: '#0a2540', backgroundColor: 'rgba(10,37,64,0.06)',
          fill: true, tension: 0.2, pointRadius: 0
        }]
      },
      options: { responsive: true, plugins:{legend:{display:false}}, scales:{x:{display:false},y:{display:false}} }
    });
  }

  function drawForecastChart() {
    const canvas = document.getElementById('forecastChart');
    if (!canvas) return;
    const hist = generatePriceSeries(currentSymbol, 25);
    const last = hist[hist.length-1].price;
    const future = [last, last*1.012, last*1.025, last*1.018, last*1.03];
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: ['D-2','D-1','Now','D+1','D+2'],
        datasets: [{
          data: [...hist.slice(-3).map(d=>d.price), ...future.slice(0,2)],
          borderColor: '#2d6a9f', tension: 0.2, pointRadius: 3
        }]
      },
      options: { responsive: true, plugins:{legend:{display:false}} }
    });
  }

  // Global modal functions - FIXED: Separate gainers/losers
  window.showAllGainers = function() {
    const allData = getAllMarketData();
    const gainers = allData.filter(s => s.change > 0).sort((a,b) => b.change - a.change);
    showModal('📈 All Gainers (Positive Changes)', gainers, ['Symbol', 'Name', 'Price', 'Change%']);
  };
  
  window.showAllLosers = function() {
    const allData = getAllMarketData();
    const losers = allData.filter(s => s.change < 0).sort((a,b) => a.change - b.change);
    showModal('📉 All Losers (Negative Changes)', losers, ['Symbol', 'Name', 'Price', 'Change%']);
  };
  
  window.showAllTurnover = function() {
    const allData = getAllMarketData().sort((a,b) => parseFloat(b.turnover) - parseFloat(a.turnover));
    showModal('🔥 All Stocks by Turnover', allData, ['Symbol', 'Name', 'Turnover', 'Volume']);
  };
  
  window.showAllVolume = function() {
    const allData = getAllMarketData().sort((a,b) => parseFloat(b.volume) - parseFloat(a.volume));
    showModal('📊 All Stocks by Volume', allData, ['Symbol', 'Name', 'Volume', 'Turnover']);
  };
  
  window.showAllTransactions = function() {
    const allData = getAllMarketData().sort((a,b) => b.transactions - a.transactions);
    showModal('💱 All Stocks by Transactions', allData, ['Symbol', 'Name', 'Transactions', 'Volume']);
  };

  // Global search
  document.getElementById('globalAnalyzeBtn').addEventListener('click', ()=>{
    const val = document.getElementById('globalSymbolInput').value.trim().toUpperCase();
    if (val) {
      currentSymbol = val;
      switchTab(activeTab);
    }
  });

  document.getElementById('tabBar').addEventListener('click', (e)=>{
    if (e.target.classList.contains('tab')) switchTab(e.target.dataset.tab);
  });

  // Initialize
  window.addEventListener('load', ()=>{
    setupAutocomplete();
    switchTab('overview');
    renderMarketOverview();
    // Refresh market overview every 30 seconds
    setInterval(renderMarketOverview, 30000);
  });
})();
