import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'اسم الفئة مطلوب'],
      trim: true,
      unique: true,
    },
    pricePerKg: {
      type: Number,
      required: [true, 'سعر الكيلو مطلوب'],
      min: [0, 'سعر الكيلو لا يمكن أن يكون سالباً'],
      default: 0,
    },
    isWholeChicken: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'categories',
  }
);

categorySchema.index({ sortOrder: 1 });

const Category = mongoose.model('Category', categorySchema);

export default Category;
