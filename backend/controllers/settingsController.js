import * as settingsService from '../services/settingsService.js';
import { success, error, badRequest } from '../utils/response.js';

export async function getSettings(req, res) {
  try {
    const dashboard = await settingsService.getSettings();
    return success(res, dashboard);
  } catch (err) {
    return error(res, err.message);
  }
}

export async function updateSettings(req, res) {
  try {
    const { date } = req.body;
    const updates = {};
    if (date !== undefined) updates.date = date;

    const dashboard = await settingsService.updateSettings(updates);
    return success(res, dashboard, 'تم تحديث الإعدادات');
  } catch (err) {
    return badRequest(res, err.message);
  }
}
