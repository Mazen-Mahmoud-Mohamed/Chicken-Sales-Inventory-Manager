import { renderNavbar } from '../components/navbar.js';
import api from '../api.js';
import syncManager from '../sync.js';
import { requestAdminPassword } from '../components/passwordDialog.js';
import { formatNumber, formatDate, showToast, debounce, downloadBlob } from '../utils.js';

let sales = [];
let deleteTargetId = null;
let pendingAdminPassword = null;

const elements = {};

function cacheElements() {
  elements.searchInput = document.getElementById('searchInput');
  elements.dateFrom = document.getElementById('dateFrom');
  elements.dateTo = document.getElementById('dateTo');
  elements.filterBtn = document.getElementById('filterBtn');
  elements.clearFilterBtn = document.getElementById('clearFilterBtn');
  elements.recordsBody = document.getElementById('recordsBody');
  elements.recordsSummary = document.getElementById('recordsSummary');
  elements.exportExcelBtn = document.getElementById('exportExcelBtn');
  elements.printRecordsBtn = document.getElementById('printRecordsBtn');
  elements.editModal = document.getElementById('editModal');
  elements.deleteModal = document.getElementById('deleteModal');
  elements.editForm = document.getElementById('editForm');
  elements.editSaleId = document.getElementById('editSaleId');
  elements.editWeight = document.getElementById('editWeight');
  elements.editChickenCount = document.getElementById('editChickenCount');
  elements.editChickenCountGroup = document.getElementById('editChickenCountGroup');
  elements.cancelEditBtn = document.getElementById('cancelEditBtn');
  elements.cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  elements.confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
}

function renderTable(records) {
  if (!records.length) {
    elements.recordsBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">
          <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <p>لا توجد سجلات مبيعات</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  elements.recordsBody.innerHTML = records
    .map(
      (sale) => `
      <tr data-id="${sale._id}">
        <td>${formatDate(sale.saleDate)}</td>
        <td>${sale.saleTime}</td>
        <td>${sale.categoryName || '—'}</td>
        <td>${formatNumber(sale.weight)}</td>
        <td>${formatNumber(sale.pricePerKg)}</td>
        <td>${formatNumber(sale.totalPrice)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-secondary edit-btn" data-id="${sale._id}">تعديل</button>
            <button class="btn btn-sm btn-danger delete-btn" data-id="${sale._id}">حذف</button>
          </div>
        </td>
      </tr>`
    )
    .join('');

  document.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleEditClick(btn.dataset.id));
  });

  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleDeleteClick(btn.dataset.id));
  });
}

function updateSummary(records) {
  const totalWeight = records.reduce((s, r) => s + r.weight, 0);
  const totalChickens = records.reduce((s, r) => s + (r.chickenCount || 0), 0);
  const totalMoney = records.reduce((s, r) => s + r.totalPrice, 0);

  elements.recordsSummary.innerHTML = `
    <div class="summary-item">السجلات: <strong>${records.length}</strong></div>
    <div class="summary-item">إجمالي الوزن: <strong>${formatNumber(totalWeight)} كجم</strong></div>
    <div class="summary-item">إجمالي الفراخ: <strong>${totalChickens}</strong></div>
    <div class="summary-item">إجمالي المبلغ: <strong>${formatNumber(totalMoney)}</strong></div>
  `;
}

