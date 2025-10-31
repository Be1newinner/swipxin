import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Map();

wss.on('connection', (ws) => {
  let clientId = null;

  ws.on('message', (message) => {
    const data = JSON.parse(message.toString());

    switch (data.type) {
      case 'register':
        clientId = data.clientId;
        clients.set(clientId, ws);
        console.log(`Client registered: ${clientId}`);
        break;

      case 'offer':
      case 'answer':
      case 'ice-candidate':
        // Forward message to target peer
        const targetWs = clients.get(data.target);
        if (targetWs && targetWs.readyState === ws.OPEN) {
          targetWs.send(JSON.stringify({
            type: data.type,
            from: clientId,
            data: data.data
          }));
        }
        break;
    }
  });

  ws.on('close', () => {
    if (clientId) {
      clients.delete(clientId);
      console.log(`Client disconnected: ${clientId}`);
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
