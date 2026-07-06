import * as inventoryService from '../services/inventoryService.js';
import * as authService from '../services/authService.js';
import { success, error, badRequest } from '../utils/response.js';

export async function getInventory(req, res) {
  try {
    const { date } = req.query;
    if (!date) return badRequest(res, 'التاريخ مطلوب');

    const session = await inventoryService.getInventoryByDate(date);
    if (!session) {
      return success(res, { exists: false });
    }

    return success(res, {
      exists: true,
      ...session.toJSON(),
      items: session.items.map(inventoryService.formatInventoryItem),
      remainingChickens: Math.max(0, session.chickenCount - session.soldChickens),
    });
  } catch (err) {
    return error(res, err.message);
  }
}

export async function saveInventory(req, res) {
  try {
    const { date, chickenCount, items } = req.body;
    if (!date) return badRequest(res, 'التاريخ مطلوب');

    const previous = await inventoryService.getInventoryByDate(date);
    const oldValue = previous
      ? {
          chickenCount: previous.chickenCount,
          items: previous.items.map(inventoryService.formatInventoryItem),
        }
      : null;

    const dashboard = await inventoryService.createOrUpdateInventory({
      date,
      chickenCount,
      items,
    });

    await authService.logSuccess('EDIT_INVENTORY', {
      newValue: {
        date,
        chickenCount,
        items,
      },
      oldValue,
    });

    return success(res, dashboard, 'تم حفظ مخزون اليوم بنجاح', 201);
  } catch (err) {
    return badRequest(res, err.message);
  }
}
