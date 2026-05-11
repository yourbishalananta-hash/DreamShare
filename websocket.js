// ============================================
// MARKETPULSE PRO - WEBSOCKET SERVICE
// ============================================

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.isConnected = false;
  }
  
  connect() {
    if (!CONFIG.features.realTimeUpdates) return;
    
    try {
      this.ws = new WebSocket(CONFIG.websocket.url);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        stateManager.set('isConnected', true);
        eventBus.emit(EVENTS.CONNECTION_CHANGED, 'connected');
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.data) {
            stateManager.set('stocks', data.data);
            stateManager.set('lastUpdate', new Date());
            eventBus.emit(EVENTS.MARKET_DATA_UPDATED, data.data);
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.isConnected = false;
        stateManager.set('isConnected', false);
        eventBus.emit(EVENTS.CONNECTION_CHANGED, 'disconnected');
        this.attemptReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.attemptReconnect();
    }
  }
  
  attemptReconnect() {
    if (this.reconnectAttempts >= CONFIG.websocket.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
    
    setTimeout(() => {
      this.connect();
    }, CONFIG.websocket.reconnectInterval);
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Create global instance
const webSocketService = new WebSocketService();
