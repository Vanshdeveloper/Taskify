const { app, BrowserWindow, ipcMain, nativeImage, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

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
        if (process.platform === 'darwin' && app.dock) {
          app.dock.setIcon(img);
        }
      }
    } catch (err) {
      console.error('Failed to set dynamic window icon:', err);
    }
  }
});

function downloadFileWithRedirects(fileUrl, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(fileUrl);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const req = client.get(
      fileUrl,
      {
        headers: {
          'User-Agent': 'Taskify-Desktop-App',
          Accept: 'application/octet-stream',
        },
      },
      (res) => {
        // Handle 301/302/307/308 redirects (GitHub Releases redirect to AWS S3)
        if (
          res.statusCode === 301 ||
          res.statusCode === 302 ||
          res.statusCode === 307 ||
          res.statusCode === 308
        ) {
          if (res.headers.location) {
            return downloadFileWithRedirects(res.headers.location, destPath, onProgress)
              .then(resolve)
              .catch(reject);
          }
        }

        if (res.statusCode !== 200) {
          return reject(new Error(`Server returned HTTP ${res.statusCode}`));
        }

        const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
        let bytesDownloaded = 0;
        let lastNotifyTime = 0;

        const fileStream = fs.createWriteStream(destPath);

        res.on('data', (chunk) => {
          bytesDownloaded += chunk.length;
          const now = Date.now();
          if (now - lastNotifyTime > 150) {
            lastNotifyTime = now;
            const progress = totalBytes > 0 ? Math.round((bytesDownloaded * 100) / totalBytes) : -1;
            onProgress({
              status: 'downloading',
              progress,
              bytesDownloaded,
              totalBytes,
            });
          }
        });

        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close(() => {
            onProgress({
              status: 'completed',
              progress: 100,
              bytesDownloaded,
              totalBytes,
              filePath: destPath,
            });
            resolve(destPath);
          });
        });

        fileStream.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      }
    );

    req.on('error', (err) => {
      reject(err);
    });
  });
}

ipcMain.handle('download-and-install-update', async (event, { url, fileName }) => {
  try {
    const tempDir = app.getPath('temp');
    const safeName = fileName || (process.platform === 'win32' ? 'Taskify-Setup.exe' : 'Taskify-Update');
    const destPath = path.join(tempDir, safeName);

    if (fs.existsSync(destPath)) {
      try {
        fs.unlinkSync(destPath);
      } catch {}
    }

    await downloadFileWithRedirects(url, destPath, (progressData) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-progress', progressData);
      }
    });

    // Launch downloaded installer
    await shell.openPath(destPath);

    return { success: true, filePath: destPath };
  } catch (err) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-progress', {
        status: 'error',
        error: err.message || 'Download failed',
      });
    }
    throw err;
  }
});

ipcMain.handle('install-downloaded-update', async (event, filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    await shell.openPath(filePath);
    return { success: true };
  }
  return { success: false, error: 'File does not exist' };
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
