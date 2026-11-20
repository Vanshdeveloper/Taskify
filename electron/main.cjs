const { app, BrowserWindow, ipcMain, nativeImage } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, 'icon.ico')
    : path.join(__dirname, 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 800,
    minHeight: 600,
    title: 'Taskify',
    icon: iconPath,
    backgroundColor: '#160f0d',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
}

ipcMain.on('set-window-icon', (event, dataUrl) => {
  if (mainWindow && !mainWindow.isDestroyed() && dataUrl) {
    try {
      const img = nativeImage.createFromDataURL(dataUrl);
      if (!img.isEmpty()) {
        mainWindow.setIcon(img);
      }
    } catch (err) {
      console.error('Failed to set dynamic window icon:', err);
    }
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
