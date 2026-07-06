import Settings from '../models/Settings.js';
import DailySession from '../models/DailySession.js';
import Category from '../models/Category.js';
import { toDateKey, startOfDay, dateFromKey } from '../utils/dateHelpers.js';

/**
 * Format a category inventory item with computed remaining quantity.
 */
export function formatSessionItem(item) {
  return {
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    initialWeight: item.initialWeight,
    soldWeight: item.soldWeight,
    remainingWeight: Math.max(0, item.initialWeight - item.soldWeight),
  };
}

export function getSessionItem(session, categoryId) {
  if (!session?.items) return null;
  const id = categoryId?.toString();
  return session.items.find((i) => i.categoryId.toString() === id);
}

/**
 * Find session by calendar date.
 */
export async function findSessionByDate(date) {
  const dateKey = toDateKey(date);
  return DailySession.findOne({ dateKey });
}

/**
 * Find the most recent session before the given dateKey.
 */
export async function findPreviousSession(beforeDateKey) {
  return DailySession.findOne({ dateKey: { $lt: beforeDateKey } })
    .sort({ dateKey: -1 })
    .limit(1);
}

/**
 * Build category items from carry-over of a previous session.
 */
function buildCarryOverItems(previousSession, categories) {
  return categories.map((cat) => {
    const prevItem = getSessionItem(previousSession, cat._id);
    const remaining = prevItem
      ? Math.max(0, prevItem.initialWeight - prevItem.soldWeight)
      : 0;

    return {
      categoryId: cat._id,
      categoryName: cat.name,
      initialWeight: remaining,
      soldWeight: 0,
    };
  });
}

/**
 * Build empty category items for all categories.
 */
function buildEmptyItems(categories) {
  return categories.map((cat) => ({
    categoryId: cat._id,
    categoryName: cat.name,
    initialWeight: 0,
    soldWeight: 0,
  }));
}

function parseInitialWeight(input, fallback = 0) {
  if (input === undefined || input === null || input === '') {
    return fallback;
  }
  const parsed = parseFloat(input);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Ensure a daily session exists for the given date.
 * Creates one with carry-over from the previous session if missing.
 * Never creates duplicates for the same date.
 */
export async function ensureSession(date) {
  const day = startOfDay(date);
  const dateKey = toDateKey(day);

  let session = await DailySession.findOne({ dateKey });
  if (session) {
    return { session, created: false, carriedOver: false };
  }

  const categories = await Category.find().sort({ sortOrder: 1 });
  const previous = await findPreviousSession(dateKey);

  let chickenCount = 0;
  let items = buildEmptyItems(categories);
  let carriedFromDateKey = null;
  let inventoryConfigured = false;

  if (previous) {
    chickenCount = Math.max(0, previous.chickenCount - previous.soldChickens);
    items = buildCarryOverItems(previous, categories);
    carriedFromDateKey = previous.dateKey;
    inventoryConfigured = true;
  }

  try {
    session = await DailySession.create({
      dateKey,
      date: day,
      chickenCount,
      soldChickens: 0,
      totalSales: 0,
      carriedFromDateKey,
      inventoryConfigured,
      items,
    });
  } catch (err) {
    if (err.code === 11000) {
      const existing = await DailySession.findOne({ dateKey });
      if (existing) {
        return { session: existing, created: false, carriedOver: false };
      }
    }
    throw err;
  }

  return {
    session,
    created: true,
    carriedOver: Boolean(previous),
  };
}

/**
 * Save or update inventory quantities for a session.
 * Persists to MongoDB immediately. Preserves sold quantities.
 */
export async function saveSessionInventory({ date, chickenCount, items }) {
  const day = startOfDay(date);
  const dateKey = toDateKey(day);
  const { session } = await ensureSession(day);
  const categories = await Category.find().sort({ sortOrder: 1 });

  const newChickenCount = parseInt(chickenCount, 10) || 0;
  if (newChickenCount < session.soldChickens) {
    throw new Error(
      `عدد الفراخ الابتدائي لا يمكن أن يكون أقل من المباع (${session.soldChickens})`
    );
  }

  const updatedItems = categories.map((cat) => {
    const existing = getSessionItem(session, cat._id);
    const input = items?.find((i) => i.categoryId?.toString() === cat._id.toString());
    const newInitial = parseInitialWeight(input?.initialWeight, existing?.initialWeight ?? 0);
    const soldWeight = existing?.soldWeight || 0;

    if (newInitial < soldWeight) {
      throw new Error(
        `كمية ${cat.name} الابتدائية لا يمكن أن تكون أقل من المباع (${soldWeight} كجم)`
      );
    }

    return {
      categoryId: cat._id,
      categoryName: cat.name,
      initialWeight: newInitial,
      soldWeight,
    };
  });

  const saved = await DailySession.findOneAndUpdate(
    { dateKey },
    {
      $set: {
        date: day,
        chickenCount: newChickenCount,
        items: updatedItems,
        inventoryConfigured: true,
      },
    },
    { new: true, runValidators: true }
  );

  if (!saved) {
    throw new Error('فشل حفظ مخزون اليوم');
  }

  let settings = await Settings.findOne().sort({ createdAt: -1 });
  if (!settings) {
    await Settings.create({ date: day });
  } else {
    settings.date = day;
    await settings.save();
  }

  return saved;
}

/**
 * Add a new category to an existing session (zero stock).
 */
export async function addCategoryToSession(session, category) {
  const exists = session.items.some(
    (i) => i.categoryId.toString() === category._id.toString()
  );
  if (exists) return session;

  session.items.push({
    categoryId: category._id,
    categoryName: category.name,
    initialWeight: 0,
    soldWeight: 0,
  });
  session.markModified('items');
  await session.save();
  return session;
}

/**
 * Whether the user must configure inventory before selling.
 */
export function sessionNeedsInventorySetup(session) {
  return !session.inventoryConfigured;
}

export { toDateKey, startOfDay, dateFromKey };
