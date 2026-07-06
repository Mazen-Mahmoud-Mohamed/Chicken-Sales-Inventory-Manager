import Settings from '../models/Settings.js';
import Category from '../models/Category.js';
import * as sessionService from './sessionService.js';

export async function getActiveDate() {
  let settings = await Settings.findOne().sort({ createdAt: -1 });
  if (!settings) {
    settings = await Settings.create({ date: sessionService.startOfDay() });
  }
  return settings.date;
}

export async function setActiveDate(date) {
  let settings = await Settings.findOne().sort({ createdAt: -1 });
  if (!settings) {
    settings = await Settings.create({ date: sessionService.startOfDay(date) });
  } else {
    settings.date = sessionService.startOfDay(date);
    await settings.save();
  }
  return settings.date;
}

/**
 * Load dashboard data from today's daily session in MongoDB.
 * Auto-creates session with carry-over when a new date is detected.
 */
export async function getDashboard(dateInput) {
  const date = sessionService.startOfDay(dateInput || (await getActiveDate()));
  const { session, created, carriedOver } = await sessionService.ensureSession(date);
  const categories = await Category.find().sort({ sortOrder: 1 });

  const categoryPrices = categories.map((c) => ({
    _id: c._id,
    name: c.name,
    pricePerKg: c.pricePerKg,
    isWholeChicken: c.isWholeChicken,
    sortOrder: c.sortOrder,
  }));

  const remainingChickens = Math.max(0, session.chickenCount - session.soldChickens);

  const categoryInventory = session.items
    .filter((item) => {
      const cat = categories.find((c) => c._id.toString() === item.categoryId.toString());
      return cat && !cat.isWholeChicken;
    })
    .map(sessionService.formatSessionItem);

  const wholeCategory = categories.find((c) => c.isWholeChicken);
  let wholeChickenWeight = null;
  if (wholeCategory) {
    const wholeItem = sessionService.getSessionItem(session, wholeCategory._id);
    if (wholeItem) {
      wholeChickenWeight = sessionService.formatSessionItem(wholeItem);
    }
  }

  const needsInventory = sessionService.sessionNeedsInventorySetup(session);

  return {
    date: session.date,
    dateKey: session.dateKey,
    sessionId: session._id,
    categories: categoryPrices,
    inventory: {
      _id: session._id,
      chickenCount: session.chickenCount,
      soldChickens: session.soldChickens,
      inventoryConfigured: session.inventoryConfigured,
      items: session.items.map(sessionService.formatSessionItem),
      carriedFromDateKey: session.carriedFromDateKey,
    },
    needsInventory,
    sessionCreated: created,
    carriedOver: created && carriedOver,
    totalSales: session.totalSales,
    remainingChickens,
    chickenCount: session.chickenCount,
    categoryInventory,
    wholeChickenWeight,
  };
}
