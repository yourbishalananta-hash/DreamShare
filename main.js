(function() {
  // Current state
  let currentSymbol = "AAPL";
  let activeTab = "overview";
  let currentStockData = null;

  const marketIndices = {
    "S&P 500": { value: 5120.45, change: 0.62 },
    "NASDAQ": { value: 18250.30, change: 1.15 },
    "DJIA": { value: 38940.12, change: -0.24 },
    "VIX": { value: 15.80, change: -3.42 },
    "Russell 2000": { value: 2085.67, change: 0.85 }
  };

  // Generate comprehensive stock data
  function generateStockDetails(symbol) {
    const info = getStockInfo(symbol);
    const basePrice = info.basePrice;
    const volatility = basePrice * 0.15;
    
    return {
      symbol: symbol,
      companyName: info.name,
      sector: info.sector,
      exchange: info.exchange,
      country: info.country,
      
      // Price Information
      ltp: basePrice + (Math.random() - 0.5) * volatility * 0.1,
      open: basePrice + (Math.random() - 0.5) * volatility * 0.08,
      high: basePrice + Math.random() * volatility * 0.05,
      low: basePrice - Math.random() * volatility * 0.05,
      prevClose: basePrice + (Math.random() - 0.5) * volatility * 0.08,
      
      // 52 Week Range
      week52High: basePrice * (1 + Math.random() * 0.3),
      week52Low: basePrice * (1 - Math.random() * 0.25),
      
      // Volume & Turnover
      volume: Math.floor(Math.random() * 5000000 + 500000),
      avgVolume: Math.floor(Math.random() * 4000000 + 400000),
      turnover: basePrice * Math.floor(Math.random() * 5000000 + 500000),
      
      // Market Information
      marketCap: (basePrice * Math.floor(Math.random() * 5000000000 + 1000000000)),
      sharesOutstanding: Math.floor(Math.random() * 5000000000 + 500000000),
      freeFloat: Math.floor(Math.random() * 3000000000 + 300000000),
      
      // Fundamental Ratios
      peRatio: (basePrice / (Math.random() * 10 + 2)).toFixed(2),
      pbRatio: (basePrice / (Math.random() * 50 + 10)).toFixed(2),
      eps: (basePrice / (Math.random() * 30 + 5)).toFixed(2),
      bookValue: (basePrice / (Math.random() * 5 + 1)).toFixed(2),
      roe: (Math.random() * 30 + 5).toFixed(2),
      roa: (Math.random() * 15 + 2).toFixed(2),
      debtToEquity: (Math.random() * 2).toFixed(2),
      dividendYield: (Math.random() * 3).toFixed(2),
      
      // Growth Metrics
      revenueGrowth: (Math.random() * 30 - 5).toFixed(2),
      earningsGrowth: (Math.random() * 40 - 10).toFixed(2),
      
      // Trading Information
      dayRange: {
        low: basePrice - Math.random() * volatility * 0.05,
        high: basePrice + Math.random() * volatility * 0.05
      },
      
      // Additional Info
      beta: (Math.random() * 2 + 0.5).toFixed(2),
      faceValue: 10,
      industryPE: (Math.random() * 30 + 10).toFixed(2),
      
      // Corporate Actions
      lastDividend: (Math.random() * 5).toFixed(2),
      exDividendDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
  }

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

  function getAllMarketData() {
    const allData = stockDatabase.map(s => {
      const info = getStockInfo(s.symbol);
      const randomChange = (Math.random() * 10 - 3);
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

  function getTopGainers(count = 5) {
    const allData = getAllMarketData();
    return allData
      .filter(stock => stock.change > 0)
      .sort((a, b) => b.change - a.change)
      .slice(0, count);
  }

  function getTopLosers(count = 5) {
    const allData = getAllMarketData();
    return allData
      .filter(stock => stock.change < 0)
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

  // ============================================
  // STOCK DETAILS MODAL
  // ============================================
  function showStockDetails(symbol) {
    const stockData = generateStockDetails(symbol);
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    
    const changePercent = ((stockData.ltp - stockData.prevClose) / stockData.prevClose * 100).toFixed(2);
    const isPositive = parseFloat(changePercent) >= 0;
    
    let html = `
      <button class="modal-close" onclick="document.getElementById('modalOverlay').classList.remove('active')">
        <i class="fas fa-times"></i>
      </button>
      
      <div style="margin-bottom: 1.5rem;">
        <h2 style="margin-bottom: 0.3rem;">${stockData.symbol} · ${stockData.companyName}</h2>
        <p style="color: #6b7a99; margin: 0;">${stockData.exchange} · ${stockData.sector} · ${stockData.country}</p>
      </div>
      
      <div style="display: flex; align-items: baseline; gap: 1rem; margin-bottom: 1.5rem; padding: 1rem; background: #f8fafd; border-radius: 1rem;">
        <span style="font-size: 2rem; font-weight: 700; color: #0a1f38;">$${stockData.ltp.toFixed(2)}</span>
        <span class="${isPositive ? 'positive' : 'negative'}" style="font-size: 1.2rem;">
          ${isPositive ? '+' : ''}${changePercent}%
        </span>
      </div>
      
      <div class="grid-2col" style="margin-bottom: 1rem;">
        <div>
          <h4 style="margin-bottom: 0.8rem; color: #0a2540;">📊 Price Information</h4>
          <div class="detail-row"><span>Open</span><span><strong>$${stockData.open.toFixed(2)}</strong></span></div>
          <div class="detail-row"><span>High</span><span><strong>$${stockData.high.toFixed(2)}</strong></span></div>
          <div class="detail-row"><span>Low</span><span><strong>$${stockData.low.toFixed(2)}</strong></span></div>
          <div class="detail-row"><span>Prev Close</span><span><strong>$${stockData.prevClose.toFixed(2)}</strong></span></div>
          <div class="detail-row"><span>Day Range</span><span><strong>$${stockData.dayRange.low.toFixed(2)} - $${stockData.dayRange.high.toFixed(2)}</strong></span></div>
          <div class="detail-row"><span>52 Week High</span><span><strong>$${stockData.week52High.toFixed(2)}</strong></span></div>
          <div class="detail-row"><span>52 Week Low</span><span><strong>$${stockData.week52Low.toFixed(2)}</strong></span></div>
        </div>
        
        <div>
          <h4 style="margin-bottom: 0.8rem; color: #0a2540;">💰 Market Information</h4>
          <div class="detail-row"><span>Market Cap</span><span><strong>$${(stockData.marketCap / 1e9).toFixed(2)}B</strong></span></div>
          <div class="detail-row"><span>Shares Outstanding</span><span><strong>${(stockData.sharesOutstanding / 1e9).toFixed(2)}B</strong></span></div>
          <div class="detail-row"><span>Free Float</span><span><strong>${(stockData.freeFloat / 1e9).toFixed(2)}B</strong></span></div>
          <div class="detail-row"><span>Volume</span><span><strong>${(stockData.volume / 1e6).toFixed(2)}M</strong></span></div>
          <div class="detail-row"><span>Avg Volume</span><span><strong>${(stockData.avgVolume / 1e6).toFixed(2)}M</strong></span></div>
          <div class="detail-row"><span>Turnover</span><span><strong>$${(stockData.turnover / 1e9).toFixed(2)}B</strong></span></div>
          <div class="detail-row"><span>Beta</span><span><strong>${stockData.beta}</strong></span></div>
        </div>
      </div>
      
      <div class="grid-2col" style="margin-bottom: 1rem;">
        <div>
          <h4 style="margin-bottom: 0.8rem; color: #0a2540;">📈 Fundamental Ratios</h4>
          <div class="detail-row"><span>P/E Ratio</span><span><strong>${stockData.peRatio}</strong></span></div>
          <div class="detail-row"><span>P/B Ratio</span><span><strong>${stockData.pbRatio}</strong></span></div>
          <div class="detail-row"><span>EPS</span><span><strong>$${stockData.eps}</strong></span></div>
          <div class="detail-row"><span>Book Value</span><span><strong>$${stockData.bookValue}</strong></span></div>
          <div class="detail-row"><span>ROE</span><span><strong>${stockData.roe}%</strong></span></div>
          <div class="detail-row"><span>ROA</span><span><strong>${stockData.roa}%</strong></span></div>
          <div class="detail-row"><span>Debt to Equity</span><span><strong>${stockData.debtToEquity}</strong></span></div>
          <div class="detail-row"><span>Dividend Yield</span><span><strong>${stockData.dividendYield}%</strong></span></div>
          <div class="detail-row"><span>Face Value</span><span><strong>$${stockData.faceValue}</strong></span></div>
          <div class="detail-row"><span>Industry P/E</span><span><strong>${stockData.industryPE}</strong></span></div>
        </div>
        
        <div>
          <h4 style="margin-bottom: 0.8rem; color: #0a2540;">📊 Growth & Returns</h4>
          <div class="detail-row"><span>Revenue Growth</span><span><strong>${stockData.revenueGrowth}%</strong></span></div>
          <div class="detail-row"><span>Earnings Growth</span><span><strong>${stockData.earningsGrowth}%</strong></span></div>
          <div class="detail-row"><span>Last Dividend</span><span><strong>$${stockData.lastDividend}</strong></span></div>
          <div class="detail-row"><span>Ex-Dividend Date</span><span><strong>${stockData.exDividendDate}</strong></span></div>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 1rem;">
        <button class="see-more-btn" onclick="document.getElementById('globalSymbolInput').value='${symbol}'; currentSymbol='${symbol}'; switchTab('overview'); document.getElementById('modalOverlay').classList.remove('active');">
          <i class="fas fa-chart-line"></i> Analyze This Stock
        </button>
      </div>
    `;
    
    content.innerHTML = html;
    overlay.classList.add('active');
    
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  }

  // ============================================
  // UNIVERSAL AUTOCOMPLETE SYSTEM
  // ============================================
  
  function searchStocks(query) {
    const upperQuery = query.toUpperCase();
    return stockDatabase.filter(stock => 
      stock.symbol.toUpperCase().startsWith(upperQuery) || 
      stock.name.toUpperCase().includes(upperQuery)
    );
  }

  function createSuggestionsHTML(matches, query) {
    if (matches.length === 0) {
      return `
        <div class="dropdown-header">🔍 No results for "${query}"</div>
        <div class="no-results">
          <i class="fas fa-search" style="font-size:1.5rem; display:block; margin-bottom:0.5rem;"></i>
          Try different keywords or symbols
        </div>
      `;
    }
    
    let html = `<div class="dropdown-header">🔍 Found ${matches.length} match(es) for "${query}"</div>`;
    
    matches.forEach(stock => {
      const priceChange = (Math.random() * 4 - 2).toFixed(2);
      const isPositive = parseFloat(priceChange) >= 0;
      
      const highlightedSym = stock.symbol.replace(
        new RegExp(`(${query})`, 'gi'),
        '<span style="background:#fff3cd; padding:0.1rem 0.3rem; border-radius:0.3rem;">\$1</span>'
      );
      
      const highlightedName = stock.name.replace(
        new RegExp(`(\${query})`, 'gi'),
        '<span style="background:#fff3cd; padding:0.1rem 0.3rem; border-radius:0.3rem;">\$1</span>'
      );
      
      html += `
        <div class="suggestion-item" data-symbol="\${stock.symbol}">
          <div class="sym-main">
            <span class="sym-symbol">${highlightedSym}</span>
            <span class="sym-name">${highlightedName} · <span class="sym-sector">${stock.sector}</span></span>
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
    
    return html;
  }

  function setupAutocomplete(inputElement, dropdownElement, onSelectCallback) {
    let debounceTimer;
    
    inputElement.addEventListener('focus', function() {
      const val = this.value.trim();
      if (val.length === 0) {
        showAllStocks(dropdownElement);
      } else {
        updateSuggestions(val, dropdownElement);
      }
    });
    
    inputElement.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      const val = this.value.trim();
      
      debounceTimer = setTimeout(() => {
        if (val.length === 0) {
          showAllStocks(dropdownElement);
        } else {
          updateSuggestions(val, dropdownElement);
        }
      }, 200);
    });
    
    dropdownElement.addEventListener('click', function(e) {
      const item = e.target.closest('.suggestion-item');
      if (item) {
        const sym = item.dataset.symbol;
        inputElement.value = sym;
        dropdownElement.classList.remove('active');
        if (onSelectCallback) onSelectCallback(sym);
      }
    });
    
    document.addEventListener('click', function(e) {
      if (!inputElement.parentElement.contains(e.target) && 
          !dropdownElement.contains(e.target)) {
        dropdownElement.classList.remove('active');
      }
    });
    
    inputElement.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        dropdownElement.classList.remove('active');
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = this.value.trim().toUpperCase();
        const match = stockDatabase.find(s => s.symbol === val);
        if (match) {
          dropdownElement.classList.remove('active');
          if (onSelectCallback) onSelectCallback(match.symbol);
        } else if (val.length > 0) {
          const nameMatch = stockDatabase.find(s => s.name.toUpperCase().includes(val));
          if (nameMatch) {
            inputElement.value = nameMatch.symbol;
            dropdownElement.classList.remove('active');
            if (onSelectCallback) onSelectCallback(nameMatch.symbol);
          }
        }
      }
    });
  }

  function showAllStocks(dropdownElement) {
    const allStocks = stockDatabase;
    let html = `<div class="dropdown-header">📊 All Available Stocks (${allStocks.length})</div>`;
    
    allStocks.forEach(stock => {
      const priceChange = (Math.random() * 4 - 2).toFixed(2);
      const isPositive = parseFloat(priceChange) >= 0;
      
      html += `
        <div class="suggestion-item" data-symbol="${stock.symbol}">
          <div class="sym-main">
            <span class="sym-symbol">${stock.symbol}</span>
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
    
    dropdownElement.innerHTML = html;
    dropdownElement.classList.add('active');
  }

  function updateSuggestions(query, dropdownElement) {
    const matches = searchStocks(query);
    const html = createSuggestionsHTML(matches, query);
    dropdownElement.innerHTML = html;
    dropdownElement.classList.add('active');
  }

  function createDropdownFor(inputElement) {
    const existingDropdown = inputElement.parentElement.querySelector('.suggestions-dropdown');
    if (existingDropdown) {
      existingDropdown.remove();
    }
    
    const dropdown = document.createElement('div');
    dropdown.className = 'suggestions-dropdown';
    dropdown.style.position = 'absolute';
    dropdown.style.top = '100%';
    dropdown.style.left = '0';
    dropdown.style.marginTop = '5px';
    dropdown.style.width = '350px';
    dropdown.style.zIndex = '999';
    
    if (inputElement.parentElement.style.position !== 'relative') {
      inputElement.parentElement.style.position = 'relative';
    }
    
    inputElement.parentElement.appendChild(dropdown);
    return dropdown;
  }

  function initializeAllAutocomplete() {
    const globalInput = document.getElementById('globalSymbolInput');
    const globalDropdown = document.getElementById('suggestionsDropdown');
    if (globalInput && globalDropdown) {
      setupAutocomplete(globalInput, globalDropdown, (sym) => {
        currentSymbol = sym;
        switchTab(activeTab);
      });
    }
  }

  function setupTabAutocomplete() {
    const tabSearchConfigs = [
      { inputId: 'depthSymbolInput', tabId: 'marketdepth' },
      { inputId: 'fundSymbolInput', tabId: 'fundamental' },
      { inputId: 'floorSymbolInput', tabId: 'floorsheet' },
      { inputId: 'forecastSymbolInput', tabId: 'forecast' },
      { inputId: 'aiSymbolInput', tabId: 'ai' },
      { inputId: 'techSymbolFilter', tabId: 'technicals' }
    ];
    
    tabSearchConfigs.forEach(config => {
      const input = document.getElementById(config.inputId);
      if (input) {
        const dropdown = createDropdownFor(input);
        setupAutocomplete(input, dropdown, (sym) => {
          currentSymbol = sym;
          if (config.tabId === 'technicals') {
            input.value = sym;
            const container = document.getElementById('tabContent');
            container.innerHTML = renderTechnicalScreener(sym);
            attachTabEvents('technicals');
          } else {
            switchTab(config.tabId);
          }
        });
      }
    });
  }

  // ============================================
  // RENDER MARKET OVERVIEW
  // ============================================
  function renderMarketOverview() {
    const allStocks = getAllMarketData();
    const container = document.getElementById('stock-list');
    
    if (!container.classList.contains('market-grid')) {
      container.classList.add('market-grid');
    }
    
    let html = '';
    
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
    
    container.innerHTML = html;
    
    // Add click handlers - show stock details modal
    document.querySelectorAll('#stock-list .stock-card').forEach(card => {
      card.addEventListener('click', function() {
        const sym = this.dataset.symbol;
        if (sym) {
          showStockDetails(sym);
        }
      });
    });
  }

  // ============================================
  // RENDER FUNCTIONS
  // ============================================
  function renderOverview() {
    const topGainers = getTopGainers(5);
    const topLosers = getTopLosers(5);
    const allData = getAllMarketData();
    const topTurnover = [...allData].sort((a,b) => parseFloat(b.turnover) - parseFloat(a.turnover)).slice(0, 5);
    const topVolume = [...allData].sort((a,b) => parseFloat(b.volume) - parseFloat(a.volume)).slice(0, 5);
    const topTransactions = [...allData].sort((a,b) => b.transactions - a.transactions).slice(0, 5);
    
    const stockData = generateStockDetails(currentSymbol);
    const changePercent = ((stockData.ltp - stockData.prevClose) / stockData.prevClose * 100).toFixed(2);
    const isPositive = parseFloat(changePercent) >= 0;
    
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
          <div class="card-title">
            <i class="fas fa-chart-line"></i> 
            <span style="cursor: pointer; text-decoration: underline;" onclick="showStockDetails('${currentSymbol}')">
              ${currentSymbol} · ${stockData.companyName}
            </span>
          </div>
          <div style="display: flex; gap: 1rem; margin-bottom: 0.5rem; font-size: 0.9rem;">
            <span><strong>LTP:</strong> $${stockData.ltp.toFixed(2)}</span>
            <span class="${isPositive ? 'positive' : 'negative'}">${isPositive ? '+' : ''}${changePercent}%</span>
            <span><strong>Vol:</strong> ${(stockData.volume/1e6).toFixed(1)}M</span>
          </div>
          <canvas id="overviewMiniChart" height="170"></canvas>
          <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;">
            <span class="badge">H: $${stockData.week52High.toFixed(2)}</span>
            <span class="badge">L: $${stockData.week52Low.toFixed(2)}</span>
            <span class="badge">MCap: $${(stockData.marketCap/1e9).toFixed(1)}B</span>
            <span class="badge">P/E: ${stockData.peRatio}</span>
          </div>
        </div>
        <div>
          <div class="card-title"><i class="fas fa-newspaper"></i> Latest Market News</div>
          ${news.map(n => `<div class="news-item"><i class="fas fa-circle" style="font-size:0.35rem; color:#2d6a9f; margin-top:0.4rem;"></i> ${n}</div>`).join('')}
        </div>
      </div>
      
      <div class="grid-3col">
        <div>
          <div class="card-title"><i class="fas fa-arrow-up positive"></i> Top Gainers</div>
          ${topGainers.length > 0 ? topGainers.map(g => `
            <div class="list-row" style="cursor: pointer;" onclick="showStockDetails('${g.symbol}')">
              <span><strong>${g.symbol}</strong></span>
              <span>$${g.price}</span>
              <span class="positive">+${g.change}%</span>
            </div>
          `).join('') : '<p style="color:#6b7a99;">No gainers today</p>'}
          <button class="see-more-btn" onclick="window.showAllGainers()">See All Gainers <i class="fas fa-chevron-right"></i></button>
        </div>
        <div>
          <div class="card-title"><i class="fas fa-arrow-down negative"></i> Top Losers</div>
          ${topLosers.length > 0 ? topLosers.map(l => `
            <div class="list-row" style="cursor: pointer;" onclick="showStockDetails('${l.symbol}')">
              <span><strong>${l.symbol}</strong></span>
              <span>$${l.price}</span>
              <span class="negative">${l.change}%</span>
            </div>
          `).join('') : '<p style="color:#6b7a99;">No losers today</p>'}
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
    const stockData = generateStockDetails(symbol);
    const bids = [], asks = [];
    for (let i=0; i<7; i++) {
      bids.push({ price: (info.basePrice - 0.22*i - Math.random()*0.5).toFixed(2), volume: Math.floor(Math.random()*900+150) });
      asks.push({ price: (info.basePrice + 0.2*i + Math.random()*0.45).toFixed(2), volume: Math.floor(Math.random()*800+130) });
    }
    return `
      <div style="margin-bottom: 1rem;">
        <h3 style="color: #0a2540; margin-bottom: 0.3rem;">
          <i class="fas fa-chart-bar"></i> ${symbol} · ${info.name}
        </h3>
        <p style="color: #6b7a99; font-size: 0.9rem;">
          LTP: $${stockData.ltp.toFixed(2)} | Vol: ${(stockData.volume/1e6).toFixed(2)}M | MCap: $${(stockData.marketCap/1e9).toFixed(2)}B
        </p>
      </div>
      <div class="inline-search" style="position: relative;">
        <input type="text" id="depthSymbolInput" placeholder="Search by symbol or name..." value="${symbol}" autocomplete="off">
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
      return `<div class="list-row" style="cursor: pointer;" onclick="showStockDetails('${s.symbol}')">
        <span><strong>${s.symbol}</strong></span>
        <span>$${ind.current}</span>
        <span>RSI ${ind.rsi}</span>
        <span>MACD ${ind.macd}</span>
        <span class="badge">${signal}</span>
      </div>`;
    }).join('');
    return `
      <div class="inline-search" style="position: relative;">
        <input type="text" id="techSymbolFilter" placeholder="Filter by symbol or name..." value="${filterSymbol}" autocomplete="off">
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
    const stockData = generateStockDetails(symbol);
    return `
      <div style="margin-bottom: 1rem;">
        <h3 style="color: #0a2540; margin-bottom: 0.3rem;">
          <i class="fas fa-coins"></i> ${symbol} · ${info.name}
        </h3>
      </div>
      <div class="inline-search" style="position: relative;">
        <input type="text" id="fundSymbolInput" placeholder="Search by symbol or name..." value="${symbol}" autocomplete="off">
        <button id="fundSearchBtn"><i class="fas fa-search"></i> Load</button>
      </div>
      <div class="card-title"><i class="fas fa-file-invoice"></i> Fundamental Analysis</div>
      <div class="indicator-grid">
        <div><strong>LTP:</strong> $${stockData.ltp.toFixed(2)}</div>
        <div><strong>Market Cap:</strong> $${(stockData.marketCap/1e9).toFixed(2)}B</div>
        <div><strong>P/E Ratio:</strong> ${stockData.peRatio}</div>
        <div><strong>P/B Ratio:</strong> ${stockData.pbRatio}</div>
        <div><strong>EPS:</strong> $${stockData.eps}</div>
        <div><strong>Book Value:</strong> $${stockData.bookValue}</div>
        <div><strong>ROE:</strong> ${stockData.roe}%</div>
        <div><strong>ROA:</strong> ${stockData.roa}%</div>
        <div><strong>Debt/Equity:</strong> ${stockData.debtToEquity}</div>
        <div><strong>Dividend Yield:</strong> ${stockData.dividendYield}%</div>
        <div><strong>52W High:</strong> $${stockData.week52High.toFixed(2)}</div>
        <div><strong>52W Low:</strong> $${stockData.week52Low.toFixed(2)}</div>
        <div><strong>Volume:</strong> ${(stockData.volume/1e6).toFixed(2)}M</div>
        <div><strong>Beta:</strong> ${stockData.beta}</div>
        <div><strong>Industry P/E:</strong> ${stockData.industryPE}</div>
        <div><strong>Revenue Growth:</strong> ${stockData.revenueGrowth}%</div>
      </div>
    `;
  }

  function renderFloorsheet(symbol = currentSymbol) {
    const info = getStockInfo(symbol);
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
      <div style="margin-bottom: 1rem;">
        <h3 style="color: #0a2540; margin-bottom: 0.3rem;">
          <i class="fas fa-receipt"></i> ${symbol} · ${info.name}
        </h3>
      </div>
      <div class="inline-search" style="position: relative;">
        <input type="text" id="floorSymbolInput" placeholder="Search by symbol or name..." value="${symbol}" autocomplete="off">
        <button id="floorSearchBtn"><i class="fas fa-search"></i> Load</button>
      </div>
      <div class="card-title"><i class="fas fa-exchange-alt"></i> Floorsheet Transactions</div>
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
    const info = getStockInfo(symbol);
    const prices = generatePriceSeries(symbol, 40);
    const last = prices[prices.length-1].price;
    return `
      <div style="margin-bottom: 1rem;">
        <h3 style="color: #0a2540; margin-bottom: 0.3rem;">
          <i class="fas fa-chart-pie"></i> ${symbol} · ${info.name}
        </h3>
      </div>
      <div class="inline-search" style="position: relative;">
        <input type="text" id="forecastSymbolInput" placeholder="Search by symbol or name..." value="${symbol}" autocomplete="off">
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
    const stockData = generateStockDetails(symbol);
    const sentimentScore = (ind.rsi/100*0.4 + (ind.macd>0?0.3:0) + (ind.current>ind.sma20?0.3:0))*100;
    return `
      <div style="margin-bottom: 1rem;">
        <h3 style="color: #0a2540; margin-bottom: 0.3rem;">
          <i class="fas fa-brain"></i> ${symbol} · ${info.name}
        </h3>
      </div>
      <div class="inline-search" style="position: relative;">
        <input type="text" id="aiSymbolInput" placeholder="Search by symbol or name..." value="${symbol}" autocomplete="off">
        <button id="aiSearchBtn"><i class="fas fa-search"></i> Load</button>
      </div>
      <div class="ai-box">
        <h3><i class="fas fa-robot"></i> Advanced AI Analysis</h3>
        <div class="grid-2col" style="margin-top:1rem;">
          <div>
            <p><strong>🧠 Sentiment Score:</strong> ${sentimentScore.toFixed(1)}/100</p>
            <p><strong>📈 Trend:</strong> ${ind.current > ind.sma20 ? 'Bullish' : 'Bearish'}</p>
            <p><strong>📊 RSI:</strong> ${ind.rsi}</p>
            <p><strong>📉 MACD:</strong> ${ind.macd}</p>
            <p><strong>💵 LTP:</strong> $${stockData.ltp.toFixed(2)}</p>
          </div>
          <div>
            <p><strong>🎯 Support:</strong> $${ind.lowerBB}</p>
            <p><strong>🎯 Resistance:</strong> $${ind.upperBB}</p>
            <p><strong>📊 P/E:</strong> ${stockData.peRatio}</p>
            <p><strong>📊 ROE:</strong> ${stockData.roe}%</p>
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
    setTimeout(setupTabAutocomplete, 100);
    if (tabId === 'overview') setTimeout(drawOverviewMiniChart, 150);
    if (tabId === 'forecast') setTimeout(drawForecastChart, 150);
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
        setTimeout(setupTabAutocomplete, 100);
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

  // Global modal functions
  window.showAllGainers = function() {
    const allData = getAllMarketData();
    const gainers = allData.filter(s => s.change > 0).sort((a,b) => b.change - a.change);
    showModal('📈 All Gainers', gainers, ['Symbol', 'Name', 'Price', 'Change%']);
  };
  
  window.showAllLosers = function() {
    const allData = getAllMarketData();
    const losers = allData.filter(s => s.change < 0).sort((a,b) => a.change - b.change);
    showModal('📉 All Losers', losers, ['Symbol', 'Name', 'Price', 'Change%']);
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

  // Make showStockDetails globally accessible
  window.showStockDetails = showStockDetails;

  // Global search button
  document.getElementById('globalAnalyzeBtn').addEventListener('click', ()=>{
    const val = document.getElementById('globalSymbolInput').value.trim().toUpperCase();
    if (val) {
      const match = stockDatabase.find(s => s.symbol === val);
      if (match) {
        currentSymbol = val;
        switchTab(activeTab);
      } else {
        const nameMatch = stockDatabase.find(s => s.name.toUpperCase().includes(val));
        if (nameMatch) {
          currentSymbol = nameMatch.symbol;
          document.getElementById('globalSymbolInput').value = nameMatch.symbol;
          switchTab(activeTab);
        }
      }
    }
  });

  document.getElementById('tabBar').addEventListener('click', (e)=>{
    if (e.target.classList.contains('tab')) switchTab(e.target.dataset.tab);
  });

  // Initialize
  window.addEventListener('load', ()=>{
    initializeAllAutocomplete();
    switchTab('overview');
    renderMarketOverview();
    setInterval(renderMarketOverview, 30000);
  });
})();
