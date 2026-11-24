const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setAppIcon: (dataUrl) => ipcRenderer.send('set-window-icon', dataUrl),
  downloadAndInstallUpdate: (url, fileName) =>
    ipcRenderer.invoke('download-and-install-update', { url, fileName }),
  installDownloadedUpdate: (filePath) =>
    ipcRenderer.invoke('install-downloaded-update', filePath),
  onUpdateProgress: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('update-progress', handler);
    return () => ipcRenderer.removeListener('update-progress', handler);
  },
});
