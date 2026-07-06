import AppConfig from '../config.js';
import { formatNumber, getCurrentTime, formatDate } from '../utils.js';

/**
 * Thermal receipt printing service (58mm width).
 * Uses Electron's native print API when available.
 */
export function generateReceiptHtml(sale, settings) {
  const shopName = AppConfig.shopName;
  const now = new Date();
  const date = formatDate(settings?.date || now);
  const time = sale?.saleTime || getCurrentTime();
  const categoryName = sale?.categoryName || '—';
  const chickenLine =
    sale?.chickenCount > 0
      ? `<div class="row"><span>عدد الفراخ:</span><span>${sale.chickenCount}</span></div>`
      : '';

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Cairo', 'Courier New', monospace;
      width: 58mm;
      padding: 4mm;
      font-size: 11px;
      line-height: 1.4;
      direction: rtl;
      text-align: right;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .large { font-size: 14px; }
    .divider {
      border-top: 1px dashed #000;
      margin: 6px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
    }
    .total {
      font-size: 16px;
      font-weight: bold;
      margin-top: 4px;
    }
    .thank-you {
      margin-top: 8px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="center bold large">${shopName}</div>
  <div class="divider"></div>
  <div class="row"><span>التاريخ:</span><span>${date}</span></div>
  <div class="row"><span>الوقت:</span><span>${time}</span></div>
  <div class="divider"></div>
  <div class="row"><span>الفئة:</span><span>${categoryName}</span></div>
  <div class="row"><span>الوزن:</span><span>${formatNumber(sale.weight)} كجم</span></div>
  ${chickenLine}
  <div class="row"><span>سعر الكيلو:</span><span>${formatNumber(sale.pricePerKg)}</span></div>
  <div class="divider"></div>
  <div class="row total">
    <span>الإجمالي:</span>
    <span>${formatNumber(sale.totalPrice)}</span>
  </div>
  <div class="divider"></div>
  <div class="center thank-you">شكراً لتعاملكم معنا</div>
  <div class="center">نتطلع لزيارتكم مجدداً</div>
</body>
</html>`;
}

export async function printReceipt(sale, settings) {
  const html = generateReceiptHtml(sale, settings);

  if (window.electronAPI?.printReceipt) {
    await window.electronAPI.printReceipt(html);
    return true;
  }

  const printWindow = window.open('', '_blank', 'width=220,height=600');
  if (!printWindow) throw new Error('تعذر فتح نافذة الطباعة');

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
  return true;
}
