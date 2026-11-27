import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { TaskifyNativeWidget } from './widgetSync';

export const APP_VERSION = '1.0.25';
export const GITHUB_REPO = 'Vanshdeveloper/Taskify';
export const GITHUB_RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

export type AppPlatform = 'windows' | 'mac' | 'linux' | 'android' | 'ios' | 'web';

export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
  content_type?: string;
}

export interface ReleaseInfo {
  version: string;
  tagName: string;
  name: string;
  notes: string;
  publishedAt: string;
  assets: ReleaseAsset[];
  downloadUrl: string | null;
  assetName: string | null;
  platform: AppPlatform;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  release: ReleaseInfo | null;
  checkedAt: number;
  error?: string;
}

/**
 * Detect the active platform using Capacitor native checks and userAgent.
 */
export function detectPlatform(): AppPlatform {
  if (typeof window === 'undefined') return 'web';

  try {
    if (Capacitor.isNativePlatform()) {
      const plat = Capacitor.getPlatform();
      if (plat === 'android') return 'android';
      if (plat === 'ios') return 'ios';
    }
  } catch {
    // Ignore Capacitor check error in non-native contexts
  }

  const ua = (navigator.userAgent || '').toLowerCase();
  if (ua.includes('android')) return 'android';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) return 'ios';
  if (ua.includes('win')) return 'windows';
  if (ua.includes('macintosh') || ua.includes('mac os')) return 'mac';
  if (ua.includes('linux')) return 'linux';

  return 'web';
}

/**
 * Returns human-readable platform label.
 */
export function getPlatformLabel(platform: AppPlatform): string {
  switch (platform) {
    case 'windows':
      return 'Windows (x64 / .exe)';
    case 'mac':
      return 'macOS (.dmg)';
    case 'linux':
      return 'Linux (.AppImage)';
    case 'android':
      return 'Android (.apk)';
    case 'ios':
      return 'iOS';
    default:
      return 'Web Application';
  }
}

/**
 * Finds the direct platform binary installer asset from GitHub release assets.
 */
export function findPlatformAsset(
  assets: ReleaseAsset[],
  platform: AppPlatform
): { downloadUrl: string; assetName: string } | null {
  if (!assets || assets.length === 0) return null;

  let matched: ReleaseAsset | undefined;

  if (platform === 'windows') {
    // Windows Setup .exe
    matched = assets.find((a) => a.name.toLowerCase().endsWith('.exe'));
  } else if (platform === 'mac') {
    // macOS .dmg or .pkg
    matched = assets.find(
      (a) => a.name.toLowerCase().endsWith('.dmg') || a.name.toLowerCase().endsWith('.pkg')
    );
  } else if (platform === 'linux') {
    // Linux .AppImage or .deb
    matched = assets.find(
      (a) => a.name.toLowerCase().endsWith('.appimage') || a.name.toLowerCase().endsWith('.deb')
    );
  } else if (platform === 'android') {
    // Android .apk
    matched = assets.find((a) => a.name.toLowerCase().endsWith('.apk'));
  } else if (platform === 'ios') {
    // iOS does not allow direct sideloaded binary installers
    return null;
  }

  // Fallback to any standalone executable / archive
  if (!matched) {
    matched = assets.find((a) => {
      const n = a.name.toLowerCase();
      return (
        n.endsWith('.exe') ||
        n.endsWith('.dmg') ||
        n.endsWith('.appimage') ||
        n.endsWith('.apk') ||
        n.endsWith('.zip')
      );
    });
  }

  if (matched) {
    return {
      downloadUrl: matched.browser_download_url,
      assetName: matched.name,
    };
  }

  // If no binary matches, fallback to first asset if available
  if (assets[0]) {
    return {
      downloadUrl: assets[0].browser_download_url,
      assetName: assets[0].name,
    };
  }

  return null;
}

/**
 * Compares two semantic version strings (e.g., '1.0.2' vs '1.0.1').
 * Returns > 0 if v1 > v2, < 0 if v1 < v2, and 0 if equal.
 */
