import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/index.js';
import config from './config/index.js';
import logger from './utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Create and configure the Express application.
 */
export function createApp() {
  const app = express();

  app.use(cors({ origin: '*' }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/api', apiRoutes);

  const frontendPath = path.join(__dirname, '../frontend');
  app.use(express.static(frontendPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    const page = req.path === '/' ? 'index.html' : `${req.path.replace(/^\//, '')}.html`;
    const filePath = path.join(frontendPath, page);

    res.sendFile(filePath, (err) => {
      if (err) {
        res.sendFile(path.join(frontendPath, 'index.html'));
      }
    });
  });

  app.use((err, req, res, _next) => {
    logger.error('Unhandled error:', err.message);
    res.status(500).json({
      success: false,
      message: 'خطأ داخلي في الخادم',
    });
  });

  return app;
}

export default createApp;
