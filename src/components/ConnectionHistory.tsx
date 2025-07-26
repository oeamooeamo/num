import React from 'react';
import { ConnectionHistory as ConnectionHistoryType } from '../services/websocket';
import { Smartphone, Monitor, Clock, History } from 'lucide-react';

interface ConnectionHistoryProps {
  history: ConnectionHistoryType[];
  onReconnect: (deviceId: string) => void;
}

export const ConnectionHistory: React.FC<ConnectionHistoryProps> = ({
  history,
  onReconnect
}) => {
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'desktop':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No connection history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 mb-4">
        <History className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-medium text-gray-800">Recent Connections</h3>
      </div>
      
      {history.map((connection, index) => (
        <div
          key={index}
          className="bg-white rounded-lg border border-gray-100 p-4 hover:shadow-sm transition-shadow duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-gray-600">
                {getDeviceIcon(connection.connectedTo.type)}
              </div>
              
              <div>
                <p className="font-medium text-gray-900">
                  {connection.connectedTo.name}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="capitalize">{connection.connectedTo.type}</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(connection.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => onReconnect(connection.connectedTo.id)}
              className="px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition-colors duration-200"
            >
              Connect
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};