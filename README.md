# Chicken Sales Manager

![Electron](https://img.shields.io/badge/Electron-33.x-47848F?logo=electron&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES_Modules-F7DF1E?logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-blue.svg)
![GitHub Stars](https://img.shields.io/github/stars/your-username/chicken-sales-manager?style=social)

A professional **Electron desktop application** for managing daily chicken shop operations — sales, inventory, pricing, receipts, and reporting — with a full **Arabic RTL interface**, local **MongoDB** storage, and **LAN multi-device synchronization**.

Built for shop owners who need a reliable, offline-capable point-of-sale workflow with end-of-day reporting and thermal receipt printing on **58mm** paper.

---

## Features

### Desktop & Architecture
- **Electron Desktop Application** — Native Windows desktop shell with secure preload bridge
- **Express Backend** — REST API with MVC architecture (routes → controllers → services)
- **MongoDB Database** — Persistent local storage via Mongoose ODM
- **Secure Environment Variables** — Sensitive configuration loaded from `.env` via `dotenv`

### User Interface
- **Arabic RTL Interface** — Full right-to-left layout with Cairo font (`lang="ar" dir="rtl"`)
- **Modern Responsive UI** — Custom CSS design system (no UI framework dependency)
- **Gregorian Date Formatting** — Arabic locale (`ar-EG`) with `DD/MM/YYYY` display

### Daily Operations
- **Daily Session System** — One session per calendar day with aggregated totals
- **Daily Inventory Management** — Configure opening stock per category and whole-chicken count
- **Automatic Daily Carry Over** — Unsold weight rolls forward to the next day's opening inventory
- **Inventory Tracking** — Per-category initial weight, sold weight, and remaining stock
- **Remaining Stock Calculation** — Live dashboard stats for inventory and chickens left

### Products & Pricing
- **Product Categories** — 8 default categories (whole chicken, fillet, breast, wings, etc.)
- **Independent Price Management** — Edit prices per category from the dashboard or category manager
- **Automatic Price Calculation** — Weight × price/kg computed in real time before saving

### Sales & Records
- **Sales Management** — Create sales with category, weight, and optional chicken count
- **Sales Records** — Searchable, filterable table with date range and text search
- **Edit & Delete Protection** — Administrator password required only for editing or deleting sales
- **Password Verification** — Backend-only verification against `ADMIN_PASSWORD` in `.env`

### Printing & Exports
- **Thermal Receipt Printing (58mm)** — Electron print API with receipt HTML generation
- **Reports** — Summary metrics, category breakdown, and daily sales overview
- **Excel Export** — Multi-sheet workbooks via **ExcelJS** (reports and sales records)
- **PDF Export** — Report PDF generation via **PDFKit**
- **Print Reports & Records** — Browser print support for reports and record pages

### Multi-Device & Sync
- **Multi-Device LAN Support** — Server/client deployment across a local network
- **Real-time Synchronization** — Server-Sent Events (SSE) push updates to all connected clients
- **Dashboard Statistics** — Total sales, remaining chickens, and per-category inventory cards

### Audit & Security
- **Audit Logs** — Append-only log of protected operations (edit/delete sales, failed password attempts)

---

## Screenshots

> 📸 Screenshots are placeholders. Replace these files with actual application captures before publishing.

| Dashboard | Sales Entry |
|-----------|-------------|
| `screenshots/dashboard.png` | `screenshots/sales.png` |

| Reports | Thermal Receipt |
|---------|-----------------|
| `screenshots/reports.png` | `screenshots/receipt.png` |

```markdown
<!-- Example after adding images -->
![Dashboard](screenshots/dashboard.png)
![Sales](screenshots/sales.png)
![Reports](screenshots/reports.png)
![Receipt](screenshots/receipt.png)
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop | [Electron](https://www.electronjs.org/) 33.x |
| Runtime | [Node.js](https://nodejs.org/) (ES Modules) |
| Backend | [Express.js](https://expressjs.com/) 4.x |
| Database | [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/) 8.x |
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES Modules) |
| Charts | Custom CSS bar chart (no Chart.js dependency) |
| Excel | [ExcelJS](https://github.com/exceljs/exceljs) |
| PDF | [PDFKit](https://pdfkit.org/) |
| Sync | Server-Sent Events (SSE) |
| Config | [dotenv](https://github.com/motdotla/dotenv) |

> **Note:** This project uses custom CSS — **Bootstrap is not used**.

---

## Project Structure

```
chicken-sales-manager/
├── electron/                    # Electron main process
│   ├── main.js                  # Window lifecycle, backend spawn, thermal printing IPC
│   └── preload.js               # Secure contextBridge API (print, config)
│
├── backend/                     # Express API (MVC)
│   ├── app.js                   # Express app factory & static frontend serving
│   ├── server.js                # HTTP server entry point
│   ├── config/
│   │   └── index.js             # Environment configuration loader
│   ├── constants/
│   │   └── categories.js        # Default category seed definitions
│   ├── controllers/             # HTTP request handlers
│   │   ├── authController.js    # Password verification endpoint
│   │   ├── categoryController.js
│   │   ├── inventoryController.js
│   │   ├── reportsController.js
│   │   ├── salesController.js
│   │   ├── settingsController.js
│   │   └── syncController.js    # SSE stream handler
│   ├── database/
│   │   ├── connection.js        # MongoDB connection manager
│   │   └── migrate.js           # First-run seeding & legacy migrations
│   ├── middleware/
│   │   └── requireAdminPassword.js  # Password gate for edit/delete sales
│   ├── models/                  # Mongoose schemas
│   │   ├── AuditLog.js
│   │   ├── Category.js
│   │   ├── DailyInventory.js    # Legacy collection (migrated to sessions)
│   │   ├── DailySession.js      # Primary daily session & inventory model
│   │   ├── Sale.js
│   │   └── Settings.js
│   ├── routes/                  # Express route definitions
│   │   ├── index.js             # API router mount point
│   │   ├── authRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── inventoryRoutes.js
│   │   ├── reportsRoutes.js
│   │   ├── salesRoutes.js
│   │   ├── settingsRoutes.js
│   │   └── syncRoutes.js
│   ├── services/                # Business logic layer
│   │   ├── authService.js       # Password verify & audit logging
│   │   ├── categoryService.js
│   │   ├── dashboardService.js  # Dashboard aggregation
│   │   ├── exportService.js     # Excel workbook generation
│   │   ├── inventoryService.js
│   │   ├── pdfService.js        # PDF report generation
│   │   ├── reportsService.js
│   │   ├── salesService.js
│   │   ├── sessionService.js    # Daily sessions & carry-over logic
│   │   ├── settingsService.js
│   │   └── syncService.js       # SSE broadcast events
│   └── utils/
│       ├── dateFormat.js        # Gregorian Arabic date formatting
│       ├── dateHelpers.js       # Date key utilities
│       ├── logger.js
│       └── response.js          # Standardized API responses
│
├── frontend/                    # Static SPA pages
│   ├── index.html               # Dashboard (sales entry & stats)
│   ├── records.html             # Sales records table
│   ├── reports.html             # Reports & analytics
│   ├── css/
│   │   ├── base.css             # Global styles & layout
│   │   ├── components.css       # Reusable UI components
│   │   ├── variables.css        # Design tokens
│   │   └── pages/               # Page-specific styles
│   └── js/
│       ├── api.js               # REST API client
│       ├── config.js            # Client/server mode API base URL
│       ├── sync.js              # SSE real-time sync manager
│       ├── utils.js             # Formatting, debounce, toasts
│       ├── components/
│       │   ├── navbar.js
│       │   └── passwordDialog.js  # Admin password modal
│       ├── pages/
│       │   ├── dashboard.js
│       │   ├── records.js
│       │   └── reports.js
│       └── services/
│           └── printService.js  # 58mm receipt HTML builder
│
├── screenshots/                 # Application screenshots (placeholders)
├── .env                         # Local environment variables (not committed)
├── .env.example                 # Environment template
├── package.json
└── README.md
```

### Folder Overview

| Folder | Purpose |
|--------|---------|
| `electron/` | Desktop shell — launches Express in server mode, handles thermal printing |
| `backend/` | Full REST API, database models, business logic, exports, and sync |
| `frontend/` | Arabic RTL UI served as static files by Express |
| `screenshots/` | README image assets (add your own captures here) |

---

## Installation

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** running locally (required on the **server** machine only)
- **Windows** (primary target; Electron builds NSIS installer)

### Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/chicken-sales-manager.git
   cd chicken-sales-manager
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your local settings (see below).

4. **Start MongoDB** on the server machine before launching the app.

---

## Environment Variables

Copy `.env.example` to `.env` and configure the following:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APP_MODE` | No | `server` | Application role: `server` (hosts API + DB) or `client` (connects to remote server) |
| `PORT` | No | `3000` | HTTP port for the Express API and frontend |
| `HOST` | No | `0.0.0.0` | Network bind address (`0.0.0.0` allows LAN access) |
| `MONGODB_URI` | Server only | `mongodb://127.0.0.1:27017/chicken_sales_manager` | MongoDB connection string |
| `SERVER_URL` | Client only | `http://127.0.0.1:3000` | Full URL of the server machine (e.g. `http://192.168.1.100:3000`) |
| `SHOP_NAME` | No | `مدير مبيعات الدجاج` | Shop name displayed on receipts and exports |
| `ADMIN_PASSWORD` | **Yes** | — | Administrator password for **Edit Sale** and **Delete Sale** operations |
| `ELECTRON_DEV` | No | `false` | Reserved Electron development flag |

### Example `.env` (Server)

```env
APP_MODE=server
PORT=3000
HOST=0.0.0.0
MONGODB_URI=mongodb://127.0.0.1:27017/chicken_sales_manager
SHOP_NAME=مدير مبيعات الدجاج
ADMIN_PASSWORD=your_secure_password
```

### Example `.env` (Client)

```env
APP_MODE=client
SERVER_URL=http://192.168.1.100:3000
SHOP_NAME=مدير مبيعات الدجاج
```

> ⚠️ Never commit `.env` to version control. The administrator password is verified **only on the backend** and is never stored in MongoDB.

---

## Running

### Development (Recommended)

Launches Electron with DevTools and auto-starts the Express backend in server mode:

```bash
npm run dev
```

### Production (Desktop App)

```bash
npm start
```

In **server mode**, Electron spawns `backend/server.js` as a child process, waits for it to initialize, then loads the UI at `http://127.0.0.1:PORT`.

### Backend Only (Headless Server)

Run the API without Electron (useful for debugging or dedicated server machines):

```bash
npm run server
```

### Server Mode vs Client Mode

| | **Server Mode** | **Client Mode** |
|---|-----------------|-------------------|
| `APP_MODE` | `server` | `client` |
| MongoDB | ✅ Required locally | ❌ Not required |
| Express API | ✅ Started automatically | ❌ Connects to remote server |
| Role | Primary shop computer | Secondary LAN workstation |
| Sync | Broadcasts SSE events | Receives real-time updates |

**LAN setup:** Run server mode on Computer 1 (note its IP address). Set `APP_MODE=client` and `SERVER_URL=http://<server-ip>:3000` on Computer 2. Ensure port `3000` is allowed through the server firewall.

---

## Usage

A typical daily workflow:

### 1. Configure Today's Inventory
Open the dashboard and click **مخزون اليوم** (Today's Inventory). Enter the opening chicken count and initial weight per category. If the previous day had remaining stock, it is **carried over automatically**.

### 2. Set Category Prices
Update **أسعار الفئات** (Category Prices) on the dashboard, or open **إدارة الفئات** (Manage Categories) to edit names, prices, add categories, or remove custom ones. Whole chicken (`فراخ كاملة`) is protected from deletion.

### 3. Create Sales
Select a category, enter weight (and chicken count for whole chicken), review the auto-calculated price, then click **حفظ** (Save) or **حفظ وطباعة** (Save & Print).

### 4. Print Receipt
After saving, or via **Save & Print**, a **58mm thermal receipt** is sent to the default printer through Electron's print API.

### 5. Review Records
Navigate to **السجلات** (Records). Search by text, filter by date range, view totals, and print the table. **Edit** and **Delete** require the administrator password.

### 6. Export Reports
Open **التقارير** (Reports). Review summary statistics, category breakdown, and the daily sales chart. Export to **Excel** or **PDF**, or print the report page.

### 7. Start a New Day
Change the date on the dashboard (or wait until the next calendar day). Configure inventory for the new session — unsold stock from the previous day carries forward.

---

## Security

🔐 **Edit Sale** and **Delete Sale** are the only operations that require administrator authentication.

| Action | Password Required |
|--------|:-----------------:|
| Add new sale | ❌ |
| View records / reports | ❌ |
| Search, filter, browse | ❌ |
| Print receipts / reports | ❌ |
| Export Excel / PDF | ❌ |
| Edit category prices / inventory | ❌ |
| **Edit sale** | ✅ |
| **Delete sale** | ✅ |

**How it works:**

1. User clicks **Edit** or **Delete** on the Records page.
2. A password dialog appears.
3. The password is sent to `POST /api/auth/verify` for backend validation.
4. If correct → the edit form or delete confirmation opens.
5. If incorrect → the action is blocked with an error message.
6. On submit, the password is re-validated by middleware on `PUT /api/sales/:id` and `DELETE /api/sales/:id`.

The password is loaded from the **`ADMIN_PASSWORD`** environment variable in `.env`. It is compared server-side only — never hashed in the database, never trusted from the client alone.

Failed password attempts and successful protected operations are recorded in the **audit log**.

---

## Database

MongoDB collections used by the application:

| Collection | Model | Description |
|------------|-------|-------------|
| `daily_sessions` | `DailySession` | Daily session with inventory items, totals, carry-over reference, and configuration flag |
| `sales` | `Sale` | Individual sale records linked to categories and daily sessions |
| `categories` | `Category` | Product categories with price per kg and whole-chicken flag |
| `settings` | `Settings` | Application settings (active working date) |
| `audit_logs` | `AuditLog` | Append-only log of protected operations and password failures |
| `daily_inventories` | `DailyInventory` | Legacy collection — migrated to `daily_sessions` on first run |

**First-run migration** (`backend/database/migrate.js`) automatically:
- Seeds 8 default Arabic categories
- Migrates legacy inventory documents to daily sessions
- Links historical sales to session documents

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/settings` | Dashboard data (session, categories, stats) |
| `PUT` | `/api/settings/date` | Change active working date |
| `GET/POST` | `/api/categories` | List / create categories |
| `PUT/DELETE` | `/api/categories/:id` | Update / delete category |
| `GET/POST` | `/api/inventory` | Get / save daily inventory |
| `GET/POST` | `/api/sales` | List / create sales |
| `PUT/DELETE` | `/api/sales/:id` | Update / delete sale 🔒 |
| `POST` | `/api/auth/verify` | Verify administrator password |
| `GET` | `/api/reports` | Generate report data |
| `GET` | `/api/reports/export/excel` | Export report as Excel |
| `GET` | `/api/reports/export/pdf` | Export report as PDF |
| `GET` | `/api/reports/export/sales-excel` | Export sales records as Excel |
| `GET` | `/api/sync/events` | SSE real-time event stream |
| `GET` | `/api/sync/status` | Sync connection status |

🔒 = Requires `adminPassword` in request body.

---

## Future Improvements

- [ ] User management with role-based access control
- [ ] Cloud backup and restore
- [ ] Barcode / QR code support for products
- [ ] Multi-language interface (English + Arabic)
- [ ] Automatic application updates (Electron auto-updater)
- [ ] Cloud sync beyond LAN
- [ ] Mobile companion app for remote monitoring
- [ ] Sales analytics dashboard with advanced charts
- [ ] Customer accounts and credit tracking
- [ ] Built-in audit log viewer in the UI

---

## License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 Mazen Mahmoud

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Author

**Mazen Mahmoud**

Desktop application developer — building practical tools for retail and inventory management.

- GitHub: [@Mazen-Mahmoud-Mohamed](https://github.com/Mazen-Mahmoud-Mohamed)
- Repository: `https://github.com/Mazen-Mahmoud-Mohamed/Chicken-Sales-Inventory-Manager`

---

## Notes

- Restart the application after changing `ADMIN_PASSWORD` in `.env`.
- Default categories are seeded once on first database connection.
- The UI is entirely in **Arabic**; this README is in English for open-source documentation.
- For production deployment, replace placeholder screenshot paths and GitHub URLs before publishing.
