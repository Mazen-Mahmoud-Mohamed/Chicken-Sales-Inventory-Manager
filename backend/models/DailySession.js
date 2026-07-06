import mongoose from 'mongoose';

const categoryInventorySchema = new mongoose.Schema(
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
      min: [0, 'الكمية الابتدائية لا يمكن أن تكون سالبة'],
    },
    soldWeight: {
      type: Number,
      default: 0,
      min: [0, 'الكمية المباعة لا يمكن أن تكون سالبة'],
    },
  },
  { _id: false }
);

const dailySessionSchema = new mongoose.Schema(
  {
    dateKey: {
      type: String,
      required: [true, 'مفتاح التاريخ مطلوب'],
      unique: true,
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'التاريخ مطلوب'],
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
    totalSales: {
      type: Number,
      default: 0,
      min: [0, 'إجمالي المبيعات لا يمكن أن يكون سالباً'],
    },
    carriedFromDateKey: {
      type: String,
      default: null,
    },
    inventoryConfigured: {
      type: Boolean,
      default: false,
    },
    items: {
      type: [categoryInventorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'daily_sessions',
  }
);

dailySessionSchema.index({ date: 1 });

const DailySession = mongoose.model('DailySession', dailySessionSchema);

export default DailySession;
