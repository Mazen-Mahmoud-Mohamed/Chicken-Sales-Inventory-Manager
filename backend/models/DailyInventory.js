import mongoose from 'mongoose';

const inventoryItemSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    categoryName: {
      type: String,
      required: true,
      trim: true,
    },
    initialWeight: {
      type: Number,
      default: 0,
      min: [0, 'الوزن الابتدائي لا يمكن أن يكون سالباً'],
    },
    soldWeight: {
      type: Number,
      default: 0,
      min: [0, 'الوزن المباع لا يمكن أن يكون سالباً'],
    },
  },
  { _id: false }
);

const dailyInventorySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'التاريخ مطلوب'],
      unique: true,
    },
    chickenCount: {
      type: Number,
      default: 0,
      min: [0, 'عدد الفراخ لا يمكن أن يكون سالباً'],
    },
    soldChickens: {
      type: Number,
      default: 0,
      min: [0, 'عدد الفراخ المباعة لا يمكن أن يكون سالباً'],
    },
    items: {
      type: [inventoryItemSchema],
      default: [],
    },
    totalSales: {
      type: Number,
      default: 0,
      min: [0, 'إجمالي المبيعات لا يمكن أن يكون سالباً'],
    },
  },
  {
    timestamps: true,
    collection: 'daily_inventories',
  }
);

dailyInventorySchema.index({ date: 1 });

const DailyInventory = mongoose.model('DailyInventory', dailyInventorySchema);

export default DailyInventory;
