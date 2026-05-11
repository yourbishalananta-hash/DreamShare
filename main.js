(function() {
  // Current state
  let currentSymbol = "AAPL";
  let activeTab = "overview";
  
  // Interactive Chart State
  let currentChartSymbol = "MARKET";
  let currentChartTf = "1D";
  let overviewChartInst = null;
  let fullChartInst = null;

  // News & Compare State
  let activeNewsCategory = 'global';
  let compareList =['AAPL', 'MSFT', 'GOOGL'];

  // 🧺 Thematic Bundles Data
  const smartBundles =[
    { id: 'tech-giants', name: 'Tech Giants', icon: 'fa-microchip', desc: 'The leaders of the digital age.', stocks:['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META'] },
    { id: 'div-kings', name: 'Dividend Kings', icon: 'fa-crown', desc: 'Consistent, high-yield payouts.', stocks:['JNJ', 'KO', 'PG', 'XOM', 'CVX'] },
    { id: 'finance-bros', name: 'Wall St Heavies', icon: 'fa-building-columns', desc: 'The backbone of global finance.', stocks:['JPM', 'GS', 'MS', 'BAC', 'WFC'] },
    { id: 'ai-boom', name: 'AI Revolution', icon: 'fa-robot', desc: 'Companies powering the AI boom.', stocks:['NVDA', 'AMD', 'MSFT', 'GOOGL', 'AVGO'] }
  ];

  // 👑 Whale Trackers
  const whalePortfolios =[
    { name: "Warren Buffett (Berkshire)", icon: "👴", top:["AAPL", "BAC", "AXP", "CVX", "KO"] },
    { name: "Michael Burry (Scion)", icon: "📉", top:["GOOGL", "AMZN", "CVS", "MGM"] },
    { name: "Ray Dalio (Bridgewater)", icon: "🌊", top:["PG", "JNJ", "PEP", "COST", "MCD"] }
  ];

  // 📰 Categorized News
  const categorizedNews = {
    global:["Fed holds rates steady, signals cautious approach", "Oil prices dip on supply increase expectations", "Global markets mixed amid geopolitical concerns"],
    corporate:["Retail earnings beat forecasts, consumer strong", "Tesla announces expansion of Gigafactory", "Apple unveils next-generation AI processing chips"],
    economy:["Inflation cools down slightly in latest CPI report", "Unemployment rate remains stable at 3.8%", "Consumer spending hits record high this quarter"]
  };

  const marketIndices = {
    "S&P 500": { value: 5120.45, change: 0.62 },
    "NASDAQ": { value: 18250.30, change: 1.15 },
    "DJIA": { value: 38940.12, change: -0.24 },
    "VIX": { value: 15.80, change: -3.42 },
    "Russell 2000": { value: 2085.67, change: 0.85 }
  };

  function getStockInfo(sym) {
    const found = stockDatabase.find(s => s.symbol === sym);
    return found || { symbol: sym, name: sym, sector: "General", exchange: "OTC", country: "US", basePrice: 150 + Math.random() * 200 };
  }

  function generateTimeframeData(symbol, tf) {
    const info = symbol === 'MARKET' ? { basePrice: 5120.45, name: 'S&P 500' } : getStockInfo(symbol);
    const base = info.basePrice;
    let vol = symbol === 'MARKET' ? 0.004 : 0.015;
    let points = 50;
    let stepMs = 24 * 60 * 60 * 1000;
    
    if (tf === '1m') { points = 60; stepMs = 60 * 1000; vol = 0.001; }
    else if (tf === '5m') { points = 60; stepMs = 5 * 60 * 1000; vol = 0.002; }
    else if (tf === '15m') { points = 60; stepMs = 15 * 60 * 1000; vol = 0.003; }
    else if (tf === '1H') { points = 48; stepMs = 60 * 60 * 1000; vol = 0.005; }
    else if (tf === '1D') { points = 60; stepMs = 24 * 60 * 60 * 1000; vol = 0.015; }
    else if (tf === '1W') { points = 52; stepMs = 7 * 24 * 60 * 60 * 1000; vol = 0.03; }
    else if (tf === '1M') { points = 24; stepMs = 30 * 24 * 60 * 60 * 1000; vol = 0.06; }
    else if (tf === '1Y') { points = 10; stepMs = 365 * 24 * 60 * 60 * 1000; vol = 0.15; }

    let price = base * (1 + (Math.random() * 0.1 - 0.05));
    const res =[];
    const now = Date.now();
    
    for (let i = points; i >= 0; i--) {
      const d = new Date(now - i * stepMs);
      price += (Math.random() - 0.48) * vol * price;
      let label = '';
      if (['1m','5m','15m','1H'].includes(tf)) label = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      else if (tf === '1Y') label = d.getFullYear().toString();
      else if (tf === '1M') label = d.toLocaleDateString([], {month: 'short', year: '2-digit'});
      else label = d.toLocaleDateString([], {month: 'short', day: 'numeric'});
      res.push({ date: label, price: +price.toFixed(2) });
    }
    return res;
  }

  function generateStockDetails(symbol) {
    const info = getStockInfo(symbol);
    const basePrice = info.basePrice;
    
    // Create a pseudo-random seed based on symbol so values stay consistent
    const seed = symbol.split('').reduce((a,b)=>a+b.charCodeAt(0),0) % 100 / 100;
    const volatility = basePrice * 0.15;
    
    return {
      symbol: symbol, companyName: info.name, sector: info.sector, exchange: info.exchange, country: info.country,
      ltp: basePrice + (seed - 0.5) * volatility * 0.1,
      prevClose: basePrice + (seed - 0.5) * volatility * 0.08,
      open: basePrice + (seed - 0.5) * volatility * 0.08,
      high: basePrice + seed * volatility * 0.05,
      low: basePrice - seed * volatility * 0.05,
      week52High: basePrice * (1 + seed * 0.3),
      week52Low: basePrice * (1 - seed * 0.25),
      volume: Math.floor(seed * 5000000 + 500000),
      avgVolume: Math.floor(seed * 4000000 + 400000),
      turnover: basePrice * Math.floor(seed * 5000000 + 500000),
      marketCap: (basePrice * Math.floor(seed * 5000000000 + 1000000000)),
      sharesOutstanding: Math.floor(seed * 5000000000 + 500000000),
      freeFloat: Math.floor(seed * 3000000000 + 300000000),
      peRatio: (basePrice / (seed * 10 + 2)).toFixed(2),
      pbRatio: (basePrice / (seed * 50 + 10)).toFixed(2),
      eps: (basePrice / (seed * 30 + 5)).toFixed(2),
      bookValue: (basePrice / (seed * 5 + 1)).toFixed(2),
      roe: (seed * 30 + 5).toFixed(2),
      roa: (seed * 15 + 2).toFixed(2),
      debtToEquity: (seed * 2).toFixed(2),
      dividendYield: (seed * 3).toFixed(2),
      revenueGrowth: (seed * 30 - 5).toFixed(2),
      earningsGrowth: (seed * 40 - 10).toFixed(2),
      dayRange: { low: basePrice - seed * volatility * 0.05, high: basePrice + seed * volatility * 0.05 },
      beta: (seed * 2 + 0.5).toFixed(2),
      industryPE: (seed * 30 + 10).toFixed(2)
    };
  }

  function generatePriceSeries(symbol, days = 50) {
    return generateTimeframeData(symbol, '1D').slice(-days);
  }

  function computeFullIndicators(prices) {
    const close = prices.map(p => p.price);
    const current = close[close.length-1];
    const sma20 = close.slice(-20).reduce((a,b)=>a+b,0)/20;
    const sma50 = close.length >= 50 ? close.slice(-50).reduce((a,b)=>a+b,0)/50 : sma20;
    
    let rsi = 50;
    if (close.length > 14) {
      const changes =[];
      for (let i=close.length-14; i<close.length; i++) changes.push(close[i]-close[i-1]);
      const gains = changes.filter(c=>c>0).reduce((a,b)=>a+b,0)/14;
      const losses = Math.abs(changes.filter(c=>c<0).reduce((a,b)=>a+b,0))/14;
      if (losses !== 0) rsi = 100 - (100/(1+(gains/losses)));
    }
    
    const ema12 = close.slice(-12).reduce((a,b)=>a+b,0)/12;
    const ema26 = close.slice(-26).reduce((a,b)=>a+b,0)/26;
    const macd = ema12 - ema26;
    const std20 = Math.sqrt(close.slice(-20).map(p => Math.pow(p-sma20,2)).reduce((a,b)=>a+b,0)/20);
    return { 
      current: +current.toFixed(2), sma20: +sma20.toFixed(2), sma50: +sma50.toFixed(2),
      rsi: +rsi.toFixed(1), macd: +macd.toFixed(2), upperBB: +(sma20 + 2*std20).toFixed(2), lowerBB: +(sma20 - 2*std20).toFixed(2)
    };
  }

  function getAllMarketData() {
    return stockDatabase.map(s => {
      const info = getStockInfo(s.symbol);
      const seed = s.symbol.split('').reduce((a,b)=>a+b.charCodeAt(0),0) % 100 / 100;
      const randomChange = (seed * 10 - 3);
      const price = (info.basePrice * (1 + randomChange/100)).toFixed(2);
      return { 
        symbol: s.symbol, name: info.name, sector: info.sector,
        price, change: parseFloat(randomChange.toFixed(2)), 
        volume: (seed*8+1).toFixed(2) + 'M', turnover: (seed*1200+150).toFixed(1) + 'M', 
        transactions: Math.floor(seed*18000+2500) 
      };
    });
  }

  function getTopGainers(count = 5) { return getAllMarketData().filter(s => s.change > 0).sort((a,b) => b.change - a.change).slice(0, count); }
  function getTopLosers(count = 5) { return getAllMarketData().filter(s => s.change < 0).sort((a,b) => a.change - b.change).slice(0, count); }

  function getBreakouts() {
    const all = getAllMarketData().map(s => {
      const details = generateStockDetails(s.symbol);
      const pctFromHigh = (details.ltp / details.week52High) * 100;
      const pctFromLow = (details.ltp / details.week52Low) * 100;
      return { ...s, pctFromHigh, pctFromLow };
    });
    return {
      highs: all.sort((a,b) => b.pctFromHigh - a.pctFromHigh).slice(0, 3),
      lows: all.sort((a,b) => a.pctFromLow - b.pctFromLow).slice(0, 3)
    };
  }

  // ============================================
  // UNIVERSAL AUTOCOMPLETE SYSTEM
  // ============================================
  function searchStocks(query) {
    const upper = query.toUpperCase();
    return stockDatabase.filter(stock => stock.symbol.toUpperCase().startsWith(upper) || stock.name.toUpperCase().includes(upper));
  }

  function createSuggestionsHTML(matches, query) {
    if (matches.length === 0) return `<div class="dropdown-header">🔍 No results</div>`;
    let html = `<div class="dropdown-header">🔍 Found ${matches.length} match(es)</div>`;
    matches.forEach(stock => {
      const hlSym = stock.symbol.replace(new RegExp(`(${query})`, 'gi'), '<span style="background:#fff3cd; padding:0.1rem 0.3rem; border-radius:0.3rem;">$1</span>');
      html += `<div class="suggestion-item" data-symbol="${stock.symbol}">
        <div class="sym-main"><span class="sym-symbol">${hlSym}</span><span class="sym-name">${stock.name}</span></div>
      </div>`;
    });
    return html;
  }

  function setupAutocomplete(inputElement, dropdownElement, onSelectCallback) {
    let debounceTimer;
    inputElement.addEventListener('focus', function() {
      const val = this.value.trim();
      if (val.length === 0) { dropdownElement.innerHTML = createSuggestionsHTML(stockDatabase, ''); dropdownElement.classList.add('active'); }
      else { dropdownElement.innerHTML = createSuggestionsHTML(searchStocks(val), val); dropdownElement.classList.add('active'); }
    });
    inputElement.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      const val = this.value.trim();
      debounceTimer = setTimeout(() => {
        if (val.length === 0) dropdownElement.classList.remove('active');
        else { dropdownElement.innerHTML = createSuggestionsHTML(searchStocks(val), val); dropdownElement.classList.add('active'); }
      }, 200);
    });
    dropdownElement.addEventListener('click', function(e) {
      const item = e.target.closest('.suggestion-item');
      if (item) {
        inputElement.value = item.dataset.symbol;
        dropdownElement.classList.remove('active');
        if (onSelectCallback) onSelectCallback(item.dataset.symbol);
      }
    });
    document.addEventListener('click', function(e) {
      if (!inputElement.parentElement.contains(e.target) && !dropdownElement.contains(e.target)) dropdownElement.classList.remove('active');
    });
  }

  function createDropdownFor(inputElement) {
    const existing = inputElement.parentElement.querySelector('.suggestions-dropdown');
    if (existing) existing.remove();
    const dropdown = document.createElement('div');
    dropdown.className = 'suggestions-dropdown';
    dropdown.style.position = 'absolute'; dropdown.style.top = '100%'; dropdown.style.left = '0';
    dropdown.style.width = '100%'; dropdown.style.zIndex = '999';
    if (inputElement.parentElement.style.position !== 'relative') inputElement.parentElement.style.position = 'relative';
    inputElement.parentElement.appendChild(dropdown);
    return dropdown;
  }

  function setupTabAutocomplete() {
    const tabSearchConfigs =[
      { inputId: 'depthSymbolInput', tabId: 'marketdepth' },
      { inputId: 'fundSymbolInput', tabId: 'fundamental' },
      { inputId: 'floorSymbolInput', tabId: 'floorsheet' },
      { inputId: 'forecastSymbolInput', tabId: 'forecast' },
      { inputId: 'aiSymbolInput', tabId: 'ai' },
      { inputId: 'techSymbolFilter', tabId: 'screener' },
      { inputId: 'cmp0', tabId: 'compare', callback: (sym) => { compareList[0] = sym; switchTab('compare'); } },
      { inputId: 'cmp1', tabId: 'compare', callback: (sym) => { compareList[1] = sym; switchTab('compare'); } },
      { inputId: 'cmp2', tabId: 'compare', callback: (sym) => { compareList[2] = sym; switchTab('compare'); } }
    ];
    tabSearchConfigs.forEach(config => {
      const input = document.getElementById(config.inputId);
      if (input) {
        const dropdown = createDropdownFor(input);
        setupAutocomplete(input, dropdown, (sym) => {
          if (config.callback) config.callback(sym);
          else {
            currentSymbol = sym;
            if (config.tabId === 'screener') {
              input.value = sym; document.getElementById('tabContent').innerHTML = renderScreener(); attachTabEvents('screener');
            } else switchTab(config.tabId);
          }
        });
      }
    });
  }

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  function renderMarketOverview() {
    const allStocks = getAllMarketData();
    const container = document.getElementById('stock-list');
    if (!container.classList.contains('market-grid')) container.classList.add('market-grid');
    container.innerHTML = allStocks.map(stock => {
      const isPos = stock.change >= 0;
      return `<div class="stock-card" data-symbol="${stock.symbol}" style="cursor:pointer;" onclick="showStockDetails('${stock.symbol}')">
        <div class="stock-info"><h4>${stock.symbol}</h4><p>${stock.name} · ${stock.sector}</p></div>
        <div class="stock-price"><div class="price">$${stock.price}</div><div class="change ${isPos?'positive':'negative'}">${isPos?'+':''}${stock.change}%</div></div>
      </div>`;
    }).join('');
  }

  function renderOverview() {
    const hours = new Date().getHours();
    const greeting = hours < 12 ? 'Good Morning' : hours < 18 ? 'Good Afternoon' : 'Good Evening';
    const mkt = marketIndices["S&P 500"];
    
    // Fetch all needed data
    const allData = getAllMarketData();
    const topGainers = getTopGainers(5);
    const topLosers = getTopLosers(5);
    const breakouts = getBreakouts();
    const topTurnover = [...allData].sort((a,b) => parseFloat(b.turnover) - parseFloat(a.turnover)).slice(0, 5);
    const topVolume = [...allData].sort((a,b) => parseFloat(b.volume) - parseFloat(a.volume)).slice(0, 5);
    const topTransactions =[...allData].sort((a,b) => b.transactions - a.transactions).slice(0, 5);

    const symbolOptions = `<option value="MARKET" ${currentChartSymbol==='MARKET'?'selected':''}>Overall Market (S&P 500)</option>` + 
      stockDatabase.map(s => `<option value="${s.symbol}" ${currentChartSymbol===s.symbol?'selected':''}>${s.symbol} - ${s.name}</option>`).join('');

    const timeframes =['1m','5m','15m','1H','1D','1W','1M','1Y'];
    const tfButtons = timeframes.map(tf => `<button class="tf-btn ${currentChartTf===tf?'active':''}" data-tf="${tf}">${tf}</button>`).join('');

    return `
      <div class="hero-banner">
        <div>
          <h2>${greeting}, Investor.</h2>
          <p>The S&P 500 is currently <strong class="${mkt.change>=0?'positive':'negative'}">${mkt.change>=0?'UP':'DOWN'} ${Math.abs(mkt.change)}%</strong> today.</p>
        </div>
        <button onclick="window.showWhales()" class="hero-btn"><i class="fas fa-crown"></i> Super Investors</button>
      </div>

      <div class="grid-2col" style="margin-bottom:1.5rem;">
        <div>
          <div class="card-title" style="justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span><i class="fas fa-chart-area"></i> Market Trend</span>
            <select id="overviewChartSymbol" style="padding: 0.3rem 0.6rem; border-radius: 0.5rem; border: 1px solid #d0d8e8; outline: none; font-size: 0.85rem; background: #f8fafd; font-weight: 600; color: #0a2540; cursor: pointer;">
              ${symbolOptions}
            </select>
          </div>
          <div class="timeframe-selector" style="display: flex; gap: 0.3rem; margin-bottom: 0.8rem; overflow-x: auto; padding-bottom: 0.2rem;">${tfButtons}</div>
          <div style="position: relative; height: 180px; width: 100%;"><canvas id="overviewMiniChart"></canvas></div>
        </div>
        
        <div style="display:flex; flex-direction:column;">
          <div class="card-title" style="margin-bottom: 0.5rem;"><i class="fas fa-newspaper"></i> Market Pulse</div>
          <div class="news-tabs">
            <button class="news-tab-btn ${activeNewsCategory==='global'?'active':''}" data-cat="global">Global</button>
            <button class="news-tab-btn ${activeNewsCategory==='corporate'?'active':''}" data-cat="corporate">Corporate</button>
            <button class="news-tab-btn ${activeNewsCategory==='economy'?'active':''}" data-cat="economy">Economy</button>
          </div>
          <div style="flex-grow:1; display:flex; flex-direction:column; justify-content:center;">
            ${categorizedNews[activeNewsCategory].map(n => `<div class="news-item"><i class="fas fa-circle" style="font-size:0.35rem; color:#2d6a9f; margin-top:0.4rem;"></i> ${n}</div>`).join('')}
          </div>
        </div>
      </div>

      <div class="card-title"><i class="fas fa-layer-group"></i> Smart Bundles</div>
      <div class="bundles-container" style="margin-bottom: 1.5rem;">
        ${smartBundles.map(b => `
          <div class="bundle-card" onclick="window.showBundle('${b.id}')">
            <i class="fas ${b.icon}"></i>
            <h4>${b.name}</h4>
            <p>${b.desc}</p>
          </div>
        `).join('')}
      </div>
      
      <!-- GRID 1: Gainers, Losers, Breakouts -->
      <div class="grid-3col" style="margin-bottom: 1.5rem;">
        <div>
          <div class="card-title"><i class="fas fa-arrow-up positive"></i> Top Gainers</div>
          ${topGainers.map(g => `<div class="list-row" style="cursor: pointer;" onclick="showStockDetails('${g.symbol}')"><span><strong>${g.symbol}</strong></span><span>$${g.price}</span><span class="positive">+${g.change}%</span></div>`).join('')}
          <button class="see-more-btn" onclick="window.showAllGainers()">See All Gainers <i class="fas fa-chevron-right"></i></button>
        </div>
        <div>
          <div class="card-title"><i class="fas fa-arrow-down negative"></i> Top Losers</div>
          ${topLosers.map(l => `<div class="list-row" style="cursor: pointer;" onclick="showStockDetails('${l.symbol}')"><span><strong>${l.symbol}</strong></span><span>$${l.price}</span><span class="negative">${l.change}%</span></div>`).join('')}
          <button class="see-more-btn" onclick="window.showAllLosers()">See All Losers <i class="fas fa-chevron-right"></i></button>
        </div>
        <div>
          <div class="card-title"><i class="fas fa-fire"></i> 52-Week Breakouts</div>
          ${breakouts.highs.map(h => `<div class="list-row" style="cursor: pointer;" onclick="showStockDetails('${h.symbol}')"><span><strong>${h.symbol}</strong></span><span style="font-size:0.8rem; color:#6b7a99;">Near High</span><span class="positive badge">🚀</span></div>`).join('')}
          ${breakouts.lows.map(l => `<div class="list-row" style="cursor: pointer;" onclick="showStockDetails('${l.symbol}')"><span><strong>${l.symbol}</strong></span><span style="font-size:0.8rem; color:#6b7a99;">Near Low</span><span class="negative badge" style="background:#ffeef0; color:#c4384a;">📉</span></div>`).join('')}
        </div>
      </div>

      <!-- GRID 2: Volume, Turnover, Market Indices -->
      <div class="grid-3col">
        <div>
          <div class="card-title"><i class="fas fa-chart-bar"></i> Top Volume</div>
          ${topVolume.map(t => `<div class="list-row" style="cursor: pointer;" onclick="showStockDetails('${t.symbol}')"><span><strong>${t.symbol}</strong></span><span>${t.volume}</span></div>`).join('')}
          <button class="see-more-btn" onclick="window.showAllVolume()">See All Volume <i class="fas fa-chevron-right"></i></button>
        </div>
        <div>
          <div class="card-title"><i class="fas fa-money-bill-wave"></i> Top Turnover</div>
          ${topTurnover.map(t => `<div class="list-row" style="cursor: pointer;" onclick="showStockDetails('${t.symbol}')"><span><strong>${t.symbol}</strong></span><span>${t.turnover}</span></div>`).join('')}
          <button class="see-more-btn" onclick="window.showAllTurnover()">See All Turnover <i class="fas fa-chevron-right"></i></button>
        </div>
        <div>
          <div class="card-title"><i class="fas fa-globe"></i> Market Indices</div>
          ${Object.entries(marketIndices).map(([name, data]) => `<div class="list-row"><span><strong>${name}</strong></span><span>${data.value.toLocaleString()}</span><span class="${data.change>=0?'positive':'negative'}">${data.change>=0?'+':''}${data.change}%</span></div>`).join('')}
          <button class="see-more-btn" onclick="window.showAllTransactions()" style="margin-top: 1rem;">View All Transactions <i class="fas fa-exchange-alt"></i></button>
        </div>
      </div>
    `;
  }

  function renderCharts() {
    const symbolOptions = `<option value="MARKET" ${currentChartSymbol==='MARKET'?'selected':''}>Overall Market (S&P 500)</option>` + 
      stockDatabase.map(s => `<option value="${s.symbol}" ${currentChartSymbol===s.symbol?'selected':''}>${s.symbol} - ${s.name}</option>`).join('');
    const timeframes =['1m','5m','15m','1H','1D','1W','1M','1Y'];
    const tfButtons = timeframes.map(tf => `<button class="tf-btn ${currentChartTf===tf?'active':''}" data-tf="${tf}">${tf}</button>`).join('');

    return `
      <div style="margin-bottom: 1.5rem; display: flex; flex-wrap: wrap; gap: 1rem; justify-content: space-between; align-items: center;">
        <h3 style="color: #0a2540; margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.3rem;">
          <i class="fas fa-chart-line"></i> Advanced Interactive Chart
        </h3>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
          <select id="fullChartSymbol" style="padding: 0.5rem 1rem; border-radius: 2rem; border: 1px solid #d0d8e8; outline: none; font-weight: 600; color: #0a2540; background: white; cursor: pointer;">
            ${symbolOptions}
          </select>
          <div class="timeframe-selector" id="fullChartTfSelector" style="display: flex; gap: 0.3rem; background: #f0f4fc; padding: 0.3rem; border-radius: 0.8rem;">
            ${tfButtons}
          </div>
        </div>
      </div>
      <div style="background: white; border-radius: 1rem; padding: 1.5rem; border: 1px solid #e0e7f5; box-shadow: 0 4px 15px rgba(0,0,0,0.02); height: 450px; position: relative;">
        <canvas id="fullChartCanvas"></canvas>
      </div>
    `;
  }

  // ⚖️ Peer Comparison Tab
  function renderCompare() {
    const cols = compareList.map((sym, index) => {
      let content = `<div style="text-align:center; padding: 2rem; color:#8a9bb5;">Search a stock</div>`;
      if (sym && getStockInfo(sym)) {
        const d = generateStockDetails(sym);
        const ind = computeFullIndicators(generatePriceSeries(sym, 30));
        const pColor = d.ltp >= d.prevClose ? 'positive' : 'negative';
        content = `
          <h2 style="text-align:center; margin-bottom: 0.2rem; color:#0a1f38;">${d.symbol}</h2>
          <p style="text-align:center; font-size:0.8rem; color:#6b7a99; margin-bottom: 1rem;">${d.companyName}</p>
          <div class="compare-stat"><span class="label">LTP</span><span class="val ${pColor}">$${d.ltp.toFixed(2)}</span></div>
          <div class="compare-stat"><span class="label">Market Cap</span><span class="val">$${(d.marketCap/1e9).toFixed(2)}B</span></div>
          <div class="compare-stat"><span class="label">P/E Ratio</span><span class="val">${d.peRatio}</span></div>
          <div class="compare-stat"><span class="label">P/B Ratio</span><span class="val">${d.pbRatio}</span></div>
          <div class="compare-stat"><span class="label">ROE</span><span class="val">${d.roe}%</span></div>
          <div class="compare-stat"><span class="label">Debt/Equity</span><span class="val">${d.debtToEquity}</span></div>
          <div class="compare-stat"><span class="label">Div Yield</span><span class="val">${d.dividendYield}%</span></div>
          <div class="compare-stat"><span class="label">RSI (14)</span><span class="val">${ind.rsi}</span></div>
          <div class="compare-stat"><span class="label">MACD</span><span class="val">${ind.macd}</span></div>
        `;
      }
      return `
        <div class="compare-col">
          <div class="inline-search" style="justify-content:center; margin-bottom: 1rem;">
            <input type="text" id="cmp${index}" placeholder="Add Symbol..." value="${sym}" autocomplete="off" style="width:100%; text-align:center;">
          </div>
          ${content}
        </div>
      `;
    }).join('');

    return `
      <div style="margin-bottom: 1.5rem;">
        <h3 style="color: #0a2540; margin-bottom: 0.3rem;"><i class="fas fa-balance-scale"></i> Peer Comparison</h3>
        <p style="color: #6b7a99; font-size: 0.9rem;">Analyze fundamentals and technicals side-by-side.</p>
      </div>
      <div class="compare-grid">${cols}</div>
    `;
  }

  // 🔎 Fundamental & Technical Screener
  function renderScreener() {
    const symFilter = document.getElementById('techSymbolFilter')?.value.toUpperCase() || '';
    const maxPe = parseFloat(document.getElementById('scrMaxPe')?.value) || 999;
    const minRoe = parseFloat(document.getElementById('scrMinRoe')?.value) || -999;
    const signalFilter = document.getElementById('scrSignal')?.value || 'All';

    let symbols = stockDatabase;
    if (symFilter) symbols = symbols.filter(s => s.symbol.includes(symFilter));

    const rows = symbols.map(s => {
      const d = generateStockDetails(s.symbol);
      const ind = computeFullIndicators(generatePriceSeries(s.symbol, 55));
      const sig = ind.rsi > 70 ? 'Overbought' : ind.rsi < 30 ? 'Oversold' : ind.macd > 0 ? 'Bullish' : 'Bearish';
      return { s, d, ind, sig };
    })
    .filter(x => parseFloat(x.d.peRatio) <= maxPe && parseFloat(x.d.roe) >= minRoe && (signalFilter === 'All' || x.sig === signalFilter))
    .slice(0, 50) 
    .map(x => `
      <div class="list-row" style="cursor: pointer;" onclick="showStockDetails('${x.s.symbol}')">
        <span><strong>${x.s.symbol}</strong></span>
        <span>$${x.ind.current}</span>
        <span>${x.d.peRatio}</span>
        <span>${x.d.roe}%</span>
        <span>${x.ind.rsi}</span>
        <span class="badge">${x.sig}</span>
      </div>
    `).join('');

    return `
      <div class="card-title"><i class="fas fa-search-dollar"></i> Fundamental & Technical Screener</div>
      <div class="screener-filters glass" style="display:flex; gap:0.5rem; flex-wrap:wrap; padding: 1rem; margin-bottom: 1rem; border-radius: 1rem;">
        <div style="position:relative;"><input type="text" id="techSymbolFilter" placeholder="Symbol" value="${symFilter}" style="width:120px;" autocomplete="off"></div>
        <input type="number" id="scrMaxPe" placeholder="Max P/E" value="${maxPe===999?'':maxPe}" style="width:120px;">
        <input type="number" id="scrMinRoe" placeholder="Min ROE %" value="${minRoe===-999?'':minRoe}" style="width:120px;">
        <select id="scrSignal" style="padding:0.6rem 1rem; border-radius:2rem; border:1px solid #d0d8e8; outline:none;">
          <option value="All" ${signalFilter==='All'?'selected':''}>All Signals</option>
          <option value="Bullish" ${signalFilter==='Bullish'?'selected':''}>Bullish</option>
          <option value="Bearish" ${signalFilter==='Bearish'?'selected':''}>Bearish</option>
          <option value="Overbought" ${signalFilter==='Overbought'?'selected':''}>Overbought</option>
          <option value="Oversold" ${signalFilter==='Oversold'?'selected':''}>Oversold</option>
        </select>
        <button id="techFilterBtn" class="hero-btn" style="padding:0.6rem 1.5rem; border-radius:2rem; margin:0;"><i class="fas fa-filter"></i> Apply Filters</button>
      </div>
      <div class="list-row header-row">
        <span>Symbol</span><span>Price</span><span>P/E</span><span>ROE</span><span>RSI</span><span>Signal</span>
      </div>
      ${rows || '<div style="text-align:center; padding:2rem; color:#8a9bb5;">No stocks match these criteria.</div>'}
    `;
  }

  function renderMarketDepth(symbol = currentSymbol) {
    const info = getStockInfo(symbol);
    const stockData = generateStockDetails(symbol);
    const bids = [], asks =[];
    for (let i=0; i<7; i++) {
      bids.push({ price: (info.basePrice - 0.22*i - Math.random()*0.5).toFixed(2), volume: Math.floor(Math.random()*900+150) });
      asks.push({ price: (info.basePrice + 0.2*i + Math.random()*0.45).toFixed(2), volume: Math.floor(Math.random()*800+130) });
    }
    return `
      <div style="margin-bottom: 1rem;">
        <h3 style="color: #0a2540; margin-bottom: 0.3rem;"><i class="fas fa-chart-bar"></i> ${symbol} · ${info.name}</h3>
        <p style="color: #6b7a99; font-size: 0.9rem;">LTP: $${stockData.ltp.toFixed(2)} | Vol: ${(stockData.volume/1e6).toFixed(2)}M | MCap: $${(stockData.marketCap/1e9).toFixed(2)}B</p>
      </div>
      <div class="inline-search" style="position: relative;">
        <input type="text" id="depthSymbolInput" placeholder="Search by symbol..." value="${symbol}" autocomplete="off"><button id="depthSearchBtn"><i class="fas fa-search"></i> Load</button>
      </div>
      <div class="grid-2col">
        <div><div class="card-title"><i class="fas fa-arrow-down positive"></i> Bid (Buyers)</div>${bids.map(b => `<div class="depth-row"><span class="positive">$${b.price}</span><span>${b.volume} shares</span></div>`).join('')}</div>
        <div><div class="card-title"><i class="fas fa-arrow-up negative"></i> Ask (Sellers)</div>${asks.map(a => `<div class="depth-row"><span class="negative">$${a.price}</span><span>${a.volume} shares</span></div>`).join('')}</div>
      </div>
    `;
  }

  function renderFundamental(symbol = currentSymbol) {
    const info = getStockInfo(symbol);
    const stockData = generateStockDetails(symbol);
    return `
      <div style="margin-bottom: 1rem;"><h3 style="color: #0a2540;"><i class="fas fa-coins"></i> ${symbol} · ${info.name}</h3></div>
      <div class="inline-search" style="position: relative;">
        <input type="text" id="fundSymbolInput" placeholder="Search..." value="${symbol}" autocomplete="off"><button id="fundSearchBtn"><i class="fas fa-search"></i> Load</button>
      </div>
      <div class="card-title"><i class="fas fa-file-invoice"></i> Fundamental Analysis</div>
      <div class="indicator-grid">
        <div><strong>LTP:</strong> $${stockData.ltp.toFixed(2)}</div><div><strong>Market Cap:</strong> $${(stockData.marketCap/1e9).toFixed(2)}B</div>
        <div><strong>P/E Ratio:</strong> ${stockData.peRatio}</div><div><strong>P/B Ratio:</strong> ${stockData.pbRatio}</div>
        <div><strong>EPS:</strong> $${stockData.eps}</div><div><strong>Book Value:</strong> $${stockData.bookValue}</div>
        <div><strong>ROE:</strong> ${stockData.roe}%</div><div><strong>ROA:</strong> ${stockData.roa}%</div>
        <div><strong>Debt/Equity:</strong> ${stockData.debtToEquity}</div><div><strong>Dividend Yield:</strong> ${stockData.dividendYield}%</div>
      </div>
    `;
  }

  function renderFloorsheet(symbol = currentSymbol) {
    const info = getStockInfo(symbol);
    const brokers =["GOLDMAN", "MORGAN", "JPMS", "CITI", "BOFA"];
    const trans =[];
    for (let i=0; i<9; i++) trans.push({
      time: `${10+Math.floor(Math.random()*5)}:${Math.floor(Math.random()*60).toString().padStart(2,'0')}`,
      price: (info.basePrice + (Math.random()-0.5)*3.2).toFixed(2),
      volume: Math.floor(Math.random()*2500+150),
      buyer: brokers[Math.floor(Math.random()*brokers.length)],
      seller: brokers[Math.floor(Math.random()*brokers.length)]
    });
    return `
      <div style="margin-bottom: 1rem;"><h3 style="color: #0a2540;"><i class="fas fa-receipt"></i> ${symbol} · ${info.name}</h3></div>
      <div class="inline-search" style="position: relative;">
        <input type="text" id="floorSymbolInput" placeholder="Search..." value="${symbol}" autocomplete="off"><button id="floorSearchBtn"><i class="fas fa-search"></i> Load</button>
      </div>
      <div class="card-title"><i class="fas fa-exchange-alt"></i> Floorsheet Transactions</div>
      <div class="floorsheet-row header-row"><span>Time</span><span>Price</span><span>Vol</span><span>Buyer</span><span>Seller</span></div>
      ${trans.map(t => `<div class="floorsheet-row"><span>${t.time}</span><span>$${t.price}</span><span>${t.volume}</span><span class="broker-tag">${t.buyer}</span><span class="broker-tag">${t.seller}</span></div>`).join('')}
    `;
  }

  function renderForecast(symbol = currentSymbol) {
    const info = getStockInfo(symbol);
    const prices = generatePriceSeries(symbol, 40);
    const last = prices[prices.length-1].price;
    return `
      <div style="margin-bottom: 1rem;"><h3 style="color: #0a2540;"><i class="fas fa-chart-pie"></i> ${symbol} · ${info.name}</h3></div>
      <div class="inline-search" style="position: relative;">
        <input type="text" id="forecastSymbolInput" placeholder="Search..." value="${symbol}" autocomplete="off"><button id="forecastSearchBtn"><i class="fas fa-search"></i> Load</button>
      </div>
      <div class="grid-2col">
        <div><div style="position:relative; height:200px; width:100%;"><canvas id="forecastChart"></canvas></div></div>
        <div><h3>📊 30-Day Forecast</h3><p>High: <strong>$${(last*1.07).toFixed(2)}</strong></p><p>Low: <strong>$${(last*0.93).toFixed(2)}</strong></p><p>Confidence: 74%</p></div>
      </div>
    `;
  }

  function renderAIAnalysis(symbol = currentSymbol) {
    const ind = computeFullIndicators(generatePriceSeries(symbol, 60));
    const info = getStockInfo(symbol);
    const sentimentScore = (ind.rsi/100*0.4 + (ind.macd>0?0.3:0) + (ind.current>ind.sma20?0.3:0))*100;
    return `
      <div style="margin-bottom: 1rem;"><h3 style="color: #0a2540;"><i class="fas fa-brain"></i> ${symbol} · ${info.name}</h3></div>
      <div class="inline-search" style="position: relative;">
        <input type="text" id="aiSymbolInput" placeholder="Search..." value="${symbol}" autocomplete="off"><button id="aiSearchBtn"><i class="fas fa-search"></i> Load</button>
      </div>
      <div class="ai-box">
        <h3><i class="fas fa-robot"></i> Advanced AI Analysis</h3>
        <div class="grid-2col" style="margin-top:1rem;">
          <div><p><strong>🧠 Sentiment Score:</strong> ${sentimentScore.toFixed(1)}/100</p><p><strong>📈 Trend:</strong> ${ind.current > ind.sma20 ? 'Bullish' : 'Bearish'}</p><p><strong>📊 RSI:</strong> ${ind.rsi}</p></div>
          <div><p><strong>🎯 Support:</strong> $${ind.lowerBB}</p><p><strong>🎯 Resistance:</strong> $${ind.upperBB}</p><p><strong>💡 Recommendation:</strong> ${sentimentScore>65?'Strong Buy': sentimentScore>45?'Buy on dips': sentimentScore>30?'Hold':'Sell'}</p></div>
        </div>
      </div>
    `;
  }

  // ============================================
  // TAB SWITCHING & MODALS
  // ============================================
  window.switchTab = function(tabId) {
    activeTab = tabId;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[data-tab="${tabId}"]`)?.classList.add('active');
    const container = document.getElementById('tabContent');
    let html = '';
    
    switch(tabId) {
      case 'overview': html = renderOverview(); break;
      case 'charts': html = renderCharts(); break;
      case 'compare': html = renderCompare(); break;
      case 'screener': html = renderScreener(); break;
      case 'marketdepth': html = renderMarketDepth(); break;
      case 'fundamental': html = renderFundamental(); break;
      case 'floorsheet': html = renderFloorsheet(); break;
      case 'forecast': html = renderForecast(); break;
      case 'ai': html = renderAIAnalysis(); break;
      default: html = renderOverview();
    }
    
    container.innerHTML = html;
    attachTabEvents(tabId);
    setTimeout(setupTabAutocomplete, 50);
    
    if (tabId === 'overview') setTimeout(drawOverviewMiniChart, 100);
    if (tabId === 'charts') setTimeout(drawFullChart, 100);
    if (tabId === 'forecast') setTimeout(drawForecastChart, 100);
  }

  function attachTabEvents(tabId) {
    const bindSearch = (inputId, btnId) => {
      document.getElementById(btnId)?.addEventListener('click', () => {
        const sym = document.getElementById(inputId)?.value.trim().toUpperCase();
        if (sym) { currentSymbol = sym; currentChartSymbol = sym; switchTab(tabId); }
      });
    };
    
    if (tabId === 'overview') {
      document.getElementById('overviewChartSymbol')?.addEventListener('change', (e) => { currentChartSymbol = e.target.value; drawOverviewMiniChart(); });
      document.querySelectorAll('.timeframe-selector .tf-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          currentChartTf = e.target.dataset.tf;
          e.target.parentElement.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active'); drawOverviewMiniChart();
        });
      });
      document.querySelectorAll('.news-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          activeNewsCategory = e.target.dataset.cat;
          switchTab('overview');
        });
      });
    }

    if (tabId === 'charts') {
      document.getElementById('fullChartSymbol')?.addEventListener('change', (e) => { currentChartSymbol = e.target.value; drawFullChart(); });
      document.querySelectorAll('#fullChartTfSelector .tf-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          currentChartTf = e.target.dataset.tf;
          e.target.parentElement.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active'); drawFullChart();
        });
      });
    }

    if (tabId === 'screener') {
      document.getElementById('techFilterBtn')?.addEventListener('click', () => { switchTab('screener'); });
    }

    if (tabId === 'marketdepth') bindSearch('depthSymbolInput', 'depthSearchBtn');
    if (tabId === 'fundamental') bindSearch('fundSymbolInput', 'fundSearchBtn');
    if (tabId === 'floorsheet') bindSearch('floorSymbolInput', 'floorSearchBtn');
    if (tabId === 'forecast') bindSearch('forecastSymbolInput', 'forecastSearchBtn');
    if (tabId === 'ai') bindSearch('aiSymbolInput', 'aiSearchBtn');
  }

  function drawOverviewMiniChart() {
    const canvas = document.getElementById('overviewMiniChart');
    if (!canvas) return;
    const data = generateTimeframeData(currentChartSymbol, currentChartTf);
    if (overviewChartInst) overviewChartInst.destroy();
    const isPositive = data[data.length-1].price >= data[0].price;
    const lineColor = isPositive ? '#0f7b4e' : '#c4384a';
    const bgColor = isPositive ? 'rgba(15,123,78,0.08)' : 'rgba(196,56,74,0.08)';

    overviewChartInst = new Chart(canvas, {
      type: 'line', data: { labels: data.map(d=>d.date), datasets:[{ data: data.map(d=>d.price), borderColor: lineColor, backgroundColor: bgColor, fill: true, tension: 0.2, pointRadius: currentChartTf.includes('m') ? 0 : 1, borderWidth: 1.5 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins:{legend:{display:false}}, scales:{ x:{display:true, ticks:{maxTicksLimit:5, font:{size:9}}, grid:{display:false}}, y:{display:true, ticks:{font:{size:9}}, position: 'right'} } }
    });
  }

  function drawFullChart() {
    const canvas = document.getElementById('fullChartCanvas');
    if (!canvas) return;
    const data = generateTimeframeData(currentChartSymbol, currentChartTf);
    if (fullChartInst) fullChartInst.destroy();
    const isPositive = data[data.length-1].price >= data[0].price;
    const lineColor = isPositive ? '#0f7b4e' : '#c4384a';
    const bgColor = isPositive ? 'rgba(15,123,78,0.1)' : 'rgba(196,56,74,0.1)';

    fullChartInst = new Chart(canvas, {
      type: 'line', data: { labels: data.map(d=>d.date), datasets:[{ label: currentChartSymbol, data: data.map(d=>d.price), borderColor: lineColor, backgroundColor: bgColor, fill: true, tension: 0.1, pointRadius: currentChartTf.includes('m') ? 0 : 3, borderWidth: 2, pointBackgroundColor: 'white', pointBorderColor: lineColor }] },
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins:{ legend:{display:false}, tooltip: { backgroundColor: '#0a2540', padding: 10, callbacks: { label: function(ctx) { return '$' + ctx.parsed.y.toFixed(2); } } } }, scales:{ x:{display:true, grid:{display:false}}, y:{display:true, position: 'right', grid:{color:'#f0f4f8'}} } }
    });
  }

  function drawForecastChart() {
    const canvas = document.getElementById('forecastChart');
    if (!canvas) return;
    const hist = generatePriceSeries(currentSymbol, 25);
    const last = hist[hist.length-1].price;
    const future =[last, last*1.012, last*1.025, last*1.018, last*1.03];
    new Chart(canvas, {
      type: 'line', data: { labels:['D-2','D-1','Now','D+1','D+2'], datasets:[{ data:[...hist.slice(-3).map(d=>d.price), ...future.slice(0,2)], borderColor: '#2d6a9f', tension: 0.2, pointRadius: 3 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins:{legend:{display:false}} }
    });
  }

  // MODALS
  window.showBundle = function(id) {
    const bundle = smartBundles.find(b => b.id === id);
    const data = bundle.stocks.map(sym => {
      const info = getStockInfo(sym);
      return { symbol: sym, name: info.name, price: info.basePrice.toFixed(2), change: (Math.random() * 4 - 1.5).toFixed(2), volume: '-', turnover: '-', transactions: '-' };
    });
    showModal(`🧺 ${bundle.name}`, data,['Symbol', 'Name', 'Price', 'Change%']);
  }

  window.showWhales = function() {
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    let html = `
      <button class="modal-close" onclick="document.getElementById('modalOverlay').classList.remove('active')"><i class="fas fa-times"></i></button>
      <h2 style="margin-bottom:1.5rem;"><i class="fas fa-crown"></i> Super Investors Portfolio Tracker</h2>
      <div class="grid-3col">
        ${whalePortfolios.map(w => `
          <div style="background:#f8fafd; padding:1.5rem; border-radius:1rem; border:1px solid #e0e7f5;">
            <div style="font-size:2rem; margin-bottom:0.5rem;">${w.icon}</div>
            <h4 style="margin-bottom:1rem; color:#0a1f38;">${w.name}</h4>
            ${w.top.map(sym => `<div class="list-row" style="background:white; margin-bottom:0.3rem; cursor:pointer;" onclick="showStockDetails('${sym}')"><span><strong>${sym}</strong></span><span><i class="fas fa-chevron-right" style="color:#d0d8e8; font-size:0.7rem;"></i></span></div>`).join('')}
          </div>
        `).join('')}
      </div>
    `;
    content.innerHTML = html;
    overlay.classList.add('active');
  }

  function showModal(title, data, columns) {
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    let html = `<button class="modal-close" onclick="document.getElementById('modalOverlay').classList.remove('active')"><i class="fas fa-times"></i></button>
      <h2 style="margin-bottom:1rem;">${title}</h2><div class="list-row header-row">${columns.map(c => `<span>${c}</span>`).join('')}</div>`;
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
  }

  window.showStockDetails = function(symbol) {
    const stockData = generateStockDetails(symbol);
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    const changePercent = ((stockData.ltp - stockData.prevClose) / stockData.prevClose * 100).toFixed(2);
    const isPositive = parseFloat(changePercent) >= 0;
    
    content.innerHTML = `
      <button class="modal-close" onclick="document.getElementById('modalOverlay').classList.remove('active')"><i class="fas fa-times"></i></button>
      <div style="margin-bottom: 1.5rem;"><h2 style="margin-bottom: 0.3rem;">${stockData.symbol} · ${stockData.companyName}</h2><p style="color: #6b7a99; margin: 0;">${stockData.exchange} · ${stockData.sector}</p></div>
      <div style="display: flex; align-items: baseline; gap: 1rem; margin-bottom: 1.5rem; padding: 1rem; background: #f8fafd; border-radius: 1rem;">
        <span style="font-size: 2rem; font-weight: 700; color: #0a1f38;">$${stockData.ltp.toFixed(2)}</span>
        <span class="${isPositive ? 'positive' : 'negative'}" style="font-size: 1.2rem;">${isPositive ? '+' : ''}${changePercent}%</span>
      </div>
      <div class="grid-2col" style="margin-bottom: 1rem;">
        <div><h4 style="margin-bottom: 0.8rem; color: #0a2540;">📊 Price Info</h4><div class="detail-row"><span>Day Range</span><span><strong>$${stockData.dayRange.low.toFixed(2)} - $${stockData.dayRange.high.toFixed(2)}</strong></span></div><div class="detail-row"><span>52W High</span><span><strong>$${stockData.week52High.toFixed(2)}</strong></span></div></div>
        <div><h4 style="margin-bottom: 0.8rem; color: #0a2540;">💰 Market Info</h4><div class="detail-row"><span>Market Cap</span><span><strong>$${(stockData.marketCap/1e9).toFixed(2)}B</strong></span></div><div class="detail-row"><span>P/E Ratio</span><span><strong>${stockData.peRatio}</strong></span></div></div>
      </div>
      <div style="text-align: center; margin-top: 1rem;">
        <button class="hero-btn" onclick="document.getElementById('globalSymbolInput').value='${symbol}'; currentSymbol='${symbol}'; currentChartSymbol='${symbol}'; switchTab('overview'); document.getElementById('modalOverlay').classList.remove('active');">
          <i class="fas fa-chart-line"></i> Analyze Stock
        </button>
      </div>
    `;
    overlay.classList.add('active');
  }

  // RE-ADDED: Global Functions Mapping (See All Modals)
  window.showAllGainers = () => showModal('📈 All Gainers', getAllMarketData().filter(s=>s.change>0).sort((a,b)=>b.change-a.change),['Symbol','Name','Price','Change%']);
  window.showAllLosers = () => showModal('📉 All Losers', getAllMarketData().filter(s=>s.change<0).sort((a,b)=>a.change-b.change),['Symbol','Name','Price','Change%']);
  window.showAllTurnover = () => showModal('🔥 Turnover', getAllMarketData().sort((a,b)=>parseFloat(b.turnover)-parseFloat(a.turnover)),['Symbol','Name','Turnover','Volume']);
  window.showAllVolume = () => showModal('📊 Volume', getAllMarketData().sort((a,b)=>parseFloat(b.volume)-parseFloat(a.volume)),['Symbol','Name','Volume','Turnover']);
  window.showAllTransactions = () => showModal('💱 Transactions', getAllMarketData().sort((a,b)=>b.transactions-a.transactions),['Symbol','Name','Transactions','Volume']);
  
  // Global search button handler
  document.getElementById('globalAnalyzeBtn').addEventListener('click', ()=>{
    const val = document.getElementById('globalSymbolInput').value.trim().toUpperCase();
    if (val) {
      const match = stockDatabase.find(s => s.symbol === val) || stockDatabase.find(s => s.name.toUpperCase().includes(val));
      if (match) {
        currentSymbol = match.symbol; currentChartSymbol = match.symbol;
        document.getElementById('globalSymbolInput').value = match.symbol;
        switchTab(activeTab);
      }
    }
  });

  // Tab switching handler
  document.getElementById('tabBar').addEventListener('click', (e)=>{
    if (e.target.classList.contains('tab')) switchTab(e.target.dataset.tab);
  });

  // Initialize
  window.addEventListener('load', ()=>{
    setupTabAutocomplete(); 
    switchTab('overview');
    renderMarketOverview();
  });
})();
