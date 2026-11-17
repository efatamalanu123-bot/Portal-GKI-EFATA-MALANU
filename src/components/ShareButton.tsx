import React, { useState } from 'react';
import { Check, Copy, MessageCircle, Share2 } from 'lucide-react';
import { useChurch } from '../context/ChurchContext';

interface ShareActionsProps {
  title: string;
  text: string;
  url: string;
  label?: string;
  compact?: boolean;
  showDirectWhatsApp?: boolean;
}

export const ShareActions: React.FC<ShareActionsProps> = ({
  title,
  text,
  url,
  label = 'Bagikan',
  compact = false,
  showDirectWhatsApp = true,
}) => {
  const { showToast } = useChurch();
  const [copied, setCopied] = useState(false);

  const fullShareText = `${text}\n\n${url}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(fullShareText)}`;

  const copyFallback = async (customMessage?: string) => {
    try {
      await navigator.clipboard?.writeText(fullShareText);
      setCopied(true);
      showToast(
        customMessage || 'Teks & tautan disalin ke clipboard. Siap ditempel ke WhatsApp atau media sosial.',
        {
          title: 'Siap Dibagikan',
          variant: 'success',
        }
      );
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      showToast('Silakan gunakan tombol WhatsApp untuk membagikan informasi ini.', {
        title: 'Gunakan WhatsApp',
        variant: 'info',
      });
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url });
        showToast(`"${title}" berhasil dibagikan.`, {
          title: 'Berhasil Dibagikan',
          variant: 'success',
        });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        // Fallback smoothly when Web Share is blocked in desktop/iframe contexts
      }
    }

    await copyFallback(
      'Perangkat tidak mendukung menu berbagi sistem—teks telah disalin atau gunakan tombol WhatsApp.'
    );
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleNativeShare}
          title={`Bagikan ${title}`}
          aria-label={`Bagikan ${title}`}
          className="min-h-[36px] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#9A3412] dark:hover:border-[#D4AF37] transition-colors whitespace-nowrap"
        >
          <Share2 className="h-3.5 w-3.5 text-[#D4AF37]" />
          <span>{label}</span>
        </button>

        {showDirectWhatsApp && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            title={`Bagikan ${title} ke WhatsApp`}
            aria-label={`Bagikan ${title} ke WhatsApp`}
            className="min-h-[36px] inline-flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors whitespace-nowrap"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>WA</span>
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        onClick={handleNativeShare}
        className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E1008] px-4 py-2 text-sm font-semibold text-[#9A3412] dark:text-slate-100 hover:border-[#9A3412] dark:hover:border-[#D4AF37] transition-colors whitespace-nowrap"
      >
        <Share2 className="h-4 w-4 text-[#D4AF37]" />
        <span>{label}</span>
      </button>

      {showDirectWhatsApp && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors whitespace-nowrap"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Kirim ke WhatsApp</span>
        </a>
      )}

      <button
        type="button"
        onClick={() => copyFallback()}
        className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            <span>Tersalin</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            <span>Salin Info</span>
          </>
        )}
      </button>
    </div>
  );
};
