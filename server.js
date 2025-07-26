import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import http from 'http';
import cors from 'cors';
import express from 'express';

// Create Express app with CORS
const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'WebSocket Server Running',
    connectedDevices: connectedDevices.size,
    uptime: process.uptime()
  });
});

// Create HTTP server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Store connected devices
const connectedDevices = new Map();
const connectionHistory = new Map(); // Store connection history
const deviceSessions = new Map(); // Store device session data

console.log('🚀 WebSocket Server starting...');

wss.on('connection', (ws, req) => {
  const deviceId = uuidv4();
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  console.log(`📱 New device connected: ${deviceId} from ${clientIP} at ${new Date().toISOString()}`);
  
  // Initialize device data
  const deviceData = {
    id: deviceId,
    ws: ws,
    name: null,
    type: null, // 'desktop' or 'mobile'
    status: 'online',
    connectedAt: new Date().toISOString(),
    ip: clientIP,
    lastSeen: new Date().toISOString()
  };
  
  connectedDevices.set(deviceId, deviceData);
  
  // Send device ID to client
  ws.send(JSON.stringify({
    type: 'device_registered',
    deviceId: deviceId,
    message: 'Device registered successfully'
  }));
  
  // Broadcast updated device list to all clients
  broadcastDeviceList();
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      handleMessage(deviceId, data);
    } catch (error) {
      console.error('❌ Error parsing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });
  
  ws.on('close', () => {
    console.log(`📱 Device disconnected: ${deviceId}`);
    
    // Update last seen time before removing
    const device = connectedDevices.get(deviceId);
    if (device) {
      deviceSessions.set(deviceId, {
        ...device,
        lastSeen: new Date().toISOString(),
        status: 'offline'
      });
    }
    
    connectedDevices.delete(deviceId);
    broadcastDeviceList();
  });
  
  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for device ${deviceId}:`, error);
  });
});

function handleMessage(senderId, data) {
  const senderDevice = connectedDevices.get(senderId);
  if (!senderDevice) return;
  
  switch (data.type) {
    case 'register_device':
      // Update device information
      senderDevice.name = data.name || `Device-${senderId.slice(0, 8)}`;
      senderDevice.type = data.deviceType || 'unknown';
      connectedDevices.set(senderId, senderDevice);
      
      console.log(`📝 Device registered: ${senderDevice.name} (${senderDevice.type})`);
      
      // Send confirmation
      senderDevice.ws.send(JSON.stringify({
        type: 'registration_complete',
        deviceInfo: {
          id: senderId,
          name: senderDevice.name,
          type: senderDevice.type
        }
      }));
      
      broadcastDeviceList();
      break;
      
    case 'connection_request':
      handleConnectionRequest(senderId, data.targetDeviceId, data.message);
      break;
      
    case 'connection_response':
      handleConnectionResponse(senderId, data.requesterId, data.accepted, data.message);
      break;
      
    case 'disconnect_request':
      handleDisconnectRequest(senderId, data.targetDeviceId);
      break;
      
    case 'get_connection_history':
      sendConnectionHistory(senderId);
      break;
      
    default:
      console.log(`⚠️ Unknown message type: ${data.type}`);
  }
}

function handleConnectionRequest(senderId, targetDeviceId, message) {
  const senderDevice = connectedDevices.get(senderId);
  const targetDevice = connectedDevices.get(targetDeviceId);
  
  if (!senderDevice || !targetDevice) {
    senderDevice?.ws.send(JSON.stringify({
      type: 'connection_error',
      message: 'Target device not found or disconnected'
    }));
    return;
  }
  
  console.log(`🔌 Connection request: ${senderDevice.name} -> ${targetDevice.name}`);
  
  // Send connection request to target device
  targetDevice.ws.send(JSON.stringify({
    type: 'incoming_connection_request',
    from: {
      id: senderId,
      name: senderDevice.name,
      type: senderDevice.type
    },
    message: message || `${senderDevice.name} wants to connect to your device`
  }));
  
  // Confirm request sent to sender
  senderDevice.ws.send(JSON.stringify({
    type: 'connection_request_sent',
    to: {
      id: targetDeviceId,
      name: targetDevice.name,
      type: targetDevice.type
    }
  }));
}

function handleConnectionResponse(senderId, requesterId, accepted, message) {
  const senderDevice = connectedDevices.get(senderId);
  const requesterDevice = connectedDevices.get(requesterId);
  
  if (!senderDevice || !requesterDevice) return;
  
  if (accepted) {
    console.log(`✅ Connection accepted: ${requesterDevice.name} <-> ${senderDevice.name}`);
    
    // Add to connection history
    addToConnectionHistory(requesterId, senderId);
    
    // Notify both devices of successful connection
    requesterDevice.ws.send(JSON.stringify({
      type: 'connection_established',
      with: {
        id: senderId,
        name: senderDevice.name,
        type: senderDevice.type
      },
      message: `Connected to ${senderDevice.name}`
    }));
    
    senderDevice.ws.send(JSON.stringify({
      type: 'connection_established',
      with: {
        id: requesterId,
        name: requesterDevice.name,
        type: requesterDevice.type
      },
      message: `Connected to ${requesterDevice.name}`
    }));
  } else {
    console.log(`❌ Connection rejected: ${requesterDevice.name} <- ${senderDevice.name}`);
    
    requesterDevice.ws.send(JSON.stringify({
      type: 'connection_rejected',
      by: {
        id: senderId,
        name: senderDevice.name,
        type: senderDevice.type
      },
      message: message || `${senderDevice.name} rejected the connection`
    }));
  }
}

function handleDisconnectRequest(senderId, targetDeviceId) {
  const senderDevice = connectedDevices.get(senderId);
  const targetDevice = connectedDevices.get(targetDeviceId);
  
  if (!senderDevice || !targetDevice) return;
  
  console.log(`🔌 Disconnect request: ${senderDevice.name} -X- ${targetDevice.name}`);
  
  // Notify both devices of disconnection
  targetDevice.ws.send(JSON.stringify({
    type: 'device_disconnected',
    from: {
      id: senderId,
      name: senderDevice.name,
      type: senderDevice.type
    }
  }));
  
  senderDevice.ws.send(JSON.stringify({
    type: 'disconnect_confirmed',
    with: {
      id: targetDeviceId,
      name: targetDevice.name,
      type: targetDevice.type
    }
  }));
}

function addToConnectionHistory(device1Id, device2Id) {
  const device1 = connectedDevices.get(device1Id);
  const device2 = connectedDevices.get(device2Id);
  
  if (!device1 || !device2) return;
  
  const connectionRecord = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    device1: { id: device1Id, name: device1.name, type: device1.type },
    device2: { id: device2Id, name: device2.name, type: device2.type },
    duration: null, // Will be updated when connection ends
    status: 'connected'
  };
  
  // Store in both directions
  if (!connectionHistory.has(device1Id)) {
    connectionHistory.set(device1Id, []);
  }
  if (!connectionHistory.has(device2Id)) {
    connectionHistory.set(device2Id, []);
  }
  
  connectionHistory.get(device1Id).push({
    ...connectionRecord,
    connectedTo: connectionRecord.device2
  });
  
  connectionHistory.get(device2Id).push({
    ...connectionRecord,
    connectedTo: connectionRecord.device1
  });
  
  console.log(`📝 Connection history updated for ${device1.name} and ${device2.name}`);
}

function sendConnectionHistory(deviceId) {
  const device = connectedDevices.get(deviceId);
  if (!device) return;
  
  const history = connectionHistory.get(deviceId) || [];
  
  device.ws.send(JSON.stringify({
    type: 'connection_history',
    history: history.slice(-10) // Send last 10 connections
  }));
}

function broadcastDeviceList() {
  const deviceList = Array.from(connectedDevices.values()).map(device => ({
    id: device.id,
    name: device.name || `Device-${device.id.slice(0, 8)}`,
    type: device.type || 'unknown',
    status: device.status,
    connectedAt: device.connectedAt,
    lastSeen: device.lastSeen
  }));
  
  const message = JSON.stringify({
    type: 'device_list_updated',
    devices: deviceList,
    totalDevices: deviceList.length,
    timestamp: new Date().toISOString()
  });
  
  connectedDevices.forEach(device => {
    if (device.ws.readyState === 1) { // WebSocket.OPEN
      device.ws.send(message);
    }
  });
  
  console.log(`📡 Broadcasted device list to ${deviceList.length} devices at ${new Date().toISOString()}`);
}

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 WebSocket Server running on port ${PORT} at ${new Date().toISOString()}`);
  console.log(`📡 Ready to accept device connections`);
  console.log(`🌐 Server URL: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Server shutting down...');
  wss.close(() => {
    console.log('✅ WebSocket server closed');
    process.exit(0);
  });
});