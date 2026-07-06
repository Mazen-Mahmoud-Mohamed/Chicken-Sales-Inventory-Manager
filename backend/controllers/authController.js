import * as authService from '../services/authService.js';
import { success, error } from '../utils/response.js';

/**
 * Verify administrator password without performing a protected action.
 * Used before opening edit/delete dialogs in the frontend.
 */
export async function verifyAdminPassword(req, res) {
  const { adminPassword } = req.body;

  if (!adminPassword) {
    return error(res, 'كلمة المرور مطلوبة', 401);
  }

  if (!authService.verifyPassword(adminPassword)) {
    await authService.logFailedPassword('VERIFY_PASSWORD');
    return error(res, 'كلمة المرور غير صحيحة', 401);
  }

  return success(res, null, 'تم التحقق من كلمة المرور');
}
