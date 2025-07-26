# Real Device Connection System

A real-time device connection system using WebSocket for remote control between devices.

## Features

- **Real WebSocket Server**: Actual server running on Render.com
- **Live Device Presence**: Shows online/offline status in real-time
- **Connection Requests**: Send and receive actual connection requests between devices
- **Connection History**: Stores and displays previous connections
- **Cross-Platform**: Works on desktop and mobile browsers

## Architecture

### Frontend (React + TypeScript)
- Real-time WebSocket connection
- Device detection and registration
- Connection request handling
- History management

### Backend (Node.js + WebSocket)
- WebSocket server on Render.com
- Device session management
- Real-time message broadcasting
- Connection history storage

## Testing

1. Open the website on multiple devices/browsers
2. Each device will automatically register and appear in others' device lists
3. Click "Connect" to send real connection requests
4. Accept/reject requests on target devices
5. View connection history

## Deployment

### WebSocket Server
The WebSocket server is deployed on Render.com at:
`wss://device-remote-websocket.onrender.com`

### Frontend
The frontend is deployed on Netlify and automatically connects to the WebSocket server.

## Local Development

```bash
# Install dependencies
npm install

# Run WebSocket server locally
npm run server

# Run frontend (in another terminal)
npm run dev

# Or run both together
npm run dev:full
```

## Environment Variables

For production deployment:
- `PORT`: Server port (automatically set by Render)
- `NODE_ENV`: Set to 'production'

## Next Steps

- Add screen sharing functionality
- Implement WebRTC for direct peer-to-peer connections
- Add Android app integration
- Implement USB connection support