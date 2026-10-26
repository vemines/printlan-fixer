import React from 'react';
import { Loader2, SlidersHorizontal } from 'lucide-react';
import { PrinterError } from '../types/printer';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { getErrorTitle, getErrorDesc } from '../i18n/dataTranslations';

interface ErrorCardProps {
  error: PrinterError;
  onRunFix: (error: PrinterError) => void;
  onViewDetail: (error: PrinterError) => void;
  lang: Language;
  isLoading?: boolean;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  error,
  onRunFix,
  onViewDetail,
  lang,
  isLoading = false,
}) => {
  const t = TRANSLATIONS[lang];
  const title = getErrorTitle(error, lang);
  const desc = getErrorDesc(error, lang);
  const isServer709 = error.id === 'err-709-server';

  return (
    <div
      onClick={() => onViewDetail(error)}
      className="rounded-[6px] p-4 flex flex-col justify-between transition-all duration-150 cursor-pointer group relative overflow-hidden bg-white dark:bg-[#131f37] border border-slate-200 dark:border-[#2b3f62] hover:border-cyan-500 dark:hover:border-cyan-400 dark:hover:bg-[#172542] shadow-xs hover:shadow-md"
    >
      <div>
        {/* Top row: Code badge only with high contrast */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="font-mono text-xs font-bold text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/90 px-2.5 py-1 rounded-[6px] border border-cyan-200 dark:border-cyan-700/80 tracking-wider">
            {error.code}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1 mb-1.5">
          {title}
        </h4>

        {/* Short description with high contrast readability */}
        <p className="text-xs text-slate-600 dark:text-slate-200 line-clamp-2 leading-relaxed mb-3.5 whitespace-pre-line">
          {desc}
        </p>
      </div>

      {/* Bottom action: Single high-contrast FIX button */}
      <div className="pt-3 border-t border-slate-100 dark:border-[#223553]">
        <button
          disabled={isLoading}
          onClick={(e) => {
            e.stopPropagation();
            onRunFix(error);
          }}
          className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-[6px] text-xs font-bold tracking-wider text-white transition-all shadow-xs cursor-pointer ${
            isLoading 
              ? 'bg-cyan-700 opacity-80 cursor-wait' 
              : 'bg-cyan-600 hover:bg-cyan-500 active:scale-98'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{t.fixing}</span>
            </>
          ) : (
            <span>{t.fixBtn}</span>
          )}
        </button>
      </div>
    </div>
  );
};
