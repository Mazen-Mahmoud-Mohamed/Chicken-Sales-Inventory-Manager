import AppConfig from './config.js';

/**
 * HTTP API client for communicating with the Express backend.
 */
class ApiClient {
  constructor() {
    this.initialized = false;
  }

  async ensureInit() {
    if (!this.initialized) {
      await AppConfig.init();
      this.initialized = true;
    }
  }

  get baseUrl() {
    return AppConfig.apiBase;
  }

  async request(endpoint, options = {}) {
    await this.ensureInit();

    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'فشل الطلب');
    }

    return data.data;
  }

  async get(endpoint) {
    return this.request(endpoint);
  }

  async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete(endpoint, body = null) {
    return this.request(endpoint, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async downloadFile(endpoint, filename) {
    await this.ensureInit();
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error('فشل التحميل');

    const blob = await response.blob();
    return { blob, filename };
  }

  // Settings / Dashboard
  getSettings() {
    return this.get('/settings');
  }

  updateSettings(data) {
    return this.put('/settings', data);
  }

  // Categories
  getCategories() {
    return this.get('/categories');
  }

  createCategory(data) {
    return this.post('/categories', data);
  }

  updateCategory(id, data) {
    return this.put(`/categories/${id}`, data);
  }

  deleteCategory(id) {
    return this.delete(`/categories/${id}`);
  }

  updateCategoryPrices(prices) {
    return this.put('/categories/prices', { prices });
  }

  // Inventory
  getInventory(date) {
    return this.get(`/inventory?date=${date}`);
  }

  saveInventory(data) {
    return this.post('/inventory', data);
  }

  // Auth
  verifyAdminPassword(adminPassword) {
    return this.post('/auth/verify', { adminPassword });
  }

  // Sales
  getSales(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/sales${query ? `?${query}` : ''}`);
  }

  createSale(data) {
    return this.post('/sales', data);
  }

  updateSale(id, data, adminPassword) {
    return this.put(`/sales/${id}`, { ...data, adminPassword });
  }

  deleteSale(id, adminPassword) {
    return this.delete(`/sales/${id}`, { adminPassword });
  }

  calculatePrice(weight, pricePerKg) {
    return this.get(`/sales/calculate?weight=${weight}&pricePerKg=${pricePerKg}`);
  }

  // Reports
  getReport(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/reports${query ? `?${query}` : ''}`);
  }

  exportReportExcel(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.downloadFile(`/reports/export/excel${query ? `?${query}` : ''}`, 'sales-report.xlsx');
  }

  exportReportPdf(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.downloadFile(`/reports/export/pdf${query ? `?${query}` : ''}`, 'sales-report.pdf');
  }

  exportSalesExcel(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.downloadFile(`/reports/export/sales-excel${query ? `?${query}` : ''}`, 'sales-records.xlsx');
  }
}

const api = new ApiClient();
export default api;
