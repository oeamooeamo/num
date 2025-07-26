import React, { useState, useEffect } from 'react';
import { websocketService, Device, ConnectionRequest as ConnectionRequestType, ConnectionHistory as ConnectionHistoryType } from './services/websocket';
import { DeviceList } from './components/DeviceList';
import { ConnectionRequest } from './components/ConnectionRequest';
import { ConnectionHistory } from './components/ConnectionHistory';
import { ConnectionStatus } from './components/ConnectionStatus';
import { Monitor, Smartphone, RefreshCw } from 'lucide-react';

function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionRequest, setConnectionRequest] = useState<ConnectionRequestType | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<Set<string>>(new Set());
  const [connectionHistory, setConnectionHistory] = useState<ConnectionHistoryType[]>([]);
  const [error, setError] = useState<string>('');
  const [notification, setNotification] = useState<string>('');
  const [totalDevices, setTotalDevices] = useState<number>(0);

  useEffect(() => {
    // WebSocket event listeners
    websocketService.on('connected', () => {
      setIsConnected(true);
      setError('');
    });

    websocketService.on('disconnected', () => {
      setIsConnected(false);
      setDevices([]);
    });

    websocketService.on('connection_failed', () => {
      setError('Failed to connect to server. Please try again later.');
    });

    websocketService.on('devices_updated', (deviceList: Device[]) => {
      setDevices(deviceList);
      setTotalDevices(deviceList.length + 1); // +1 for current device
    });

    websocketService.on('connection_request', (request: ConnectionRequestType) => {
      setConnectionRequest(request);
    });

    websocketService.on('request_sent', (data: any) => {
      showNotification(`Connection request sent to ${data.to.name}`);
    });

    websocketService.on('connection_established', (data: any) => {
      setConnectedDevices(prev => new Set([...prev, data.with.id]));
      showNotification(`Connected to ${data.with.name}`);
      setConnectionRequest(null);
    });

    websocketService.on('connection_rejected', (data: any) => {
      showNotification(`Connection rejected by ${data.by.name}`, 'error');
    });

    websocketService.on('device_disconnected', (data: any) => {
      setConnectedDevices(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.from.id);
        return newSet;
      });
      showNotification(`${data.from.name} disconnected`);
    });

    websocketService.on('connection_history', (history: ConnectionHistoryType[]) => {
      setConnectionHistory(history);
    });

    websocketService.on('error', (message: string) => {
      setError(message);
    });

    // Get current device ID
    const checkDeviceId = () => {
      const deviceId = websocketService.getDeviceId();
      if (deviceId) {
        setCurrentDeviceId(deviceId);
        // Request connection history
        websocketService.getConnectionHistory();
      } else {
        setTimeout(checkDeviceId, 100);
      }
    };
    checkDeviceId();

    return () => {
      // Cleanup listeners
      websocketService.off('connected', () => {});
      websocketService.off('disconnected', () => {});
      websocketService.off('devices_updated', () => {});
    };
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleConnect = (deviceId: string) => {
    websocketService.requestConnection(deviceId, 'Requesting screen sharing access');
  };

  const handleAcceptConnection = () => {
    if (connectionRequest) {
      websocketService.respondToConnection(connectionRequest.from.id, true, 'Connection accepted');
    }
  };

  const handleRejectConnection = () => {
    if (connectionRequest) {
      websocketService.respondToConnection(connectionRequest.from.id, false, 'Connection rejected');
      setConnectionRequest(null);
    }
  };

  const handleReconnect = (deviceId: string) => {
    handleConnect(deviceId);
  };

  const refreshDevices = () => {
    // The device list is automatically updated via WebSocket
    showNotification('Device list refreshed');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Monitor className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Device Remote Control</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Connect and control devices remotely through real-time WebSocket connections. 
            Open this page on multiple devices to establish connections.
          </p>
        </div>

        {/* Connection Status */}
        <ConnectionStatus 
          isConnected={isConnected}
          deviceId={currentDeviceId}
          totalDevices={totalDevices}
          error={error}
        />

        {/* Notification */}
        {notification && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800">{notification}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Device List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Real-Time Device Network</h2>
                <button
                  onClick={refreshDevices}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  title="Refresh devices"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
              
              <DeviceList
                devices={devices}
                currentDeviceId={currentDeviceId}
                onConnect={handleConnect}
                connectedDevices={connectedDevices}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Connection History */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <ConnectionHistory
                history={connectionHistory}
                onReconnect={handleReconnect}
              />
            </div>

            {/* Current Device Info */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
              <div className="flex items-center space-x-3 mb-3">
                <Smartphone className="w-6 h-6" />
                <h3 className="text-lg font-semibold">This Device</h3>
              </div>
              
              <div className="space-y-2 text-blue-100">
                <p className="text-sm">
                  ID: {currentDeviceId ? `${currentDeviceId.slice(0, 8)}...` : 'Connecting...'}
                </p>
                <p className="text-sm">
                  Status: {isConnected ? 'Connected' : 'Disconnected'}
                </p>
                <p className="text-sm">
                  Active Connections: {connectedDevices.size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Request Modal */}
        {connectionRequest && (
          <ConnectionRequest
            request={connectionRequest}
            onAccept={handleAcceptConnection}
            onReject={handleRejectConnection}
          />
        )}
      </div>
    </div>
  );
}

export default App;