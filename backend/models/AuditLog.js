import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: () => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
      },
    },
    time: {
      type: String,
      required: true,
    },
    operation: {
      type: String,
      required: true,
      trim: true,
    },
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      default: null,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    categoryName: {
      type: String,
      default: null,
      trim: true,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    result: {
      type: String,
      enum: ['SUCCESS', 'FAILED_PASSWORD'],
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'audit_logs',
  }
);

auditLogSchema.index({ date: -1, createdAt: -1 });
auditLogSchema.index({ operation: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
