import * as salesService from '../services/salesService.js';
import * as authService from '../services/authService.js';
import { success, error, badRequest, notFound } from '../utils/response.js';

export async function createSale(req, res) {
  try {
    const { categoryId, weight, chickenCount } = req.body;

    if (!categoryId) {
      return badRequest(res, 'يرجى اختيار الفئة');
    }

    if (!weight || weight <= 0) {
      return badRequest(res, 'يرجى إدخال وزن صحيح');
    }

    const result = await salesService.createSale({
      categoryId,
      weight: parseFloat(weight),
      chickenCount: chickenCount ? parseInt(chickenCount, 10) : undefined,
    });

    return success(res, result, 'تم حفظ عملية البيع بنجاح', 201);
  } catch (err) {
    return badRequest(res, err.message);
  }
}

export async function getSales(req, res) {
  try {
    const { search, dateFrom, dateTo, page, limit } = req.query;
    const result = await salesService.getSales({ search, dateFrom, dateTo, page, limit });
    return success(res, result);
  } catch (err) {
    return error(res, err.message);
  }
}

export async function getSaleById(req, res) {
  try {
    const sale = await salesService.getSaleById(req.params.id);
    return success(res, sale);
  } catch (err) {
    return notFound(res, err.message);
  }
}

export async function updateSale(req, res) {
  try {
    const { weight, chickenCount } = req.body;
    const saleId = req.params.id;

    if (!weight || weight <= 0) {
      return badRequest(res, 'يرجى إدخال وزن صحيح');
    }

    const existing = await salesService.getSaleById(saleId);
    const oldValue = {
      weight: existing.weight,
      chickenCount: existing.chickenCount,
      totalPrice: existing.totalPrice,
      categoryName: existing.categoryName,
    };

    const result = await salesService.updateSale(saleId, {
      weight: parseFloat(weight),
      chickenCount: chickenCount ? parseInt(chickenCount, 10) : undefined,
    });

    await authService.logSuccess('EDIT_SALE', {
      saleId,
      categoryName: result.sale.categoryName,
      oldValue,
      newValue: {
        weight: result.sale.weight,
        chickenCount: result.sale.chickenCount,
        totalPrice: result.sale.totalPrice,
      },
    });

    return success(res, result, 'تم تحديث عملية البيع بنجاح');
  } catch (err) {
    return badRequest(res, err.message);
  }
}

export async function deleteSale(req, res) {
  try {
    const saleId = req.params.id;
    const existing = await salesService.getSaleById(saleId);

    const result = await salesService.deleteSale(saleId);

    await authService.logSuccess('DELETE_SALE', {
      saleId,
      categoryName: existing.categoryName,
      oldValue: {
        weight: existing.weight,
        chickenCount: existing.chickenCount,
        totalPrice: existing.totalPrice,
        categoryName: existing.categoryName,
      },
    });

    return success(res, result, 'تم حذف عملية البيع بنجاح');
  } catch (err) {
    return notFound(res, err.message);
  }
}

export function calculatePrice(req, res) {
  try {
    const { weight, pricePerKg } = req.query;
    const totalPrice = salesService.calculatePrice(weight, pricePerKg);
    return success(res, { totalPrice });
  } catch (err) {
    return badRequest(res, err.message);
  }
}
