/**
 * Application configuration.
 * API base URL is resolved dynamically for server/client LAN modes.
 */
const AppConfig = {
  apiBase: '/api',
  shopName: 'مدير مبيعات الدجاج',

  async init() {
    if (window.electronAPI?.getAppConfig) {
      const config = await window.electronAPI.getAppConfig();
      this.shopName = config.shopName || this.shopName;

      if (config.mode === 'client' && config.serverUrl) {
        this.apiBase = `${config.serverUrl}/api`;
      }
    }
  },
};

export default AppConfig;
