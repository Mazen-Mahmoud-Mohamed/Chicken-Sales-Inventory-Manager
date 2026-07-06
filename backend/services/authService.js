import AuditLog from '../models/AuditLog.js';
import config from '../config/index.js';

function formatTime(date = new Date()) {
  return date.toTimeString().slice(0, 8);
}

/**
 * Verify administrator password against ADMIN_PASSWORD from .env.
 * Verification happens only on the backend — password is never stored in MongoDB.
 */
export function verifyPassword(plainPassword) {
  if (!plainPassword || !config.adminPassword) {
    return false;
  }
  return plainPassword === config.adminPassword;
}

/**
 * Record a protected action in the audit log (append-only).
 */
export async function logAudit({
  operation,
  result,
  saleId = null,
  categoryId = null,
  categoryName = null,
  oldValue = null,
  newValue = null,
}) {
  const now = new Date();
  await AuditLog.create({
    date: now,
    time: formatTime(now),
    operation,
    saleId,
    categoryId,
    categoryName,
    oldValue,
    newValue,
    result,
  });
}

export async function logFailedPassword(operation, meta = {}) {
  await logAudit({
    operation,
    result: 'FAILED_PASSWORD',
    saleId: meta.saleId || null,
    categoryId: meta.categoryId || null,
    categoryName: meta.categoryName || null,
    oldValue: meta.oldValue || null,
    newValue: meta.newValue || null,
  });
}

export async function logSuccess(operation, meta = {}) {
  await logAudit({
    operation,
    result: 'SUCCESS',
    saleId: meta.saleId || null,
    categoryId: meta.categoryId || null,
    categoryName: meta.categoryName || null,
    oldValue: meta.oldValue || null,
    newValue: meta.newValue || null,
  });
}
