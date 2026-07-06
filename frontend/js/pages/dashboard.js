import { renderNavbar } from '../components/navbar.js';
import api from '../api.js';
import syncManager from '../sync.js';
import { printReceipt } from '../services/printService.js';
import { formatNumber, formatDateInput, showToast, calculatePrice, debounce } from '../utils.js';

let dashboard = null;
let categories = [];
let isSaving = false;

const elements = {};

function cacheElements() {
  elements.currentDate = document.getElementById('currentDate');
  elements.inventoryBtn = document.getElementById('inventoryBtn');
  elements.categoriesBtn = document.getElementById('categoriesBtn');
  elements.inventoryAlert = document.getElementById('inventoryAlert');
  elements.categoryPricesGrid = document.getElementById('categoryPricesGrid');
  elements.categorySelect = document.getElementById('categorySelect');
  elements.weightInput = document.getElementById('weightInput');
  elements.chickenCountGroup = document.getElementById('chickenCountGroup');
  elements.chickenCountInput = document.getElementById('chickenCountInput');
  elements.calculatedPrice = document.getElementById('calculatedPrice');
  elements.saveBtn = document.getElementById('saveBtn');
  elements.savePrintBtn = document.getElementById('savePrintBtn');
  elements.statTotalSales = document.getElementById('statTotalSales');
  elements.statRemainingChickens = document.getElementById('statRemainingChickens');
  elements.categoryInventoryGrid = document.getElementById('categoryInventoryGrid');
  elements.inventoryModal = document.getElementById('inventoryModal');
  elements.inventoryForm = document.getElementById('inventoryForm');
  elements.inventoryDate = document.getElementById('inventoryDate');
  elements.inventoryChickenCount = document.getElementById('inventoryChickenCount');
  elements.inventoryItemsGrid = document.getElementById('inventoryItemsGrid');
  elements.cancelInventoryBtn = document.getElementById('cancelInventoryBtn');
  elements.categoriesModal = document.getElementById('categoriesModal');
  elements.categoriesTableBody = document.getElementById('categoriesTableBody');
  elements.newCategoryName = document.getElementById('newCategoryName');
  elements.newCategoryPrice = document.getElementById('newCategoryPrice');
  elements.addCategoryBtn = document.getElementById('addCategoryBtn');
  elements.closeCategoriesBtn = document.getElementById('closeCategoriesBtn');
}

function getSelectedCategory() {
  const id = elements.categorySelect.value;
  return categories.find((c) => c._id === id);
}

function renderCategoryPrices() {
  elements.categoryPricesGrid.innerHTML = categories
    .map(
      (cat) => `
      <div class="category-price-item">
        <label for="price-${cat._id}">${cat.name}</label>
        <input type="number" id="price-${cat._id}" data-id="${cat._id}"
          min="0" step="0.01" value="${cat.pricePerKg}">
      </div>`
    )
    .join('');

  elements.categoryPricesGrid.querySelectorAll('input').forEach((input) => {
    input.addEventListener('focus', (e) => {
      e.target.dataset.previousValue = e.target.value;
    });

    input.addEventListener(
      'change',
      debounce(async () => {
        try {
          await api.updateCategory(input.dataset.id, {
            pricePerKg: parseFloat(input.value) || 0,
          });
          const cat = categories.find((c) => c._id === input.dataset.id);
          if (cat) cat.pricePerKg = parseFloat(input.value) || 0;
          updateCalculatedPrice();
          showToast('تم تحديث السعر');
        } catch (err) {
          showToast(err.message, 'error');
        }
      }, 500)
    );
  });
}

function renderCategorySelect() {
  elements.categorySelect.innerHTML = categories
    .map((cat) => `<option value="${cat._id}">${cat.name}</option>`)
    .join('');
  onCategoryChange();
}

function onCategoryChange() {
  const cat = getSelectedCategory();
  const isWhole = cat?.isWholeChicken;
  elements.chickenCountGroup.classList.toggle('hidden', !isWhole);
  updateCalculatedPrice();
}

