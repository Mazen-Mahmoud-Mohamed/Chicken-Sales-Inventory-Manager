import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  printReceipt: (receiptHtml) => ipcRenderer.invoke('print-receipt', receiptHtml),
  getAppConfig: () => ipcRenderer.invoke('get-app-config'),
  isElectron: true,
});
