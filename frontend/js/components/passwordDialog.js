/**
 * Reusable administrator password dialog.
 * Returns a Promise that resolves with the entered password or rejects on cancel.
 */

let mounted = false;
let pending = null;
let elements = {};

function mountPasswordDialog() {
  if (mounted) return;

  const html = `
    <div class="modal-overlay hidden" id="passwordModal">
      <div class="modal">
        <h3 class="modal-title">كلمة المرور مطلوبة</h3>
        <form id="passwordForm">
          <div class="form-group">
            <label class="form-label" for="adminPasswordInput">كلمة مرور المسؤول</label>
            <div class="password-input-wrap">
              <input type="password" id="adminPasswordInput" class="form-input"
                placeholder="أدخل كلمة المرور" autocomplete="off" required>
              <button type="button" id="togglePasswordBtn" class="btn btn-sm btn-secondary password-toggle-btn"
                aria-label="إظهار كلمة المرور">إظهار</button>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" id="passwordCancelBtn" class="btn btn-secondary">إلغاء</button>
            <button type="submit" id="passwordConfirmBtn" class="btn btn-primary">تأكيد</button>
          </div>
        </form>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', html);

  elements.modal = document.getElementById('passwordModal');
  elements.form = document.getElementById('passwordForm');
  elements.input = document.getElementById('adminPasswordInput');
  elements.toggleBtn = document.getElementById('togglePasswordBtn');
  elements.cancelBtn = document.getElementById('passwordCancelBtn');

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = elements.input.value.trim();
    if (!password) return;
    closeDialog();
    pending?.resolve(password);
    pending = null;
  });

  elements.cancelBtn.addEventListener('click', () => {
    closeDialog();
    pending?.reject(new Error('cancelled'));
    pending = null;
  });

  elements.toggleBtn.addEventListener('click', () => {
    const isHidden = elements.input.type === 'password';
    elements.input.type = isHidden ? 'text' : 'password';
    elements.toggleBtn.textContent = isHidden ? 'إخفاء' : 'إظهار';
  });

  elements.modal.addEventListener('click', (e) => {
    if (e.target === elements.modal) {
      closeDialog();
      pending?.reject(new Error('cancelled'));
      pending = null;
    }
  });

  mounted = true;
}

function openDialog() {
  elements.modal.classList.remove('hidden');
  elements.input.type = 'password';
  elements.input.value = '';
  elements.toggleBtn.textContent = 'إظهار';
  setTimeout(() => elements.input.focus(), 50);
}

function closeDialog() {
  elements.modal.classList.add('hidden');
  elements.input.value = '';
  elements.input.type = 'password';
  elements.toggleBtn.textContent = 'إظهار';
}

/**
 * Show password dialog and return entered password.
 * Rejects with Error('cancelled') if user closes or cancels.
 */
export function requestAdminPassword() {
  mountPasswordDialog();
  openDialog();

  return new Promise((resolve, reject) => {
    pending = { resolve, reject };
  });
}

/**
 * Run an async action that requires admin password.
 * The callback receives the password to include in API requests.
 */
export async function withAdminPassword(callback) {
  const adminPassword = await requestAdminPassword();
  return callback(adminPassword);
}
