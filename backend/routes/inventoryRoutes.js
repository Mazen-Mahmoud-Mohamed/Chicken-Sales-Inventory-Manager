import { Router } from 'express';
import * as inventoryController from '../controllers/inventoryController.js';

const router = Router();

router.get('/', inventoryController.getInventory);
router.post('/', inventoryController.saveInventory);

export default router;
