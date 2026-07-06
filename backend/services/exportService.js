import ExcelJS from 'exceljs';
import { formatDateGregorian } from '../utils/dateFormat.js';

/**
 * Generate Excel workbook for reports page export.
 */
export async function generateExcelBuffer(report, shopName) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = shopName;
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet('الملخص');
  summarySheet.columns = [
    { header: 'البند', key: 'metric', width: 25 },
    { header: 'القيمة', key: 'value', width: 20 },
  ];

  const { summary } = report;
  summarySheet.addRows([
    { metric: 'إجمالي المبلغ', value: summary.totalMoney },
    { metric: 'الوزن المباع (كجم)', value: summary.soldWeight },
    { metric: 'الفراخ المباعة', value: summary.soldChickens },
    { metric: 'عدد الفراخ المتبقي', value: summary.remainingChickens },
    { metric: 'عدد المبيعات', value: summary.totalSalesCount },
  ]);

  styleHeaderRow(summarySheet);

  const categorySheet = workbook.addWorksheet('المبيعات حسب الفئة');
  categorySheet.columns = [
    { header: 'الفئة', key: 'categoryName', width: 20 },
    { header: 'الوزن المباع (كجم)', key: 'soldWeight', width: 18 },
    { header: 'الفراخ المباعة', key: 'soldChickens', width: 14 },
    { header: 'الإيرادات', key: 'revenue', width: 15 },
    { header: 'المتبقي (كجم)', key: 'remaining', width: 15 },
    { header: 'الفراخ المتبقية', key: 'remainingChickens', width: 16 },
    { header: 'عدد المبيعات', key: 'salesCount', width: 15 },
    { header: 'سعر الكيلو', key: 'pricePerKg', width: 12 },
  ];

  categorySheet.addRows(report.categoryBreakdown || []);
  styleHeaderRow(categorySheet);

  const dailySheet = workbook.addWorksheet('المبيعات اليومية');
  dailySheet.columns = [
    { header: 'التاريخ', key: 'date', width: 15 },
    { header: 'إجمالي المبلغ', key: 'totalMoney', width: 15 },
    { header: 'الوزن المباع', key: 'soldWeight', width: 15 },
    { header: 'الفراخ المباعة', key: 'soldChickens', width: 15 },
    { header: 'عدد المبيعات', key: 'salesCount', width: 15 },
  ];

  dailySheet.addRows(report.dailySales);
  styleHeaderRow(dailySheet);

  const salesSheet = workbook.addWorksheet('جميع المبيعات');
  salesSheet.columns = [
    { header: 'التاريخ', key: 'date', width: 15 },
    { header: 'الوقت', key: 'time', width: 12 },
    { header: 'الفئة', key: 'category', width: 16 },
    { header: 'الوزن', key: 'weight', width: 12 },
    { header: 'عدد الفراخ', key: 'chickens', width: 12 },
    { header: 'سعر الكيلو', key: 'pricePerKg', width: 12 },
    { header: 'السعر الإجمالي', key: 'totalPrice', width: 15 },
  ];

  for (const sale of report.sales) {
    salesSheet.addRow({
      date: formatDateGregorian(sale.saleDate),
      time: sale.saleTime,
      category: sale.categoryName,
      weight: sale.weight,
      chickens: sale.chickenCount || 0,
      pricePerKg: sale.pricePerKg,
      totalPrice: sale.totalPrice,
    });
  }

  styleHeaderRow(salesSheet);

  return workbook.xlsx.writeBuffer();
}

/**
 * Generate Excel workbook for records page export.
 */
export async function generateSalesExcelBuffer(sales, shopName) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = shopName;

  const sheet = workbook.addWorksheet('سجلات المبيعات');
  sheet.columns = [
    { header: 'التاريخ', key: 'date', width: 15 },
    { header: 'الوقت', key: 'time', width: 12 },
    { header: 'الفئة', key: 'category', width: 16 },
    { header: 'الوزن (كجم)', key: 'weight', width: 14 },
    { header: 'عدد الفراخ', key: 'chickenCount', width: 14 },
    { header: 'سعر الكيلو', key: 'pricePerKg', width: 14 },
    { header: 'السعر الإجمالي', key: 'totalPrice', width: 15 },
  ];

  for (const sale of sales) {
    sheet.addRow({
      date: formatDateGregorian(sale.saleDate),
      time: sale.saleTime,
      category: sale.categoryName,
      weight: sale.weight,
      chickenCount: sale.chickenCount || 0,
      pricePerKg: sale.pricePerKg,
      totalPrice: sale.totalPrice,
    });
  }

  styleHeaderRow(sheet);
  return workbook.xlsx.writeBuffer();
}

function styleHeaderRow(sheet) {
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2D6A4F' },
  };
}
