import AppConfig from './config.js';

/**
 * Real-time synchronization via Server-Sent Events.
 * Keeps all LAN clients in sync when data changes on the server.
 */
class SyncManager {
  constructor() {
    this.eventSource = null;
    this.listeners = new Map();
    this.reconnectDelay = 3000;
    this.connected = false;
  }

  async connect() {
    await AppConfig.init();

    const baseUrl = AppConfig.apiBase.replace('/api', '');
    const url = `${baseUrl}/api/sync/events`;

    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener('connected', () => {
      this.connected = true;
      this.updateIndicator(true);
    });

    this.eventSource.addEventListener('settings:updated', (e) => {
      const payload = JSON.parse(e.data);
      this.emit('settings:updated', payload.data);
    });

    this.eventSource.addEventListener('sale:created', (e) => {
      const payload = JSON.parse(e.data);
      this.emit('sale:created', payload.data);
    });

    this.eventSource.addEventListener('sale:updated', (e) => {
      const payload = JSON.parse(e.data);
      this.emit('sale:updated', payload.data);
    });

    this.eventSource.addEventListener('sale:deleted', (e) => {
      const payload = JSON.parse(e.data);
      this.emit('sale:deleted', payload.data);
    });

    this.eventSource.addEventListener('categories:updated', (e) => {
      const payload = JSON.parse(e.data);
      this.emit('categories:updated', payload.data);
    });

    this.eventSource.addEventListener('inventory:updated', (e) => {
      const payload = JSON.parse(e.data);
      this.emit('inventory:updated', payload.data);
    });

    this.eventSource.onerror = () => {
      this.connected = false;
      this.updateIndicator(false);
      this.eventSource.close();
      setTimeout(() => this.connect(), this.reconnectDelay);
    };
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event, data) {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  updateIndicator(connected) {
    const dot = document.querySelector('.sync-dot');
    const label = document.querySelector('.sync-label');
    if (dot) dot.classList.toggle('connected', connected);
    if (label) label.textContent = connected ? 'متزامن' : 'إعادة الاتصال...';
  }

  disconnect() {
    this.eventSource?.close();
    this.connected = false;
  }
}

const syncManager = new SyncManager();
export default syncManager;
