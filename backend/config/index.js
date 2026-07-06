import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  appMode: process.env.APP_MODE || 'server',
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || '0.0.0.0',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chicken_sales_manager',
  serverUrl: process.env.SERVER_URL || 'http://127.0.0.1:3000',
  shopName: process.env.SHOP_NAME || 'مدير مبيعات الدجاج',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  isServer: () => (process.env.APP_MODE || 'server') === 'server',
  isClient: () => process.env.APP_MODE === 'client',
};

export default config;
