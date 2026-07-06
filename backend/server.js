import { createApp } from './app.js';
import { connectDatabase } from './database/connection.js';
import { runMigrations } from './database/migrate.js';
import config from './config/index.js';
import logger from './utils/logger.js';

/**
 * Start the Express server.
 * On the server machine, connects to MongoDB before listening.
 */
async function startServer() {
  try {
    if (config.isServer()) {
      await connectDatabase();
      await runMigrations();
      logger.info('Running in SERVER mode with MongoDB');
    } else {
      logger.info(`Running in CLIENT mode — API proxy to ${config.serverUrl}`);
    }

    const app = createApp();

    app.listen(config.port, config.host, () => {
      logger.info(`Chicken Sales Manager API running at http://${config.host}:${config.port}`);
      logger.info(`LAN clients can connect at http://<server-ip>:${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
