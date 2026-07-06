import { Router } from 'express';
import * as reportsController from '../controllers/reportsController.js';

const router = Router();

router.get('/', reportsController.getReport);
router.get('/export/excel', reportsController.exportReportExcel);
router.get('/export/pdf', reportsController.exportReportPdf);
router.get('/export/sales-excel', reportsController.exportSalesExcel);

export default router;
