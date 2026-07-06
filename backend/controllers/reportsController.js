import * as reportsService from '../services/reportsService.js';
import { generateExcelBuffer, generateSalesExcelBuffer } from '../services/exportService.js';
import { generatePdfBuffer } from '../services/pdfService.js';
import { success, error } from '../utils/response.js';
import config from '../config/index.js';

export async function getReport(req, res) {
  try {
    const { dateFrom, dateTo } = req.query;
    const report = await reportsService.generateReport({ dateFrom, dateTo });
    return success(res, report);
  } catch (err) {
    return error(res, err.message);
  }
}

export async function exportReportExcel(req, res) {
  try {
    const { dateFrom, dateTo } = req.query;
    const report = await reportsService.generateReport({ dateFrom, dateTo });
    const buffer = await generateExcelBuffer(report, config.shopName);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');
    return res.send(buffer);
  } catch (err) {
    return error(res, err.message);
  }
}

export async function exportSalesExcel(req, res) {
  try {
    const { dateFrom, dateTo } = req.query;
    const report = await reportsService.generateReport({ dateFrom, dateTo });
    const buffer = await generateSalesExcelBuffer(report.sales, config.shopName);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-records.xlsx');
    return res.send(buffer);
  } catch (err) {
    return error(res, err.message);
  }
}

export async function exportReportPdf(req, res) {
  try {
    const { dateFrom, dateTo } = req.query;
    const report = await reportsService.generateReport({ dateFrom, dateTo });
    const buffer = await generatePdfBuffer(report, config.shopName);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
    return res.send(buffer);
  } catch (err) {
    return error(res, err.message);
  }
}