export function compareSemver(v1: string, v2: string): number {
  const clean1 = (v1 || '').replace(/^v/i, '').trim();
  const clean2 = (v2 || '').replace(/^v/i, '').trim();

  // Normalize delimiters to handle dotted sub-versions and build increments
  const normalized1 = clean1.replace(/[-+]/g, '.');
  const normalized2 = clean2.replace(/[-+]/g, '.');

  const parts1 = normalized1.split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = normalized2.split('.').map((p) => parseInt(p, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] ?? 0;
    const num2 = parts2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

const CACHE_KEY = 'taskify_update_cache';
const LAST_CHECK_KEY = 'taskify_update_last_check';
const THROTTLE_MS = 30 * 60 * 1000; // 30 minutes cache for auto-check

/**
 * Checks GitHub Releases API for a newer version.
 * Caches results to stay within GitHub rate limits unless force=true.
 */
export async function checkForAppUpdates(options?: {
  force?: boolean;
}): Promise<UpdateCheckResult> {
  const currentVersion = APP_VERSION;
  const now = Date.now();
  const force = !!options?.force;

  if (!force && typeof localStorage !== 'undefined') {
    try {
      const lastCheck = Number(localStorage.getItem(LAST_CHECK_KEY) || '0');
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached && now - lastCheck < THROTTLE_MS) {
        const parsed: UpdateCheckResult = JSON.parse(cached);
        if (parsed.currentVersion === currentVersion) {
          return parsed;
        }
      }
    } catch {
      // Storage access or parse failed, continue fetch
    }
  }

  try {
    const res = await fetch(GITHUB_RELEASES_API, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      const errResult: UpdateCheckResult = {
        hasUpdate: false,
        currentVersion,
        latestVersion: currentVersion,
        release: null,
        checkedAt: now,
        error: res.status === 404 ? 'No published releases found yet' : `HTTP ${res.status}`,
      };
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(LAST_CHECK_KEY, String(now));
          localStorage.setItem(CACHE_KEY, JSON.stringify(errResult));
        }
      } catch {}
      return errResult;
    }

    const data = await res.json();
    const tagName: string = data.tag_name || '';
    const latestVersion = tagName.replace(/^v/i, '').trim() || currentVersion;
    const hasUpdate = compareSemver(latestVersion, currentVersion) > 0;
    const platform = detectPlatform();
    const rawAssets: ReleaseAsset[] = (data.assets || []).map((a: any) => ({
      name: a.name || 'unknown',
      browser_download_url: a.browser_download_url || '',
      size: a.size || 0,
      content_type: a.content_type,
    }));

    const matchedAsset = findPlatformAsset(rawAssets, platform);

    const release: ReleaseInfo = {
      version: latestVersion,
      tagName,
      name: data.name || tagName,
      notes: data.body || '',
      publishedAt: data.published_at || '',
      assets: rawAssets,
      downloadUrl: matchedAsset ? matchedAsset.downloadUrl : null,
      assetName: matchedAsset ? matchedAsset.assetName : null,
      platform,
    };

    const result: UpdateCheckResult = {
      hasUpdate,
      currentVersion,
      latestVersion,
      release,
      checkedAt: now,
    };

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LAST_CHECK_KEY, String(now));
        localStorage.setItem(CACHE_KEY, JSON.stringify(result));
      }
    } catch {}

    appUpdaterStore.setUpdateResult(result);
    return result;
  } catch (err: any) {
    const netErrResult: UpdateCheckResult = {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      release: null,
      checkedAt: now,
      error: err?.message || 'Network error while checking updates',
    };
    return netErrResult;
  }
}

/**
 * Triggers direct binary file download without taking the user to GitHub.
 */