function renderCategoryInventory() {
  if (!dashboard?.categoryInventory?.length) {
    elements.categoryInventoryGrid.innerHTML =
      '<p class="text-muted">لا يوجد مخزون لهذا اليوم</p>';
    return;
  }

  elements.categoryInventoryGrid.innerHTML = dashboard.categoryInventory
    .map(
      (item) => `
      <div class="stat-card">
        <div class="stat-card-label">${item.categoryName}</div>
        <div class="stat-card-value">
          <span>${formatNumber(item.remainingWeight)}</span>
          <span class="stat-card-unit">كجم</span>
        </div>
      </div>`
    )
    .join('');
}

function updateDashboardUI(data) {
  dashboard = data;
  categories = data.categories || categories;

  elements.currentDate.value = data.dateKey || formatDateInput(data.date);
  elements.statTotalSales.textContent = formatNumber(data.totalSales || 0);
  elements.statRemainingChickens.textContent = data.remainingChickens ?? 0;

  if (data.needsInventory) {
    elements.inventoryAlert.textContent = 'يرجى إعداد مخزون اليوم للبدء في المبيعات';
    elements.inventoryAlert.classList.remove('hidden');
  } else if (data.carriedOver) {
    elements.inventoryAlert.textContent = 'تم نقل المخزون المتبقي من اليوم السابق تلقائياً';
    elements.inventoryAlert.classList.remove('hidden');
    elements.inventoryAlert.style.background = 'rgba(45, 106, 79, 0.1)';
    elements.inventoryAlert.style.borderColor = 'var(--color-primary)';
    elements.inventoryAlert.style.color = 'var(--color-primary-dark)';
  } else {
    elements.inventoryAlert.classList.add('hidden');
  }

  renderCategoryPrices();
  renderCategorySelect();
  renderCategoryInventory();
}

function updateCalculatedPrice() {
  const weight = parseFloat(elements.weightInput.value) || 0;
  const cat = getSelectedCategory();
  const pricePerKg = cat?.pricePerKg || 0;
  elements.calculatedPrice.textContent = formatNumber(calculatePrice(weight, pricePerKg));
}

function clearSaleForm() {
  elements.weightInput.value = '';
  elements.chickenCountInput.value = '';
  elements.calculatedPrice.textContent = '0.00';
}

function renderInventoryForm() {
  elements.inventoryDate.value = dashboard.dateKey || formatDateInput(dashboard.date);
  elements.inventoryChickenCount.value =
    dashboard.inventory?.chickenCount ?? dashboard.chickenCount ?? '';

  const partCategories = categories.filter((c) => !c.isWholeChicken);
  elements.inventoryItemsGrid.innerHTML = partCategories
    .map((cat) => {
      const existing = dashboard.inventory?.items?.find(
        (i) => i.categoryId?.toString() === cat._id.toString()
      );
      return `
        <div class="inventory-item-field">
          <label for="inv-${cat._id}">${cat.name} (كجم)</label>
          <input type="number" id="inv-${cat._id}" data-id="${cat._id}"
            class="form-input" min="0" step="0.01"
            value="${existing?.initialWeight ?? ''}" placeholder="0.00">
        </div>`;
    })
    .join('');

  const wholeCat = categories.find((c) => c.isWholeChicken);
  if (wholeCat) {
    const existing = dashboard.inventory?.items?.find(
      (i) => i.categoryId?.toString() === wholeCat._id.toString()
    );
    const wholeField = document.createElement('div');
    wholeField.className = 'inventory-item-field';
    wholeField.innerHTML = `
      <label for="inv-whole-weight">وزن الفراخ الكاملة (كجم)</label>
      <input type="number" id="inv-whole-weight" data-id="${wholeCat._id}"
        class="form-input" min="0" step="0.01"
        value="${existing?.initialWeight ?? ''}" placeholder="0.00">`;
    elements.inventoryItemsGrid.prepend(wholeField);
  }
}

