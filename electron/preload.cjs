const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setAppIcon: (dataUrl) => ipcRenderer.send('set-window-icon', dataUrl),
});
