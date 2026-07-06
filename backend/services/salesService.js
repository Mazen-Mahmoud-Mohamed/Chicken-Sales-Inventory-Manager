import Sale from '../models/Sale.js';
import Category from '../models/Category.js';
import DailySession from '../models/DailySession.js';
import * as dashboardService from './dashboardService.js';
import * as sessionService from './sessionService.js';
import syncService from './syncService.js';

function formatTime(date = new Date()) {
  return date.toTimeString().slice(0, 8);
}

export function calculatePrice(weight, pricePerKg) {
  const w = parseFloat(weight) || 0;
  const p = parseFloat(pricePerKg) || 0;
  return Math.round(w * p * 100) / 100;
}

async function getTodaySession() {
  const date = await dashboardService.getActiveDate();
  const { session } = await sessionService.ensureSession(date);
  return session;
}

export async function createSale({ categoryId, weight, chickenCount }) {
  const category = await Category.findById(categoryId);
  if (!category) throw new Error('الفئة غير موجودة');

  const session = await getTodaySession();

  if (!session.inventoryConfigured) {
    throw new Error('يجب إعداد مخزون اليوم قبل تسجيل المبيعات');
  }

  const item = sessionService.getSessionItem(session, categoryId);

  if (!item && !category.isWholeChicken) {
    throw new Error('الفئة غير موجودة في جلسة اليوم');
  }

  const weightVal = parseFloat(weight);
  const chickenCountVal = category.isWholeChicken ? parseInt(chickenCount, 10) : 0;

  if (category.isWholeChicken) {
    if (!chickenCountVal || chickenCountVal <= 0) {
      throw new Error('يرجى إدخال عدد الفراخ');
    }
    const remainingChickens = session.chickenCount - session.soldChickens;
    if (chickenCountVal > remainingChickens) {
      throw new Error(`عدد الفراخ غير كافٍ. المتبقي: ${remainingChickens}`);
    }

    if (item && item.initialWeight > 0) {
      const remainingWeight = item.initialWeight - item.soldWeight;
      if (weightVal > remainingWeight) {
        throw new Error(`الوزن غير كافٍ. المتبقي: ${remainingWeight} كجم`);
      }
    }
  } else {
    const remainingWeight = item.initialWeight - item.soldWeight;
    if (weightVal > remainingWeight) {
      throw new Error(`الوزن غير كافٍ. المتبقي: ${remainingWeight} كجم`);
    }
  }

  const totalPrice = calculatePrice(weightVal, category.pricePerKg);
  const now = new Date();
  const activeDate = await dashboardService.getActiveDate();

  const sale = await Sale.create({
    saleDate: activeDate,
    saleTime: formatTime(now),
    categoryId: category._id,
    categoryName: category.name,
    weight: weightVal,
    chickenCount: chickenCountVal,
    pricePerKg: category.pricePerKg,
    totalPrice,
    dailySessionId: session._id,
  });

  if (category.isWholeChicken) {
    session.soldChickens += chickenCountVal;
  }
  if (item) {
    item.soldWeight += weightVal;
  }
  session.totalSales += totalPrice;
  session.markModified('items');
  await session.save();

  const dashboard = await dashboardService.getDashboard(activeDate);
  syncService.notifySaleCreated(sale.toJSON(), dashboard);

  return { sale, settings: dashboard };
}

export async function getSales({ search, dateFrom, dateTo, page = 1, limit = 100 } = {}) {
  const query = {};

  if (dateFrom || dateTo) {
    query.saleDate = {};
    if (dateFrom) {
      query.saleDate.$gte = sessionService.startOfDay(dateFrom);
    }
    if (dateTo) {
      const to = sessionService.startOfDay(dateTo);
      to.setHours(23, 59, 59, 999);
      query.saleDate.$lte = to;
    }
  }

  let sales = await Sale.find(query).sort({ saleDate: -1, saleTime: -1, createdAt: -1 });

  if (search) {
    const term = search.toLowerCase();
    sales = sales.filter(
      (s) =>
        s.saleTime.includes(term) ||
        (s.categoryName && s.categoryName.includes(term)) ||
        String(s.weight).includes(term) ||
        String(s.totalPrice).includes(term)
    );
  }

  const total = sales.length;
  const start = (page - 1) * limit;
  const paginatedSales = sales.slice(start, start + limit);

  return { sales: paginatedSales, total, page, limit };
}

