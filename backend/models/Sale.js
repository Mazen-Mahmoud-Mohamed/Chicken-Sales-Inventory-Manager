import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema(
  {
    saleDate: {
      type: Date,
      required: [true, 'تاريخ البيع مطلوب'],
    },
    saleTime: {
      type: String,
      required: [true, 'وقت البيع مطلوب'],
      trim: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    categoryName: {
      type: String,
      trim: true,
      default: 'فراخ كاملة',
    },
    weight: {
      type: Number,
      required: [true, 'الوزن مطلوب'],
      min: [0.01, 'الوزن يجب أن يكون أكبر من صفر'],
    },
    chickenCount: {
      type: Number,
      default: 0,
      min: [0, 'عدد الفراخ لا يمكن أن يكون سالباً'],
    },
    pricePerKg: {
      type: Number,
      required: [true, 'سعر الكيلو مطلوب'],
      min: [0, 'سعر الكيلو لا يمكن أن يكون سالباً'],
    },
    totalPrice: {
      type: Number,
      required: [true, 'السعر الإجمالي مطلوب'],
      min: [0, 'السعر الإجمالي لا يمكن أن يكون سالباً'],
    },
    dailySessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DailySession',
    },
  },
  {
    timestamps: true,
    collection: 'sales',
  }
);

saleSchema.index({ saleDate: -1, saleTime: -1 });
saleSchema.index({ categoryId: 1 });
saleSchema.index({ dailySessionId: 1 });

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;
