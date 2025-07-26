export interface Device {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'unknown';
  status: 'online' | 'offline';
  connectedAt: string;
}

export interface ConnectionRequest {
  from: Device;
  message: string;
}

export interface ConnectionHistory {
  timestamp: string;
  connectedTo: Device;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private deviceId: string | null = null;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      // Use a public WebSocket server for real connections
      const wsUrl = window.location.hostname === 'localhost' 
        ? 'ws://localhost:8080' 
        : 'wss://device-remote-websocket.onrender.com';
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      this.scheduleReconnect();
    }
  }

  private handleOpen() {
    console.log('✅ WebSocket connected');
    this.reconnectAttempts = 0;
    this.emit('connected');
  }

  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      console.log('📨 Received:', data.type, data);
      
      switch (data.type) {
        case 'device_registered':
          this.deviceId = data.deviceId;
          this.registerDevice();
          break;
        case 'device_list_updated':
          this.emit('devices_updated', data.devices);
          break;
        case 'incoming_connection_request':
          this.emit('connection_request', data);
          break;
        case 'connection_request_sent':
          this.emit('request_sent', data);
          break;
        case 'connection_established':
          this.emit('connection_established', data);
          break;
        case 'connection_rejected':
          this.emit('connection_rejected', data);
          break;
        case 'device_disconnected':
          this.emit('device_disconnected', data);
          break;
        case 'connection_history':
          this.emit('connection_history', data.history);
          break;
        case 'error':
          this.emit('error', data.message);
          break;
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  }

  private handleClose() {
    console.log('🔌 WebSocket disconnected');
    this.emit('disconnected');
    this.scheduleReconnect();
  }

  private handleError(error: Event) {
    console.error('❌ WebSocket error:', error);
    this.emit('error', 'Connection error occurred');
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
      this.emit('connection_failed');
    }
  }

  private registerDevice() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    
    const deviceInfo = this.getDeviceInfo();
    
    this.ws.send(JSON.stringify({
      type: 'register_device',
      name: deviceInfo.name,
      deviceType: deviceInfo.type
    }));
  }

  private getDeviceInfo() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android.*(?!.*Mobile)/i.test(navigator.userAgent);
    
    let deviceType: 'desktop' | 'mobile' = 'desktop';
    if (isMobile && !isTablet) {
      deviceType = 'mobile';
    }
    
    const deviceName = `${navigator.platform} - ${navigator.userAgent.split(' ')[0]}`;
    
    return {
      name: deviceName,
      type: deviceType
    };
  }

  // Public methods
  public requestConnection(targetDeviceId: string, message?: string) {
    if (!this.isConnected()) return false;
    
    this.ws!.send(JSON.stringify({
      type: 'connection_request',
      targetDeviceId,
      message: message || 'Requesting connection'
    }));
    
    return true;
  }

  public respondToConnection(requesterId: string, accepted: boolean, message?: string) {
    if (!this.isConnected()) return false;
    
    this.ws!.send(JSON.stringify({
      type: 'connection_response',
      requesterId,
      accepted,
      message
    }));
    
    return true;
  }

  public disconnect(targetDeviceId: string) {
    if (!this.isConnected()) return false;
    
    this.ws!.send(JSON.stringify({
      type: 'disconnect_request',
      targetDeviceId
    }));
    
    return true;
  }

  public getConnectionHistory() {
    if (!this.isConnected()) return false;
    
    this.ws!.send(JSON.stringify({
      type: 'get_connection_history'
    }));
    
    return true;
  }

  public getDeviceId(): string | null {
    return this.deviceId;
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Event system
  public on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();