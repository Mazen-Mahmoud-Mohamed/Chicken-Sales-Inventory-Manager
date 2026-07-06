import syncService from '../services/syncService.js';

/**
 * SSE endpoint for real-time data synchronization across LAN clients.
 */
export function streamEvents(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to sync stream' })}\n\n`);

  syncService.addClient(res);

  const heartbeat = setInterval(() => {
    res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });
}

export function getSyncStatus(req, res) {
  res.json({
    success: true,
    data: {
      connectedClients: syncService.getClientCount(),
    },
  });
}
