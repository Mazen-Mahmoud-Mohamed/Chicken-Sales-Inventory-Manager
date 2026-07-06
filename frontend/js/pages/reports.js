import { renderNavbar } from '../components/navbar.js';
import api from '../api.js';
import syncManager from '../sync.js';
import { formatNumber, formatDateInput, formatDateShort, showToast, downloadBlob } from '../utils.js';

let currentReport = null;

const elements = {};

function cacheElements() {
  elements.reportDateFrom = document.getElementById('reportDateFrom');
  elements.reportDateTo = document.getElementById('reportDateTo');
  elements.generateReportBtn = document.getElementById('generateReportBtn');
  elements.printReportBtn = document.getElementById('printReportBtn');
  elements.exportPdfBtn = document.getElementById('exportPdfBtn');
  elements.exportExcelBtn = document.getElementById('exportExcelBtn');
  elements.reportTotalMoney = document.getElementById('reportTotalMoney');
  elements.reportSoldWeight = document.getElementById('reportSoldWeight');
  elements.reportSoldChickens = document.getElementById('reportSoldChickens');
  elements.reportRemainingChickens = document.getElementById('reportRemainingChickens');
  elements.reportSalesCount = document.getElementById('reportSalesCount');
  elements.categoryReportGrid = document.getElementById('categoryReportGrid');
  elements.chartBars = document.getElementById('chartBars');
  elements.dailySalesBody = document.getElementById('dailySalesBody');
}

function renderSummary(summary) {
  elements.reportTotalMoney.textContent = formatNumber(summary.totalMoney);
  elements.reportSoldWeight.textContent = formatNumber(summary.soldWeight);
  elements.reportSoldChickens.textContent = summary.soldChickens;
  elements.reportRemainingChickens.textContent = summary.remainingChickens;
  elements.reportSalesCount.textContent = summary.totalSalesCount;
}

function renderCategoryBreakdown(categoryBreakdown) {
  if (!categoryBreakdown?.length) {
    elements.categoryReportGrid.innerHTML =
      '<p class="text-muted">لا توجد بيانات للفئات</p>';
    return;
  }

  elements.categoryReportGrid.innerHTML = categoryBreakdown
    .map((cat) => {
      const remainingLine = cat.isWholeChicken
        ? `<div class="category-report-row">
            <span>الفراخ المتبقية:</span>
            <strong>${cat.remainingChickens ?? 0}</strong>
          </div>`
        : `<div class="category-report-row">
            <span>المتبقي:</span>
            <strong>${formatNumber(cat.remaining)} كجم</strong>
          </div>`;

      const soldLine = cat.isWholeChicken
        ? `<div class="category-report-row">
            <span>الفراخ المباعة:</span>
            <strong>${cat.soldChickens ?? 0}</strong>
          </div>`
        : '';

      return `
      <div class="category-report-card">
        <h4 class="category-report-name">${cat.categoryName}</h4>
        <div class="category-report-row">
          <span>الوزن المباع:</span>
          <strong>${formatNumber(cat.soldWeight)} كجم</strong>
        </div>
        ${soldLine}
        <div class="category-report-row">
          <span>الإيرادات:</span>
          <strong>${formatNumber(cat.revenue)} جنيه</strong>
        </div>
        ${remainingLine}
      </div>`;
    })
    .join('');
}

function renderChart(dailySales) {
  if (!dailySales.length) {
    elements.chartBars.innerHTML =
      '<p class="text-muted text-center" style="width:100%">لا توجد بيانات للرسم البياني</p>';
    return;
  }

  const maxMoney = Math.max(...dailySales.map((d) => d.totalMoney), 1);

  elements.chartBars.innerHTML = dailySales
    .map((day) => {
      const height = Math.max((day.totalMoney / maxMoney) * 160, 4);
      const label = day.dateIso ? formatDateShort(day.dateIso) : day.date;
      return `
        <div class="chart-bar-group">
          <div class="chart-bar-value">${formatNumber(day.totalMoney)}</div>
          <div class="chart-bar" style="height: ${height}px"></div>
          <div class="chart-bar-label">${label}</div>
        </div>`;
    })
    .join('');
}

function renderDailyTable(dailySales) {
  if (!dailySales.length) {
    elements.dailySalesBody.innerHTML =
      '<tr><td colspan="5" class="text-center text-muted">لا توجد بيانات يومية</td></tr>';
    return;
  }

  elements.dailySalesBody.innerHTML = dailySales
    .map(
      (day) => `
      <tr>
        <td>${day.date}</td>
        <td>${formatNumber(day.totalMoney)}</td>
        <td>${formatNumber(day.soldWeight)}</td>
        <td>${day.soldChickens}</td>
        <td>${day.salesCount}</td>
      </tr>`
    )
    .join('');
}

async function generateReport() {
  try {
    const params = {};
    if (elements.reportDateFrom.value) params.dateFrom = elements.reportDateFrom.value;
    if (elements.reportDateTo.value) params.dateTo = elements.reportDateTo.value;

    currentReport = await api.getReport(params);
    renderSummary(currentReport.summary);
    renderCategoryBreakdown(currentReport.categoryBreakdown);
    renderChart(currentReport.dailySales);
    renderDailyTable(currentReport.dailySales);
    showToast('تم إنشاء التقرير');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function getExportParams() {
  const params = {};
  if (elements.reportDateFrom.value) params.dateFrom = elements.reportDateFrom.value;
  if (elements.reportDateTo.value) params.dateTo = elements.reportDateTo.value;
  return params;
}

async function handleExportPdf() {
  try {
    const { blob } = await api.exportReportPdf(getExportParams());
    downloadBlob(blob, 'sales-report.pdf');
    showToast('تم تصدير PDF بنجاح');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleExportExcel() {
  try {
    const { blob } = await api.exportReportExcel(getExportParams());
    downloadBlob(blob, 'sales-report.xlsx');
    showToast('تم تصدير Excel بنجاح');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function handlePrint() {
  window.print();
}

function bindEvents() {
  elements.generateReportBtn.addEventListener('click', generateReport);
  elements.printReportBtn.addEventListener('click', handlePrint);
  elements.exportPdfBtn.addEventListener('click', handleExportPdf);
  elements.exportExcelBtn.addEventListener('click', handleExportExcel);
}

function bindSyncEvents() {
  syncManager.on('sale:created', () => {
    if (currentReport) generateReport();
  });
  syncManager.on('sale:updated', () => {
    if (currentReport) generateReport();
  });
  syncManager.on('sale:deleted', () => {
    if (currentReport) generateReport();
  });
}

async function init() {
  renderNavbar('reports');
  cacheElements();
  bindEvents();
  bindSyncEvents();

  try {
    const settings = await api.getSettings();
    const today = formatDateInput(settings.date);
    elements.reportDateFrom.value = today;
    elements.reportDateTo.value = today;
    await generateReport();
  } catch (err) {
    showToast('فشل تحميل بيانات التقرير', 'error');
  }
}

init();
