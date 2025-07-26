import React from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  deviceId: string | null;
  totalDevices?: number;
  error?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  deviceId,
  totalDevices = 0,
  error
}) => {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-red-800 font-medium">Connection Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-4 mb-6 ${
      isConnected 
        ? 'bg-green-50 border border-green-200' 
        : 'bg-yellow-50 border border-yellow-200'
    }`}>
      <div className="flex items-center space-x-2">
        {isConnected ? (
          <Wifi className="w-5 h-5 text-green-600" />
        ) : (
          <WifiOff className="w-5 h-5 text-yellow-600" />
        )}
        <div>
          <p className={`font-medium ${
            isConnected ? 'text-green-800' : 'text-yellow-800'
          }`}>
            {isConnected ? 'Connected to Server' : 'Connecting...'}
          </p>
          {deviceId && (
            <p className={`text-sm ${
              isConnected ? 'text-green-600' : 'text-yellow-600'
            }`}>
              Device ID: {deviceId.slice(0, 8)}... | Network: {totalDevices} device{totalDevices !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};