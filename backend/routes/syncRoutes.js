import { Router } from 'express';
import * as syncController from '../controllers/syncController.js';

const router = Router();

router.get('/events', syncController.streamEvents);
router.get('/status', syncController.getSyncStatus);

export default router;
