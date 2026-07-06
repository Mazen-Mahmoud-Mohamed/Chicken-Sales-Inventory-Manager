import Sale from '../models/Sale.js';
import Category from '../models/Category.js';
import * as dashboardService from './dashboardService.js';
import * as sessionService from './sessionService.js';
import { formatDateGregorian } from '../utils/dateFormat.js';

/**
 * Generate report data from sales collection for a given date range.
 */
export async function generateReport({ dateFrom, dateTo } = {}) {
  const activeDate = await dashboardService.getActiveDate();
  const reportDate = dateFrom ? sessionService.startOfDay(dateFrom) : sessionService.startOfDay(activeDate);

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
  } else {
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);
    query.saleDate = { $gte: reportDate, $lte: endOfDay };
  }

  const sales = await Sale.find(query).sort({ saleDate: 1, saleTime: 1 });
  const categories = await Category.find().sort({ sortOrder: 1 });

  const totalMoney = sales.reduce((sum, s) => sum + s.totalPrice, 0);
  const soldWeight = sales.reduce((sum, s) => sum + s.weight, 0);
  const soldChickens = sales.reduce((sum, s) => sum + (s.chickenCount || 0), 0);

  const dailyBreakdown = buildDailyBreakdown(sales);
  const inventoryDate = dateTo ? sessionService.startOfDay(dateTo) : reportDate;
  const categoryBreakdown = await buildCategoryBreakdown(sales, categories, inventoryDate);

  const session = await sessionService.findSessionByDate(reportDate);
  const remainingChickens = session
    ? Math.max(0, session.chickenCount - session.soldChickens)
    : 0;

  return {
    reportDate,
    dateFrom: dateFrom || reportDate,
    dateTo: dateTo || reportDate,
    dailySales: dailyBreakdown,
    categoryBreakdown,
    summary: {
      totalMoney,
      soldWeight,
      soldChickens,
      remainingChickens,
      totalSalesCount: sales.length,
    },
    sales,
  };
}

function buildDailyBreakdown(sales) {
  const breakdown = {};

  for (const sale of sales) {
    const dateKey = sessionService.toDateKey(sale.saleDate);

    if (!breakdown[dateKey]) {
      breakdown[dateKey] = {
        date: formatDateGregorian(sale.saleDate),
        dateIso: dateKey,
        totalMoney: 0,
        soldWeight: 0,
        soldChickens: 0,
        salesCount: 0,
      };
    }

    breakdown[dateKey].totalMoney += sale.totalPrice;
    breakdown[dateKey].soldWeight += sale.weight;
    breakdown[dateKey].soldChickens += sale.chickenCount || 0;
    breakdown[dateKey].salesCount += 1;
  }

  return Object.values(breakdown).sort((a, b) => a.dateIso.localeCompare(b.dateIso));
}

async function buildCategoryBreakdown(sales, categories, reportDate) {
  const session = await sessionService.findSessionByDate(reportDate);
  const breakdown = [];

  for (const category of categories) {
    const categorySales = sales.filter(
      (s) => s.categoryId?.toString() === category._id.toString()
    );

    const soldWeight = categorySales.reduce((sum, s) => sum + s.weight, 0);
    const soldChickens = categorySales.reduce((sum, s) => sum + (s.chickenCount || 0), 0);
    const revenue = categorySales.reduce((sum, s) => sum + s.totalPrice, 0);

    let remaining = 0;
    let remainingChickens = 0;

    if (session) {
      if (category.isWholeChicken) {
        remainingChickens = Math.max(0, session.chickenCount - session.soldChickens);
        const item = sessionService.getSessionItem(session, category._id);
        if (item) {
          remaining = Math.max(0, item.initialWeight - item.soldWeight);
        }
      } else {
        const item = sessionService.getSessionItem(session, category._id);
        if (item) {
          remaining = Math.max(0, item.initialWeight - item.soldWeight);
        }
      }
    }

    breakdown.push({
      categoryId: category._id,
      categoryName: category.name,
      isWholeChicken: category.isWholeChicken,
      soldWeight,
      soldChickens,
      revenue,
      remaining,
      remainingChickens,
      salesCount: categorySales.length,
      pricePerKg: category.pricePerKg,
    });
  }

  return breakdown;
}

export async function getExportData({ dateFrom, dateTo } = {}) {
  return generateReport({ dateFrom, dateTo });
}
