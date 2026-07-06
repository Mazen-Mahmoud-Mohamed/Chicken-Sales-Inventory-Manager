import * as authService from '../services/authService.js';
import { error } from '../utils/response.js';

/**
 * Verify administrator password on every protected request.
 * Password must be sent in req.body.adminPassword — never cached server-side.
 */
export function requireAdminPassword(operation) {
  return async (req, res, next) => {
    const password = req.body?.adminPassword;

    if (!password) {
      await authService.logFailedPassword(operation, extractMeta(req));
      return error(res, 'كلمة المرور مطلوبة', 401);
    }

    const valid = authService.verifyPassword(password);

    if (!valid) {
      await authService.logFailedPassword(operation, extractMeta(req));
      return error(res, 'كلمة المرور غير صحيحة', 401);
    }

    req.auditOperation = operation;
    delete req.body.adminPassword;
    next();
  };
}

function extractMeta(req) {
  return {
    saleId: req.params?.id || req.body?.saleId || null,
    categoryId: req.params?.id || req.body?.categoryId || null,
    categoryName: req.body?.categoryName || null,
  };
}
