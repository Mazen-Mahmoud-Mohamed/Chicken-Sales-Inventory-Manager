import { Router } from 'express';
import settingsRoutes from './settingsRoutes.js';
import salesRoutes from './salesRoutes.js';
import reportsRoutes from './reportsRoutes.js';
import syncRoutes from './syncRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import authRoutes from './authRoutes.js';
import config from '../config/index.js';
import { getConnectionStatus } from '../database/connection.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      mode: config.appMode,
      shopName: config.shopName,
      database: getConnectionStatus(),
    },
  });
});

router.use('/settings', settingsRoutes);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/sales', salesRoutes);
router.use('/reports', reportsRoutes);
router.use('/sync', syncRoutes);

export default router;
