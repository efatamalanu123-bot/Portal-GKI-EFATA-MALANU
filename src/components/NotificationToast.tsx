import React from 'react';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export interface ToastPayload {
  id: number;
  title?: string;
  message: string;
  variant?: 'success' | 'info' | 'warning';
}

interface NotificationToastProps {
  toast: ToastPayload | null;
  onDismiss: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ toast, onDismiss }) => {
  const variant = toast?.variant ?? 'info';

  const containerStyles =
    variant === 'success'
      ? 'bg-emerald-800 dark:bg-emerald-900 text-white border border-emerald-600/60 dark:border-emerald-700'
      : variant === 'warning'
      ? 'bg-amber-700 dark:bg-amber-900 text-white border border-amber-500/60'
      : 'bg-[#9A3412] dark:bg-[#7C2D12] text-white border border-[#D4AF37]/50';

  const Icon =
    variant === 'success' ? CheckCircle2 : variant === 'warning' ? AlertCircle : Info;

  const iconColor =
    variant === 'success'
      ? 'text-emerald-200'
      : variant === 'warning'
      ? 'text-amber-200'
      : 'text-[#D4AF37]';

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 pointer-events-none w-[calc(100%-2rem)] max-w-sm"
    >
      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={toast.id}
            role="status"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`pointer-events-auto rounded-2xl p-4 shadow-xl flex items-start gap-3 ${containerStyles}`}
          >
            <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              {toast.title && (
                <p className="text-sm font-bold leading-snug text-white">{toast.title}</p>
              )}
              <p className={`text-xs sm:text-sm leading-relaxed text-white/95 ${toast.title ? 'mt-0.5' : 'font-medium'}`}>
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Tutup notifikasi"
              className="min-h-[32px] min-w-[32px] -mr-1 -mt-1 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