function openInventoryModal() {
  renderInventoryForm();
  elements.inventoryModal.classList.remove('hidden');
}

function closeInventoryModal() {
  elements.inventoryModal.classList.add('hidden');
}

async function handleInventorySubmit(e) {
  e.preventDefault();

  const items = [];
  elements.inventoryItemsGrid.querySelectorAll('input[data-id]').forEach((input) => {
    items.push({
      categoryId: input.dataset.id,
      initialWeight: parseFloat(input.value) || 0,
    });
  });

  try {
    const result = await api.saveInventory({
      date: elements.inventoryDate.value || dashboard.dateKey,
      chickenCount: parseInt(elements.inventoryChickenCount.value, 10) || 0,
      items,
    });
    updateDashboardUI(result);
    closeInventoryModal();
    showToast('تم حفظ مخزون اليوم بنجاح');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderCategoriesTable() {
  elements.categoriesTableBody.innerHTML = categories
    .map(
      (cat) => `
      <tr>
        <td>
          ${cat.isWholeChicken
            ? cat.name
            : `<input type="text" class="form-input cat-name-input" data-id="${cat._id}" value="${cat.name}">`}
        </td>
        <td>
          <input type="number" class="form-input cat-price-input" data-id="${cat._id}"
            min="0" step="0.01" value="${cat.pricePerKg}">
        </td>
        <td>
          ${cat.isWholeChicken
            ? '<span class="text-muted">—</span>'
            : `<button type="button" class="btn btn-sm btn-danger delete-cat-btn" data-id="${cat._id}">حذف</button>`}
        </td>
      </tr>`
    )
    .join('');

  elements.categoriesTableBody.querySelectorAll('.cat-name-input').forEach((input) => {
    input.addEventListener('focus', (e) => {
      e.target.dataset.previousValue = e.target.value;
    });

    input.addEventListener('change', async () => {
      const previousValue = input.dataset.previousValue;
      try {
        await api.updateCategory(input.dataset.id, { name: input.value });
        await reloadDashboard();
        showToast('تم تحديث اسم الفئة');
      } catch (err) {
        showToast(err.message, 'error');
        input.value = previousValue;
      }
    });
  });

  elements.categoriesTableBody.querySelectorAll('.cat-price-input').forEach((input) => {
    input.addEventListener('focus', (e) => {
      e.target.dataset.previousValue = e.target.value;
    });

    input.addEventListener('change', async () => {
      const previousValue = input.dataset.previousValue;
      try {
        await api.updateCategory(input.dataset.id, {
          pricePerKg: parseFloat(input.value) || 0,
        });
        await reloadDashboard();
        showToast('تم تحديث السعر');
      } catch (err) {
        showToast(err.message, 'error');
        input.value = previousValue;
      }
    });
  });

  elements.categoriesTableBody.querySelectorAll('.delete-cat-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('هل أنت متأكد من حذف هذه الفئة؟')) return;
      try {
        await api.deleteCategory(btn.dataset.id);
        await reloadDashboard();
        renderCategoriesTable();
        showToast('تم حذف الفئة');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });
}

function openCategoriesModal() {
  renderCategoriesTable();
  elements.categoriesModal.classList.remove('hidden');
}

function closeCategoriesModal() {
  elements.categoriesModal.classList.add('hidden');
}

async function handleAddCategory() {
  const name = elements.newCategoryName.value.trim();
  const pricePerKg = parseFloat(elements.newCategoryPrice.value) || 0;
  if (!name) {
    showToast('يرجى إدخال اسم الفئة', 'error');
    return;
  }

  try {
    await api.createCategory({ name, pricePerKg });
    elements.newCategoryName.value = '';
    elements.newCategoryPrice.value = '';
    await reloadDashboard();
    renderCategoriesTable();
    showToast('تم إضافة الفئة');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function reloadDashboard() {
  const data = await api.getSettings();
  categories = data.categories || [];
  updateDashboardUI(data);
  return data;
}

async function handleSave(printAfter = false) {
  if (isSaving) return;

  const categoryId = elements.categorySelect.value;
  const weight = parseFloat(elements.weightInput.value);
  const cat = getSelectedCategory();

  if (!categoryId) {
    showToast('يرجى اختيار الفئة', 'error');
    return;
  }

  if (!weight || weight <= 0) {
    showToast('يرجى إدخال وزن صحيح', 'error');
    elements.weightInput.focus();
    return;
  }

  if (dashboard?.needsInventory) {
    showToast('يجب إعداد مخزون اليوم أولاً', 'error');
    openInventoryModal();
    return;
  }

  const payload = { categoryId, weight };
  if (cat?.isWholeChicken) {
    const chickenCount = parseInt(elements.chickenCountInput.value, 10);
    if (!chickenCount || chickenCount <= 0) {
      showToast('يرجى إدخال عدد فراخ صحيح', 'error');
      elements.chickenCountInput.focus();
      return;
    }
    payload.chickenCount = chickenCount;
  }

  isSaving = true;
  elements.saveBtn.disabled = true;
  elements.savePrintBtn.disabled = true;

  try {
    const result = await api.createSale(payload);
    updateDashboardUI(result.settings);
    showToast('تم حفظ عملية البيع بنجاح');

    if (printAfter) {
      await printReceipt(result.sale, result.settings);
    }

    clearSaleForm();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    isSaving = false;
    elements.saveBtn.disabled = false;
    elements.savePrintBtn.disabled = false;
  }
}

function bindEvents() {
  elements.currentDate.addEventListener('change', async () => {
    try {
      const data = await api.updateSettings({ date: elements.currentDate.value });
      updateDashboardUI(data);
      if (data.needsInventory) openInventoryModal();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  elements.categorySelect.addEventListener('change', onCategoryChange);
  elements.weightInput.addEventListener('input', updateCalculatedPrice);
  elements.inventoryBtn.addEventListener('click', openInventoryModal);
  elements.categoriesBtn.addEventListener('click', openCategoriesModal);
  elements.saveBtn.addEventListener('click', () => handleSave(false));
  elements.savePrintBtn.addEventListener('click', () => handleSave(true));
  elements.inventoryForm.addEventListener('submit', handleInventorySubmit);
  elements.cancelInventoryBtn.addEventListener('click', closeInventoryModal);
  elements.addCategoryBtn.addEventListener('click', handleAddCategory);
  elements.closeCategoriesBtn.addEventListener('click', closeCategoriesModal);

  elements.inventoryModal.addEventListener('click', (e) => {
    if (e.target === elements.inventoryModal) closeInventoryModal();
  });

  elements.categoriesModal.addEventListener('click', (e) => {
    if (e.target === elements.categoriesModal) closeCategoriesModal();
  });

  elements.weightInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const cat = getSelectedCategory();
      if (cat?.isWholeChicken) elements.chickenCountInput.focus();
      else handleSave(false);
    }
  });

  elements.chickenCountInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSave(false);
  });
}

function bindSyncEvents() {
  syncManager.on('settings:updated', (data) => updateDashboardUI(data));
  syncManager.on('inventory:updated', (data) => updateDashboardUI(data));
  syncManager.on('categories:updated', async () => {
    await reloadDashboard();
  });
  syncManager.on('sale:created', ({ settings }) => updateDashboardUI(settings));
  syncManager.on('sale:updated', ({ settings }) => updateDashboardUI(settings));
  syncManager.on('sale:deleted', ({ settings }) => updateDashboardUI(settings));
}

async function init() {
  renderNavbar('dashboard');
  cacheElements();
  bindEvents();
  bindSyncEvents();

  try {
    const data = await reloadDashboard();
    if (data.carriedOver) {
      showToast('تم نقل المخزون المتبقي من اليوم السابق');
    }
    if (data.needsInventory) {
      openInventoryModal();
    }
  } catch (err) {
    showToast('فشل تحميل الإعدادات. هل الخادم يعمل؟', 'error');
  }

  elements.categorySelect.focus();
}

init();
