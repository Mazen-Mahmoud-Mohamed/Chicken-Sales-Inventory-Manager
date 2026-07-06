import * as categoryService from '../services/categoryService.js';
import * as authService from '../services/authService.js';
import { success, error, badRequest } from '../utils/response.js';

export async function getCategories(req, res) {
  try {
    const categories = await categoryService.getAllCategories();
    return success(res, categories);
  } catch (err) {
    return error(res, err.message);
  }
}

export async function createCategory(req, res) {
  try {
    const { name, pricePerKg } = req.body;
    if (!name?.trim()) return badRequest(res, 'اسم الفئة مطلوب');

    const category = await categoryService.createCategory({ name, pricePerKg });

    await authService.logSuccess('ADD_CATEGORY', {
      categoryId: category._id,
      categoryName: category.name,
      newValue: { name: category.name, pricePerKg: category.pricePerKg },
    });

    return success(res, category, 'تم إضافة الفئة بنجاح', 201);
  } catch (err) {
    return badRequest(res, err.message);
  }
}

export async function updateCategory(req, res) {
  try {
    const { name, pricePerKg } = req.body;
    const categoryId = req.params.id;
    const existing = await categoryService.getCategoryById(categoryId);
    const oldValue = { name: existing.name, pricePerKg: existing.pricePerKg };

    const category = await categoryService.updateCategory(categoryId, { name, pricePerKg });

    await authService.logSuccess('EDIT_CATEGORY', {
      categoryId,
      categoryName: category.name,
      oldValue,
      newValue: { name: category.name, pricePerKg: category.pricePerKg },
    });

    return success(res, category, 'تم تحديث الفئة بنجاح');
  } catch (err) {
    return badRequest(res, err.message);
  }
}

export async function deleteCategory(req, res) {
  try {
    const categoryId = req.params.id;
    const existing = await categoryService.getCategoryById(categoryId);

    const result = await categoryService.deleteCategory(categoryId);

    await authService.logSuccess('DELETE_CATEGORY', {
      categoryId,
      categoryName: existing.name,
      oldValue: { name: existing.name, pricePerKg: existing.pricePerKg },
    });

    return success(res, result, 'تم حذف الفئة بنجاح');
  } catch (err) {
    return badRequest(res, err.message);
  }
}

export async function updatePrices(req, res) {
  try {
    const { prices } = req.body;
    if (!Array.isArray(prices)) return badRequest(res, 'بيانات الأسعار غير صالحة');

    const categories = await categoryService.updateCategoryPrices(prices);

    await authService.logSuccess('UPDATE_CATEGORY_PRICES', {
      newValue: prices,
    });

    return success(res, categories, 'تم تحديث الأسعار بنجاح');
  } catch (err) {
    return badRequest(res, err.message);
  }
}
