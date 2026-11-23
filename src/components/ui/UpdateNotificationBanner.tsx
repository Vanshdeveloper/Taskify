import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  checkForAppUpdates,
  triggerDirectDownload,
  getPlatformLabel,
  type UpdateCheckResult,
} from '../../utils/updater';
import { feedback } from '../../utils/feedback';
import { AppLogoMark } from './BrandLogo';

export const UpdateNotificationBanner: React.FC = () => {
  const { activeReminderAlert } = useApp();
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Small delay after startup so it doesn't collide with splash screen
    const timer = setTimeout(async () => {
      const res = await checkForAppUpdates();
      if (!isMounted) return;

      if (res.hasUpdate && res.release?.downloadUrl) {
        let previouslyDismissed = false;
        try {
          if (typeof sessionStorage !== 'undefined') {
            const dismissKey = `taskify_dismissed_update_${res.latestVersion}`;
            previouslyDismissed = sessionStorage.getItem(dismissKey) === 'true';
          }
        } catch {
          // Ignore storage restrictions
        }

        if (!previouslyDismissed) {
          setUpdateResult(res);
        }
      }
    }, 2800);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const handleDismiss = () => {
    feedback.playClick();
    if (updateResult?.latestVersion) {
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(`taskify_dismissed_update_${updateResult.latestVersion}`, 'true');
        }
      } catch {
        // Ignore storage restrictions
      }
    }
    setIsDismissed(true);
  };

  const handleDownload = () => {
    feedback.playClick();
    if (updateResult?.release?.downloadUrl) {
      triggerDirectDownload(
        updateResult.release.downloadUrl,
        updateResult.release.assetName || undefined
      );
    }
  };

  if (typeof document === 'undefined') return null;

  const showBanner = !!(
    updateResult &&
    updateResult.hasUpdate &&
    !isDismissed &&
    updateResult.release?.downloadUrl &&
    !activeReminderAlert
  );

  const release = updateResult?.release;
  const platformLabel = release ? getPlatformLabel(release.platform) : '';

  return createPortal(
    <AnimatePresence>
      {showBanner && release && (
        <div
          className="fixed left-0 right-0 z-50 flex justify-center px-3.5 sm:px-4 pointer-events-none select-none"
          style={{
            top: 'calc(max(var(--sat, 0px), 14px) + 8px)',
          }}
        >
          <motion.div
            drag="y"
            dragConstraints={{ top: -120, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y < -40) {
                handleDismiss();
              }
            }}
            initial={{ y: -90, opacity: 0, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -90, opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', damping: 28, stiffness: 420 }}
            className="pointer-events-auto w-full max-w-md rounded-[22px] p-3.5 sm:p-4 shadow-2xl border flex flex-col gap-2.5 relative overflow-hidden backdrop-blur-2xl"
            style={{
              backgroundColor: 'rgba(28, 20, 18, 0.92)',
              borderColor: 'color-mix(in srgb, var(--accent-primary) 35%, rgba(255, 255, 255, 0.15))',
              boxShadow: '0 20px 48px -10px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            }}
          >
            {/* Top Row: App Logo + Tag + Close */}
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <div className="flex items-center gap-2">
                <AppLogoMark size={14} />
                <span className="font-semibold text-zinc-200">Taskify</span>
                <span className="text-[10px] text-zinc-500">•</span>
                <span
                  className="font-mono text-[10px] px-1.5 py-0.5 rounded-md font-semibold flex items-center gap-1"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)',
                    color: 'var(--accent-primary)',
                  }}
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>v{updateResult.latestVersion} Available</span>
                </span>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className="p-1 -mr-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 pressable transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Middle Row: Title & Subtitle */}
            <div>
              <h4 className="text-sm font-display font-bold text-white tracking-tight">
                New Update Ready to Download
              </h4>
              <p className="text-xs text-zinc-300 mt-0.5 line-clamp-1">
                Direct installer optimized for {platformLabel}.
              </p>
            </div>

            {/* Bottom Row: Direct Download Action Button */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl text-white font-bold text-xs pressable shadow-md transition-all cursor-pointer"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Update Now</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="py-2 px-3 rounded-xl bg-white/6 hover:bg-white/10 text-xs font-semibold text-zinc-300 pressable transition-all cursor-pointer"
              >
                Later
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
