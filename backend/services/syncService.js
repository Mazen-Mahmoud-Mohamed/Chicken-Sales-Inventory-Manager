import { EventEmitter } from 'events';

/**
 * Real-time sync service using Server-Sent Events.
 * Broadcasts data changes to all connected clients on the LAN.
 */
class SyncService extends EventEmitter {
  constructor() {
    super();
    this.clients = new Set();
    this.setMaxListeners(100);
  }

  /**
   * Register an SSE client connection.
   */
  addClient(res) {
    this.clients.add(res);

    res.on('close', () => {
      this.clients.delete(res);
    });
  }

  /**
   * Broadcast an event to all connected clients.
   */
  broadcast(event, data) {
    const payload = JSON.stringify({ event, data, timestamp: Date.now() });
    const message = `event: ${event}\ndata: ${payload}\n\n`;

    for (const client of this.clients) {
      try {
        client.write(message);
      } catch {
        this.clients.delete(client);
      }
    }

    this.emit(event, data);
  }

  /**
   * Notify clients that settings were updated.
   */
  notifySettingsUpdated(settings) {
    this.broadcast('settings:updated', settings);
  }

  /**
   * Notify clients that a sale was created.
   */
  notifySaleCreated(sale, settings) {
    this.broadcast('sale:created', { sale, settings });
  }

  /**
   * Notify clients that a sale was updated.
   */
  notifySaleUpdated(sale, settings) {
    this.broadcast('sale:updated', { sale, settings });
  }

  /**
   * Notify clients that a sale was deleted.
   */
  notifySaleDeleted(saleId, settings) {
    this.broadcast('sale:deleted', { saleId, settings });
  }

  notifyCategoriesUpdated(categories) {
    this.broadcast('categories:updated', categories);
  }

  notifyInventoryUpdated(dashboard) {
    this.broadcast('inventory:updated', dashboard);
  }

  getClientCount() {
    return this.clients.size;
  }
}

const syncService = new SyncService();

export default syncService;
