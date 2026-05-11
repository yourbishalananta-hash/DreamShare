class BaseComponent {
  render() { return `<div class="card-body">Loading component...</div>`; }
}

class ChartsComponent extends BaseComponent {
  render() { return `<div class="card-body"><h2>Advanced Charts</h2><p>Chart coming soon...</p></div>`; }
}

class ScreenerComponent extends BaseComponent {
  render() { return `<div class="card-body"><h2>Stock Screener</h2><p>Filters coming soon...</p></div>`; }
}

class WatchlistComponent extends BaseComponent {
  render() { return `<div class="card-body"><h2>My Watchlist</h2><p>Your saved stocks will appear here.</p></div>`; }
}

class PortfolioComponent extends BaseComponent {
  render() { return `<div class="card-body"><h2>Portfolio</h2><p>Your holdings and balance.</p></div>`; }
}

class AlertsComponent extends BaseComponent {
  render() { return `<div class="card-body"><h2>Price Alerts</h2><p>Manage your alerts here.</p></div>`; }
}

class NewsComponent extends BaseComponent {
  async render() { return `<div class="card-body"><h2>Market News</h2><p>Latest headlines coming soon...</p></div>`; }
}