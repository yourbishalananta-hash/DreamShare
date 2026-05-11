// ============================================
// MARKETPULSE PRO - WEBSOCKET SERVICE
// ============================================

class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
  }

  connect() {
    console.log('🔌 Connecting to WebSocket...');
    this.socket = new WebSocket(CONFIG.websocket.url);

    this.socket.onopen = () => {
      console.log('✅ WebSocket Connected');
      this.reconnectAttempts = 0;
      eventBus.emit(EventBus.Events.CONNECTION_CHANGED, 'connected');
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Update state and notify UI
        stateManager.set('stocks', data.data);
        eventBus.emit(EventBus.Events.MARKET_DATA_UPDATED, data.data);
      } catch (e) {
        console.error('WS Message Error:', e);
      }
    };

    this.socket.onclose = () => {
      eventBus.emit(EventBus.Events.CONNECTION_CHANGED, 'disconnected');
      this.handleReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
      this.socket.close();
    };
  }

  handleReconnect() {
    if (this.reconnectAttempts < CONFIG.websocket.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Reconnecting in ${CONFIG.websocket.reconnectInterval/1000}s...`);
      setTimeout(() => this.connect(), CONFIG.websocket.reconnectInterval);
    }
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }
}

const webSocketService = new WebSocketService();