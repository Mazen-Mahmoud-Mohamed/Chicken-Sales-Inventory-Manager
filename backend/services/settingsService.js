import Settings from '../models/Settings.js';
import syncService from './syncService.js';
import * as dashboardService from './dashboardService.js';

export async function getSettings() {
  return dashboardService.getDashboard();
}

export async function updateSettings(updates) {
  if (updates.date !== undefined) {
    await dashboardService.setActiveDate(updates.date);
  }

  const dashboard = await dashboardService.getDashboard(updates.date);
  syncService.notifySettingsUpdated(dashboard);
  return dashboard;
}
