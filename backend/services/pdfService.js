import PDFDocument from 'pdfkit';
import { formatDateGregorian } from '../utils/dateFormat.js';

/**
 * Generate PDF report buffer.
 */
export function generatePdfBuffer(report, shopName) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text(shopName, { align: 'center' });
      doc.fontSize(14).text('تقرير المبيعات', { align: 'center' });
      doc.moveDown();

      const { summary } = report;
      doc.fontSize(12).text('الملخص', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`إجمالي المبلغ: ${summary.totalMoney.toFixed(2)}`);
      doc.text(`الوزن المباع: ${summary.soldWeight.toFixed(2)} كجم`);
      doc.text(`الفراخ المباعة: ${summary.soldChickens}`);
      doc.text(`عدد الفراخ المتبقي: ${summary.remainingChickens}`);
      doc.text(`عدد المبيعات: ${summary.totalSalesCount}`);
      doc.moveDown();

      doc.fontSize(12).text('المبيعات حسب الفئة', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(9);

      for (const cat of report.categoryBreakdown || []) {
        const remainingText = cat.isWholeChicken
          ? `المتبقي: ${cat.remainingChickens ?? 0} فرخ`
          : `المتبقي: ${cat.remaining.toFixed(2)} كجم`;
        const chickensText = cat.isWholeChicken ? ` | الفراخ المباعة: ${cat.soldChickens ?? 0}` : '';
        doc.text(
          `${cat.categoryName} | الوزن المباع: ${cat.soldWeight.toFixed(2)} كجم${chickensText} | الإيرادات: ${cat.revenue.toFixed(2)} | ${remainingText}`
        );
      }

      doc.moveDown();
      doc.fontSize(12).text('التفصيل اليومي', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(9);

      for (const day of report.dailySales) {
        const dayLabel = day.dateIso ? formatDateGregorian(day.dateIso) : day.date;
        doc.text(
          `${dayLabel} | المبلغ: ${day.totalMoney.toFixed(2)} | الوزن: ${day.soldWeight.toFixed(2)} كجم | الفراخ: ${day.soldChickens}`
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
