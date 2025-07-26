import React from 'react';
import { ConnectionRequest as ConnectionRequestType } from '../services/websocket';
import { Smartphone, Monitor, CheckCircle, XCircle } from 'lucide-react';

interface ConnectionRequestProps {
  request: ConnectionRequestType;
  onAccept: () => void;
  onReject: () => void;
}

export const ConnectionRequest: React.FC<ConnectionRequestProps> = ({
  request,
  onAccept,
  onReject
}) => {
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-6 h-6" />;
      case 'desktop':
        return <Monitor className="w-6 h-6" />;
      default:
        return <Monitor className="w-6 h-6" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in slide-in-from-bottom duration-300">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="text-blue-600">
              {getDeviceIcon(request.from.type)}
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Connection Request
          </h2>
          
          <p className="text-gray-600 mb-4">
            <span className="font-medium">{request.from.name}</span> wants to connect to your device
          </p>
          
          {request.message && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700">"{request.message}"</p>
            </div>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onReject}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors duration-200"
          >
            <XCircle className="w-5 h-5" />
            <span>Reject</span>
          </button>
          
          <button
            onClick={onAccept}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};