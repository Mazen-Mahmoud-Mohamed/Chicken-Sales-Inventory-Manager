import Category from '../models/Category.js';
import DailySession from '../models/DailySession.js';
import Sale from '../models/Sale.js';
import syncService from './syncService.js';
import * as dashboardService from './dashboardService.js';
import * as sessionService from './sessionService.js';

export async function getAllCategories() {
  return Category.find().sort({ sortOrder: 1, createdAt: 1 });
}

export async function getCategoryById(id) {
  const category = await Category.findById(id);
  if (!category) throw new Error('الفئة غير موجودة');
  return category;
}

export async function createCategory({ name, pricePerKg }) {
  const existing = await Category.findOne({ name: name.trim() });
  if (existing) throw new Error('اسم الفئة موجود بالفعل');

  const maxOrder = await Category.findOne().sort({ sortOrder: -1 });
  const category = await Category.create({
    name: name.trim(),
    pricePerKg: parseFloat(pricePerKg) || 0,
    isWholeChicken: false,
    sortOrder: (maxOrder?.sortOrder || 0) + 1,
  });

  const activeDate = await dashboardService.getActiveDate();
  const { session } = await sessionService.ensureSession(activeDate);
  await sessionService.addCategoryToSession(session, category);
  const dashboard = await dashboardService.getDashboard(activeDate);
  syncService.notifyInventoryUpdated(dashboard);

  syncService.notifyCategoriesUpdated(await getAllCategories());
  return category;
}

export async function updateCategory(id, { name, pricePerKg }) {
  const category = await getCategoryById(id);

  if (name && name.trim() !== category.name) {
    const existing = await Category.findOne({ name: name.trim() });
    if (existing) throw new Error('اسم الفئة موجود بالفعل');
    category.name = name.trim();

    await DailySession.updateMany(
      { 'items.categoryId': category._id },
      { $set: { 'items.$[elem].categoryName': name.trim() } },
      { arrayFilters: [{ 'elem.categoryId': category._id }] }
    );

    await Sale.updateMany(
      { categoryId: category._id },
      { $set: { categoryName: name.trim() } }
    );
  }

  if (pricePerKg !== undefined) {
    category.pricePerKg = parseFloat(pricePerKg) || 0;
  }

  await category.save();
  syncService.notifyCategoriesUpdated(await getAllCategories());
  return category;
}

export async function deleteCategory(id) {
  const category = await getCategoryById(id);
  if (category.isWholeChicken) {
    throw new Error('لا يمكن حذف فئة الفراخ الكاملة');
  }

  await Category.findByIdAndDelete(id);
  syncService.notifyCategoriesUpdated(await getAllCategories());
  return { id };
}

export async function updateCategoryPrices(prices) {
  const updates = [];
  for (const { categoryId, pricePerKg } of prices) {
    const category = await Category.findByIdAndUpdate(
      categoryId,
      { pricePerKg: parseFloat(pricePerKg) || 0 },
      { new: true }
    );
    if (category) updates.push(category);
  }

  syncService.notifyCategoriesUpdated(await getAllCategories());
  return updates;
}