export async function getSaleById(id) {
  const sale = await Sale.findById(id);
  if (!sale) throw new Error('عملية البيع غير موجودة');
  return sale;
}

export async function updateSale(id, { categoryId, weight, chickenCount }) {
  const sale = await getSaleById(id);
  const category = await Category.findById(categoryId || sale.categoryId);
  if (!category) throw new Error('الفئة غير موجودة');

  const session = sale.dailySessionId
    ? await DailySession.findById(sale.dailySessionId)
    : await sessionService.findSessionByDate(sale.saleDate);

  if (!session) throw new Error('جلسة اليوم غير موجودة');

  const weightVal = parseFloat(weight);
  const chickenCountVal = category.isWholeChicken ? parseInt(chickenCount, 10) || 1 : 0;

  const weightDiff = weightVal - sale.weight;
  const chickenDiff = chickenCountVal - (sale.chickenCount || 0);
  const categoryChanged = sale.categoryId?.toString() !== category._id.toString();

  if (categoryChanged) {
    throw new Error('لا يمكن تغيير الفئة عند التعديل. يرجى حذف العملية وإنشاء واحدة جديدة');
  }

  const item = sessionService.getSessionItem(session, category._id);

  if (category.isWholeChicken) {
    const remainingChickens =
      session.chickenCount - session.soldChickens + (sale.chickenCount || 0);
    if (chickenCountVal > remainingChickens) {
      throw new Error(`عدد الفراخ غير كافٍ. المتوفر: ${remainingChickens}`);
    }
    if (item) {
      const remainingWeight = item.initialWeight - item.soldWeight + sale.weight;
      if (weightVal > remainingWeight) {
        throw new Error(`الوزن غير كافٍ. المتوفر: ${remainingWeight} كجم`);
      }
    }
  } else if (item) {
    const remainingWeight = item.initialWeight - item.soldWeight + sale.weight;
    if (weightVal > remainingWeight) {
      throw new Error(`الوزن غير كافٍ. المتوفر: ${remainingWeight} كجم`);
    }
  }

  const oldTotalPrice = sale.totalPrice;
  sale.weight = weightVal;
  sale.chickenCount = chickenCountVal;
  sale.pricePerKg = category.pricePerKg;
  sale.totalPrice = calculatePrice(weightVal, category.pricePerKg);
  await sale.save();

  if (category.isWholeChicken) {
    session.soldChickens += chickenDiff;
  }
  if (item) {
    item.soldWeight += weightDiff;
  }
  session.totalSales += sale.totalPrice - oldTotalPrice;
  session.markModified('items');
  await session.save();

  const dashboard = await dashboardService.getDashboard(session.date);
  syncService.notifySaleUpdated(sale.toJSON(), dashboard);

  return { sale, settings: dashboard };
}

export async function deleteSale(id) {
  const sale = await getSaleById(id);

  const session = sale.dailySessionId
    ? await DailySession.findById(sale.dailySessionId)
    : await sessionService.findSessionByDate(sale.saleDate);

  if (!session) throw new Error('جلسة اليوم غير موجودة');

  const category = await Category.findById(sale.categoryId);
  const item = category ? sessionService.getSessionItem(session, category._id) : null;

  if (category?.isWholeChicken) {
    session.soldChickens = Math.max(0, session.soldChickens - (sale.chickenCount || 0));
  }
  if (item) {
    item.soldWeight = Math.max(0, item.soldWeight - sale.weight);
  }
  session.totalSales = Math.max(0, session.totalSales - sale.totalPrice);
  session.markModified('items');
  await session.save();

  await Sale.findByIdAndDelete(id);

  const dashboard = await dashboardService.getDashboard(session.date);
  syncService.notifySaleDeleted(id, dashboard);

  return { saleId: id, settings: dashboard };
}
