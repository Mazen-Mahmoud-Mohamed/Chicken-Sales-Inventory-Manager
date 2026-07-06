import * as sessionService from './sessionService.js';
import * as dashboardService from './dashboardService.js';
import syncService from './syncService.js';

/**
 * Inventory service — delegates to daily session service.
 */
export async function getInventoryByDate(date) {
  return sessionService.findSessionByDate(date);
}

export async function createOrUpdateInventory({ date, chickenCount, items }) {
  await sessionService.saveSessionInventory({ date, chickenCount, items });

  const dashboard = await dashboardService.getDashboard(date);
  syncService.notifyInventoryUpdated(dashboard);
  return dashboard;
}

export function formatInventoryItem(item) {
  return sessionService.formatSessionItem(item);
}

export async function getInventoryItem(session, categoryId) {
  return sessionService.getSessionItem(session, categoryId);
}

export async function ensureInventoryForDate(date) {
  const { session } = await sessionService.ensureSession(date);
  return session;
}
