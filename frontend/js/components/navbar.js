import AppConfig from '../config.js';
import syncManager from '../sync.js';

/**
 * Reusable navigation bar component.
 */
export function renderNavbar(activePage = 'dashboard') {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const pages = [
    { id: 'dashboard', label: 'الرئيسية', href: 'index.html' },
    { id: 'records', label: 'السجلات', href: 'records.html' },
    { id: 'reports', label: 'التقارير', href: 'reports.html' },
  ];

  navbar.innerHTML = `
    <div class="navbar-brand">
      <div class="navbar-logo">🐔</div>
      <span class="navbar-title">${AppConfig.shopName}</span>
    </div>
    <div class="navbar-nav">
      ${pages
        .map(
          (p) =>
            `<a href="${p.href}" class="nav-link ${p.id === activePage ? 'active' : ''}">${p.label}</a>`
        )
        .join('')}
    </div>
    <div class="sync-indicator">
      <span class="sync-dot"></span>
      <span class="sync-label">جاري الاتصال...</span>
    </div>
  `;

  syncManager.connect();
}
