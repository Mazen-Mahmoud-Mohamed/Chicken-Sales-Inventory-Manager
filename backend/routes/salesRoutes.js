import { Router } from 'express';
import * as salesController from '../controllers/salesController.js';
import { requireAdminPassword } from '../middleware/requireAdminPassword.js';

const router = Router();

router.get('/calculate', salesController.calculatePrice);
router.get('/', salesController.getSales);
router.get('/:id', salesController.getSaleById);
router.post('/', salesController.createSale);
router.put('/:id', requireAdminPassword('EDIT_SALE'), salesController.updateSale);
router.delete('/:id', requireAdminPassword('DELETE_SALE'), salesController.deleteSale);

export default router;
