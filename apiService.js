// In your TechnicalChartComponent, the loadData method should work now:
async loadData() {
    this.setStatus(`Loading ${this.symbol}...`, 'info');
    
    try {
        // This will now work correctly with your API service
        const data = await apiService.getHistoricalData(this.symbol, { 
            range: this.range 
        });
        
        if (!data || data.length === 0) {
            this.setStatus(`No data available for ${this.symbol}`, 'warn');
            this.candles = [];
            return;
        }
        
        // Convert to Lightweight Charts format
        this.candles = data.map(d => ({
            time: Math.floor(new Date(d.timestamp).getTime() / 1000),
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
            volume: d.volume || 0,
        })).filter(d => d.time && !isNaN(d.close));
        
        // ... rest of your chart rendering code
    } catch (e) {
        console.error('Failed to load chart data:', e);
        this.setStatus(`Failed to load: ${e.message}`, 'error');
    }
}
