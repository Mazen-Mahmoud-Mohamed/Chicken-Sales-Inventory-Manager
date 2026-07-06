import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'التاريخ مطلوب'],
      default: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
      },
    },
  },
  {
    timestamps: true,
    collection: 'settings',
  }
);

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
