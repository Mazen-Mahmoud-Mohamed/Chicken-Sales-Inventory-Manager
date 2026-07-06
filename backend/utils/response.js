/**
 * Standard API response helpers for consistent JSON responses.
 */
export function success(res, data = null, message = 'نجاح', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function error(res, message = 'حدث خطأ', statusCode = 500, errors = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

export function notFound(res, message = 'المورد غير موجود') {
  return error(res, message, 404);
}

export function badRequest(res, message = 'طلب غير صالح', errors = null) {
  return error(res, message, 400, errors);
}
