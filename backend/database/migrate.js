import mongoose from 'mongoose';
import Category from '../models/Category.js';
import DailySession from '../models/DailySession.js';
import Sale from '../models/Sale.js';
import Settings from '../models/Settings.js';
import { DEFAULT_CATEGORIES, WHOLE_CHICKEN_NAME } from '../constants/categories.js';
import { toDateKey, startOfDay } from '../utils/dateHelpers.js';
import logger from '../utils/logger.js';

/**
 * Migrate legacy data and seed default categories on first run.
 */
export async function runMigrations() {
  await seedCategories();
  await migrateDailyInventoriesToSessions();
  await migrateLegacySettings();
  await migrateLegacySales();
  await linkSalesToSessions();
  await migrateInventoryConfigured();
  logger.info('Database migrations completed');
}

async function seedCategories() {
  const count = await Category.countDocuments();
  if (count > 0) return;

  await Category.insertMany(DEFAULT_CATEGORIES);
  logger.info('Default categories seeded');
}

/**
 * Migrate daily_inventories collection to daily_sessions with dateKey.
 */
async function migrateDailyInventoriesToSessions() {
  const db = mongoose.connection.db;
  if (!db) return;

  const legacyCol = db.collection('daily_inventories');
  const legacyDocs = await legacyCol.find({}).toArray();
  if (!legacyDocs.length) return;

  for (const doc of legacyDocs) {
    const dateKey = toDateKey(doc.date);
    const exists = await DailySession.findOne({ dateKey });
    if (exists) continue;

    await DailySession.create({
      dateKey,
      date: startOfDay(doc.date),
      chickenCount: doc.chickenCount || 0,
      soldChickens: doc.soldChickens || 0,
      totalSales: doc.totalSales || 0,
      carriedFromDateKey: null,
      inventoryConfigured:
        (doc.chickenCount || 0) > 0 ||
        (doc.items || []).some((i) => (i.initialWeight || 0) > 0) ||
        (doc.totalSales || 0) > 0,
      items: (doc.items || []).map((item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        initialWeight: item.initialWeight || 0,
        soldWeight: item.soldWeight || 0,
      })),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  logger.info(`Migrated ${legacyDocs.length} daily inventories to daily sessions`);
}

async function migrateLegacySettings() {
  const rawSettings = await Settings.collection.findOne({}, { sort: { createdAt: -1 } });
  if (!rawSettings) {
    await Settings.create({ date: startOfDay() });
    return;
  }

  const hasLegacyFields =
    rawSettings.chickenPrice !== undefined ||
    rawSettings.totalWeight !== undefined ||
    rawSettings.totalChickens !== undefined;

  if (!hasLegacyFields) return;

  const day = startOfDay(rawSettings.date || new Date());
  const dateKey = toDateKey(day);
  const existing = await DailySession.findOne({ dateKey });
  if (existing) return;

  const categories = await Category.find().sort({ sortOrder: 1 });
  const wholeCategory = categories.find((c) => c.isWholeChicken);

  const items = categories.map((c) => {
    const isWhole = c.isWholeChicken;
    return {
      categoryId: c._id,
      categoryName: c.name,
      initialWeight: isWhole ? (rawSettings.totalWeight || 0) : 0,
      soldWeight: isWhole ? (rawSettings.soldWeight || 0) : 0,
    };
  });

  await DailySession.create({
    dateKey,
    date: day,
    chickenCount: rawSettings.totalChickens || 0,
    soldChickens: rawSettings.soldChickens || 0,
    items,
    totalSales: rawSettings.totalSales || 0,
    inventoryConfigured: true,
  });

  if (wholeCategory && rawSettings.chickenPrice > 0) {
    await Category.findByIdAndUpdate(wholeCategory._id, {
      pricePerKg: rawSettings.chickenPrice,
    });
  }

  await Settings.collection.updateOne(
    { _id: rawSettings._id },
    {
      $unset: {
        chickenPrice: '',
        totalWeight: '',
        totalChickens: '',
        soldWeight: '',
        soldChickens: '',
        totalSales: '',
      },
    }
  );

  logger.info('Legacy settings migrated to daily session');
}

async function migrateLegacySales() {
  const salesWithoutCategory = await Sale.find({
    $or: [{ categoryId: { $exists: false } }, { categoryId: null }],
  });

  if (!salesWithoutCategory.length) return;

  let wholeCategory = await Category.findOne({ isWholeChicken: true });
  if (!wholeCategory) {
    wholeCategory = await Category.findOne({ name: WHOLE_CHICKEN_NAME });
  }

  for (const sale of salesWithoutCategory) {
    sale.categoryId = wholeCategory?._id;
    sale.categoryName = wholeCategory?.name || WHOLE_CHICKEN_NAME;
    if (!sale.chickenCount) {
      sale.chickenCount = 0;
    }
    await sale.save();
  }

  logger.info(`Migrated ${salesWithoutCategory.length} legacy sales`);
}

/**
 * Link existing sales to their daily session by date.
 */
async function linkSalesToSessions() {
  const salesWithoutSession = await Sale.find({
    $or: [{ dailySessionId: { $exists: false } }, { dailySessionId: null }],
  });

  if (!salesWithoutSession.length) return;

  let linked = 0;
  for (const sale of salesWithoutSession) {
    const session = await DailySession.findOne({ dateKey: toDateKey(sale.saleDate) });
    if (session) {
      sale.dailySessionId = session._id;
      await sale.save();
      linked++;
    }
  }

  if (linked > 0) {
    logger.info(`Linked ${linked} sales to daily sessions`);
  }
}

/**
 * Mark existing sessions as configured if they already have inventory or sales data.
 */
async function migrateInventoryConfigured() {
  const result = await DailySession.updateMany(
    {
      inventoryConfigured: { $ne: true },
      $or: [
        { carriedFromDateKey: { $ne: null } },
        { totalSales: { $gt: 0 } },
        { soldChickens: { $gt: 0 } },
        { chickenCount: { $gt: 0 } },
        { 'items.initialWeight': { $gt: 0 } },
      ],
    },
    { $set: { inventoryConfigured: true } }
  );

  if (result.modifiedCount > 0) {
    logger.info(`Marked ${result.modifiedCount} sessions as inventory configured`);
  }
}
