import React from 'react';
import { Device } from '../services/websocket';
import { Smartphone, Monitor, Wifi, WifiOff, Clock } from 'lucide-react';

interface DeviceListProps {
  devices: Device[];
  currentDeviceId: string | null;
  onConnect: (deviceId: string) => void;
  connectedDevices: Set<string>;
}

export const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  currentDeviceId,
  onConnect,
  connectedDevices
}) => {
  const availableDevices = devices.filter(device => device.id !== currentDeviceId);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'desktop':
        return <Monitor className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const formatConnectedTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (availableDevices.length === 0) {
    return (
      <div className="text-center py-12">
        <WifiOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-500 mb-2">No devices available</h3>
        <p className="text-gray-400">
          Open this page on another device to establish a connection
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Available Devices</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Wifi className="w-4 h-4" />
          <span>{availableDevices.length} device{availableDevices.length !== 1 ? 's' : ''} online</span>
        </div>
      </div>
      
      {availableDevices.map((device) => {
        const isConnected = connectedDevices.has(device.id);
        
        return (
          <div
            key={device.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                    {getDeviceIcon(device.type)}
                  </div>
                  <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    device.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900">
                    {device.name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                    <span className="capitalize">{device.type}</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Connected {formatConnectedTime(device.connectedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => onConnect(device.id)}
                disabled={isConnected}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isConnected
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow'
                }`}
              >
                {isConnected ? 'Connected' : 'Connect'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};