async function loadRecords() {
  try {
    const params = {};
    if (elements.searchInput.value) params.search = elements.searchInput.value;
    if (elements.dateFrom.value) params.dateFrom = elements.dateFrom.value;
    if (elements.dateTo.value) params.dateTo = elements.dateTo.value;

    const result = await api.getSales(params);
    sales = result.sales;
    renderTable(sales);
    updateSummary(sales);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleEditClick(id) {
  try {
    const adminPassword = await requestAdminPassword();
    await api.verifyAdminPassword(adminPassword);
    pendingAdminPassword = adminPassword;
    openEditModal(id);
  } catch (err) {
    if (err.message !== 'cancelled') {
      showToast(err.message, 'error');
    }
  }
}

function openEditModal(id) {
  const sale = sales.find((s) => s._id === id);
  if (!sale) return;

  elements.editSaleId.value = id;
  elements.editWeight.value = sale.weight;
  elements.editChickenCount.value = sale.chickenCount || '';

  const isWhole = (sale.chickenCount || 0) > 0;
  if (elements.editChickenCountGroup) {
    elements.editChickenCountGroup.classList.toggle('hidden', !isWhole);
  }

  elements.editModal.classList.remove('hidden');
}

function closeEditModal() {
  elements.editModal.classList.add('hidden');
  pendingAdminPassword = null;
}

async function handleDeleteClick(id) {
  try {
    const adminPassword = await requestAdminPassword();
    await api.verifyAdminPassword(adminPassword);
    pendingAdminPassword = adminPassword;
    openDeleteModal(id);
  } catch (err) {
    if (err.message !== 'cancelled') {
      showToast(err.message, 'error');
    }
  }
}

function openDeleteModal(id) {
  deleteTargetId = id;
  elements.deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
  deleteTargetId = null;
  pendingAdminPassword = null;
  elements.deleteModal.classList.add('hidden');
}

async function handleEditSubmit(e) {
  e.preventDefault();

  if (!pendingAdminPassword) {
    showToast('كلمة المرور مطلوبة', 'error');
    return;
  }

  const sale = sales.find((s) => s._id === elements.editSaleId.value);
  const payload = { weight: parseFloat(elements.editWeight.value) };

  if (sale?.chickenCount > 0) {
    payload.chickenCount = parseInt(elements.editChickenCount.value, 10);
  }

  try {
    await api.updateSale(elements.editSaleId.value, payload, pendingAdminPassword);
    showToast('تم تحديث عملية البيع بنجاح');
    closeEditModal();
    await loadRecords();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleDelete() {
  if (!deleteTargetId || !pendingAdminPassword) return;

  try {
    await api.deleteSale(deleteTargetId, pendingAdminPassword);
    showToast('تم حذف عملية البيع بنجاح');
    closeDeleteModal();
    await loadRecords();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleExportExcel() {
  try {
    const params = {};
    if (elements.dateFrom.value) params.dateFrom = elements.dateFrom.value;
    if (elements.dateTo.value) params.dateTo = elements.dateTo.value;

    const { blob } = await api.exportSalesExcel(params);
    downloadBlob(blob, 'sales-records.xlsx');
    showToast('تم تصدير Excel بنجاح');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function handlePrint() {
  window.print();
}

function bindEvents() {
  elements.filterBtn.addEventListener('click', loadRecords);
  elements.clearFilterBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    elements.dateFrom.value = '';
    elements.dateTo.value = '';
    loadRecords();
  });

  elements.searchInput.addEventListener('input', debounce(loadRecords, 400));
  elements.exportExcelBtn.addEventListener('click', handleExportExcel);
  elements.printRecordsBtn.addEventListener('click', handlePrint);
  elements.editForm.addEventListener('submit', handleEditSubmit);
  elements.cancelEditBtn.addEventListener('click', closeEditModal);
  elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  elements.confirmDeleteBtn.addEventListener('click', handleDelete);

  elements.editModal.addEventListener('click', (e) => {
    if (e.target === elements.editModal) closeEditModal();
  });

  elements.deleteModal.addEventListener('click', (e) => {
    if (e.target === elements.deleteModal) closeDeleteModal();
  });
}

function bindSyncEvents() {
  syncManager.on('sale:created', () => loadRecords());
  syncManager.on('sale:updated', () => loadRecords());
  syncManager.on('sale:deleted', () => loadRecords());
}

async function init() {
  renderNavbar('records');
  cacheElements();
  bindEvents();
  bindSyncEvents();
  await loadRecords();
}

init();