export function triggerDirectDownload(url: string, fileName?: string): boolean {
  if (!url || typeof document === 'undefined') return false;

  // On Capacitor Native (Android / iOS), delegate directly to system browser / DownloadManager
  try {
    if (Capacitor.isNativePlatform()) {
      window.open(url, '_system');
      return true;
    }
  } catch {
    // Continue with standard DOM download
  }

  try {
    const link = document.createElement('a');
    link.href = url;
    if (fileName) {
      link.download = fileName;
    } else {
      link.setAttribute('download', '');
    }
    link.rel = 'noopener noreferrer';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch {
    // If standard DOM link click fails, fallback to window.open
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Format bytes into human-readable MB / KB string
 */
export function formatDownloadSize(bytes: number): string {
  if (bytes <= 0 || isNaN(bytes)) return '0 MB';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type UpdateStateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'installing'
  | 'completed'
  | 'error';

export interface AppUpdaterSnapshot {
  status: UpdateStateStatus;
  progress: number; // 0 to 100
  bytesDownloaded: number;
  totalBytes: number;
  filePath: string | null;
  error: string | null;
  updateResult: UpdateCheckResult | null;
  isChecking: boolean;
}

/**
 * Stateful cross-platform in-app updater singleton.
 * Downloads release binaries in the background and automatically executes the native OS installer.
 */
class AppUpdaterStore {
  private snapshot: AppUpdaterSnapshot = {
    status: 'idle',
    progress: 0,
    bytesDownloaded: 0,
    totalBytes: 0,
    filePath: null,
    error: null,
    updateResult: null,
    isChecking: false,
  };

  private listeners = new Set<(snapshot: AppUpdaterSnapshot) => void>();
  private activeDownloadAbort: AbortController | null = null;

  public getState(): AppUpdaterSnapshot {
    return { ...this.snapshot };
  }

  public subscribe = (listener: (snapshot: AppUpdaterSnapshot) => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify() {
    const current = this.getState();
    this.listeners.forEach((l) => {
      try {
        l(current);
      } catch {}
    });
  }

  public setUpdateResult(result: UpdateCheckResult | null) {
    this.snapshot.updateResult = result;
    if (result?.hasUpdate && result.release?.downloadUrl) {
      if (this.snapshot.status === 'idle' || this.snapshot.status === 'checking') {
        this.snapshot.status = 'available';
      }
    }
    this.notify();
  }

  public async checkForUpdates(options?: { force?: boolean }): Promise<UpdateCheckResult> {
    this.snapshot.isChecking = true;
    this.snapshot.status = 'checking';
    this.snapshot.error = null;
    this.notify();

    try {
      const res = await checkForAppUpdates(options);
      this.snapshot.updateResult = res;
      this.snapshot.isChecking = false;

      if (res.hasUpdate && res.release?.downloadUrl) {
        this.snapshot.status = 'available';
      } else {
        this.snapshot.status = 'idle';
      }
      this.notify();
      return res;
    } catch (err: any) {
      this.snapshot.isChecking = false;
      this.snapshot.error = err?.message || 'Check failed';
      this.snapshot.status = 'error';
      this.notify();
      throw err;
    }
  }

  /**
   * Downloads package binary in background and automatically launches native installer.
   */
  public async startDownloadAndInstall(): Promise<boolean> {
    const release = this.snapshot.updateResult?.release;
    const downloadUrl = release?.downloadUrl;
    if (!downloadUrl) {
      this.snapshot.error = 'No download URL available';
      this.snapshot.status = 'error';
      this.notify();
      return false;
    }

    const version = release.version || APP_VERSION;
    const fileName =
      release.assetName ||
      (release.platform === 'android'
        ? `Taskify-v${version}.apk`
        : release.platform === 'windows'
        ? `Taskify-Setup-${version}.exe`
        : `Taskify-${version}`);

    this.snapshot.status = 'downloading';
    this.snapshot.progress = 0;
    this.snapshot.bytesDownloaded = 0;
    this.snapshot.totalBytes = 0;
    this.snapshot.error = null;
    this.notify();

    // 1. Android Native Background Download & Intent Execution
    try {
      if (
        Capacitor.isNativePlatform() &&
        Capacitor.getPlatform() === 'android' &&
        typeof TaskifyNativeWidget.downloadAndInstallUpdate === 'function'
      ) {
        let listenerHandle: any = null;
        if (typeof TaskifyNativeWidget.addListener === 'function') {
          listenerHandle = await TaskifyNativeWidget.addListener('updateProgress', (data: any) => {
            if (data.status === 'downloading') {
              this.snapshot.progress = data.progress ?? this.snapshot.progress;
              this.snapshot.bytesDownloaded = data.bytesDownloaded ?? this.snapshot.bytesDownloaded;
              this.snapshot.totalBytes = data.totalBytes ?? this.snapshot.totalBytes;
              this.notify();
            } else if (data.status === 'completed') {
              this.snapshot.status = 'installing';
              this.snapshot.progress = 100;
              this.snapshot.filePath = data.filePath || null;
              this.notify();
            } else if (data.status === 'error') {
              this.snapshot.status = 'error';
              this.snapshot.error = data.error || 'Download failed';
              this.notify();
            }
          });
        }

        const res = await TaskifyNativeWidget.downloadAndInstallUpdate({
          url: downloadUrl,
          version,
          fileName,
        });

        if (listenerHandle?.remove) {
          listenerHandle.remove().catch(() => {});
        }

        this.snapshot.status = 'completed';
        this.snapshot.progress = 100;
        this.snapshot.filePath = res.filePath || null;
        this.notify();
        return true;
      }
    } catch (err: any) {
      console.warn('[Updater] Android native download error, falling back:', err);
    }

    // 2. Desktop Electron Background Download & Shell Execution
    try {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI && typeof electronAPI.downloadAndInstallUpdate === 'function') {
        let removeProgress: (() => void) | null = null;
        if (typeof electronAPI.onUpdateProgress === 'function') {
          removeProgress = electronAPI.onUpdateProgress((data: any) => {
            if (data.status === 'downloading') {
              this.snapshot.progress = data.progress ?? this.snapshot.progress;
              this.snapshot.bytesDownloaded = data.bytesDownloaded ?? this.snapshot.bytesDownloaded;
              this.snapshot.totalBytes = data.totalBytes ?? this.snapshot.totalBytes;
              this.notify();
            } else if (data.status === 'completed') {
              this.snapshot.status = 'installing';
              this.snapshot.progress = 100;
              this.snapshot.filePath = data.filePath || null;
              this.notify();
            } else if (data.status === 'error') {
              this.snapshot.status = 'error';
              this.snapshot.error = data.error || 'Download failed';
              this.notify();
            }
          });
        }

        const res = await electronAPI.downloadAndInstallUpdate(downloadUrl, fileName);
        if (removeProgress) removeProgress();

        this.snapshot.status = 'completed';
        this.snapshot.progress = 100;
        this.snapshot.filePath = res.filePath || null;
        this.notify();
        return true;
      }
    } catch (err: any) {
      console.warn('[Updater] Electron download error, falling back:', err);
    }

    // 3. Web Stream Download with Live In-App Progress Bar
    try {
      this.activeDownloadAbort = new AbortController();
      const response = await fetch(downloadUrl, {
        signal: this.activeDownloadAbort.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
      this.snapshot.totalBytes = totalBytes;

      const reader = response.body?.getReader();
      if (!reader) {
        // Fallback to direct download link if streaming is unavailable
        triggerDirectDownload(downloadUrl, fileName);
        this.snapshot.status = 'completed';
        this.snapshot.progress = 100;
        this.notify();
        return true;
      }

      const chunks: Uint8Array[] = [];
      let bytesDownloaded = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          bytesDownloaded += value.length;
          this.snapshot.bytesDownloaded = bytesDownloaded;
          if (totalBytes > 0) {
            this.snapshot.progress = Math.min(99, Math.round((bytesDownloaded * 100) / totalBytes));
          }
          this.notify();
        }
      }

      const blob = new Blob(chunks, { type: 'application/octet-stream' });
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);

      this.snapshot.status = 'completed';
      this.snapshot.progress = 100;
      this.notify();
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        this.snapshot.status = 'available';
        this.snapshot.error = 'Download cancelled';
        this.notify();
        return false;
      }
      // On CORS restriction or network block in web browsers, fallback to direct browser download
      triggerDirectDownload(downloadUrl, fileName);
      this.snapshot.status = 'completed';
      this.snapshot.progress = 100;
      this.notify();
      return true;
    }
  }

  /**
   * Re-launches the system installer for an already downloaded package.
   */
  public async relaunchInstaller(): Promise<boolean> {
    const filePath = this.snapshot.filePath;
    if (!filePath) {
      return this.startDownloadAndInstall();
    }

    try {
      if (
        Capacitor.isNativePlatform() &&
        Capacitor.getPlatform() === 'android' &&
        typeof TaskifyNativeWidget.installDownloadedApk === 'function'
      ) {
        const res = await TaskifyNativeWidget.installDownloadedApk({ filePath });
        return !!res.success;
      }

      const electronAPI = (window as any).electronAPI;
      if (electronAPI && typeof electronAPI.installDownloadedUpdate === 'function') {
        const res = await electronAPI.installDownloadedUpdate(filePath);
        return !!res.success;
      }
    } catch (err) {
      console.warn('[Updater] Failed to relaunch installer:', err);
    }
    return false;
  }

  public reset() {
    this.snapshot = {
      status: 'idle',
      progress: 0,
      bytesDownloaded: 0,
      totalBytes: 0,
      filePath: null,
      error: null,
      updateResult: null,
      isChecking: false,
    };
    this.notify();
  }
}

export const appUpdaterStore = new AppUpdaterStore();

/**
 * React hook to consume reactive in-app updater state and dispatch backend downloads.
 */
export function useAppUpdater() {
  const [snapshot, setSnapshot] = useState<AppUpdaterSnapshot>(() => appUpdaterStore.getState());

  useEffect(() => {
    return appUpdaterStore.subscribe((next) => {
      setSnapshot(next);
    });
  }, []);

  const checkForUpdates = useCallback((options?: { force?: boolean }) => {
    return appUpdaterStore.checkForUpdates(options);
  }, []);

  const startDownloadAndInstall = useCallback(() => {
    return appUpdaterStore.startDownloadAndInstall();
  }, []);

  const relaunchInstaller = useCallback(() => {
    return appUpdaterStore.relaunchInstaller();
  }, []);

  const reset = useCallback(() => {
    appUpdaterStore.reset();
  }, []);

  return {
    ...snapshot,
    checkForUpdates,
    startDownloadAndInstall,
    relaunchInstaller,
    reset,
  };
}
