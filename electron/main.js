import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

let mainWindow = null;
let serverProcess = null;

const PORT = process.env.PORT || 3000;
const APP_MODE = process.env.APP_MODE || 'server';
const isDev = process.argv.includes('--dev');

/**
 * Start the Express backend as a child process (server mode only).
 */
function startBackendServer() {
  if (APP_MODE !== 'server') return;

  const serverPath = path.join(__dirname, '../backend/server.js');

  serverProcess = spawn(process.execPath, [serverPath], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    stdio: 'inherit',
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start backend server:', err);
  });

  serverProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`Backend server exited with code ${code}`);
    }
  });
}

/**
 * Resolve the URL to load in the browser window.
 */
function getAppUrl() {
  if (APP_MODE === 'client') {
    const serverUrl = process.env.SERVER_URL || `http://127.0.0.1:${PORT}`;
    return serverUrl;
  }
  return `http://127.0.0.1:${PORT}`;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'مدير مبيعات الدجاج',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    backgroundColor: '#f0f4f8',
  });

  const url = getAppUrl();
  mainWindow.loadURL(url);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Print thermal receipt (58mm) using the default printer.
 */
ipcMain.handle('print-receipt', async (_event, receiptHtml) => {
  const printWindow = new BrowserWindow({
    width: 220,
    height: 600,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await printWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(receiptHtml)}`
  );

  return new Promise((resolve, reject) => {
    printWindow.webContents.print(
      {
        silent: false,
        printBackground: true,
        deviceName: '',
        margins: { marginType: 'none' },
        pageSize: {
          width: 58000,
          height: 200000,
        },
      },
      (success, failureReason) => {
        printWindow.close();
        if (success) {
          resolve({ success: true });
        } else {
          reject(new Error(failureReason || 'فشلت الطباعة'));
        }
      }
    );
  });
});

ipcMain.handle('get-app-config', () => ({
  mode: APP_MODE,
  port: PORT,
  shopName: process.env.SHOP_NAME || 'مدير مبيعات الدجاج',
  serverUrl: process.env.SERVER_URL || `http://127.0.0.1:${PORT}`,
}));

app.whenReady().then(() => {
  if (APP_MODE === 'server') {
    startBackendServer();
    setTimeout(createWindow, 1500);
  } else {
    createWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});
