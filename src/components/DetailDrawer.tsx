import React, { useState } from 'react';
import { 
  X, 
  Play, 
  Copy, 
  Check, 
  AlertTriangle, 
  Terminal, 
  CheckCircle2,
  Layers,
  Wrench,
  SlidersHorizontal
} from 'lucide-react';
import { PrinterError } from '../types/printer';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { getErrorTitle, getErrorRootCause, getErrorFixStep, getErrorRiskNote } from '../i18n/dataTranslations';

interface DetailDrawerProps {
  error: PrinterError | null;
  onClose: () => void;
  onRunFix: (error: PrinterError) => void;
  onOpen709ServerDialog?: () => void;
  lang: Language;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  error,
  onClose,
  onRunFix,
  onOpen709ServerDialog,
  lang,
}) => {
  const [copied, setCopied] = useState(false);
  const [isWrapText, setIsWrapText] = useState(false);
  const [activeAltIndex, setActiveAltIndex] = useState(0);
  const t = TRANSLATIONS[lang];

  React.useEffect(() => {
    if (!error) return;
    setActiveAltIndex(0);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [error, onClose]);

  if (!error) return null;

  const title = getErrorTitle(error, lang);
  const rootCause = getErrorRootCause(error, lang);

  const hasAltScripts = Array.isArray(error.alternativeScripts) && error.alternativeScripts.length > 0;
  const currentAlt = hasAltScripts ? error.alternativeScripts![activeAltIndex] : null;

  const currentScript = currentAlt 
    ? (currentAlt.cmd || currentAlt.powershell || '') 
    : (error.commands.cmd || error.commands.powershell || '');

  const handleCopyScript = () => {
    navigator.clipboard.writeText(currentScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isServer709 = error.id === 'err-709-server' || error.id === 'err-709';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 pb-16 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog container - clean white in light mode, high contrast #131f37 in dark mode */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-dialog-code"
        className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-[#131f37] border border-slate-200 dark:border-[#2b3f62] rounded-[6px] shadow-2xl overflow-hidden flex flex-col z-10 transition-colors"
      >
        
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 dark:border-[#20304a] flex items-center justify-between bg-slate-50 dark:bg-[#0c1424]">
          <div className="flex items-center gap-2">
            <span id="detail-dialog-code" className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950 px-2.5 py-1 rounded-[6px] border border-cyan-200 dark:border-cyan-700 tracking-wider">
              {error.code}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-[4px] font-semibold bg-slate-200/80 dark:bg-[#182338] text-slate-700 dark:text-slate-300 uppercase">
              {error.role === 'server'
                ? t.detailDrawer.serverRole
                : error.role === 'client'
                ? t.detailDrawer.clientRole
                : t.detailDrawer.bothRole}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-[6px] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1c2a44] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-800 dark:text-slate-100">
          
          {/* Banner nổi bật cho Lỗi 709 Máy Chủ */}
          {error.id === 'err-709-server' && onOpen709ServerDialog && (
            <div className="flex items-center justify-between p-3 rounded-[6px] bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-300 dark:border-cyan-800 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-cyan-900 dark:text-cyan-200 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  {t.detailDrawer.banner709Title}
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  {t.detailDrawer.banner709Desc}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpen709ServerDialog();
                }}
                className="shrink-0 px-3 py-1.5 rounded-[6px] text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-all cursor-pointer"
              >
                {t.detailDrawer.chooseMethod}
              </button>
            </div>
          )}

          {/* Section 1: Tiêu đề lỗi & Nguyên nhân */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 flex items-center gap-1.5">
              <Wrench className="w-4 h-4" />
              {title}
            </h4>
            <div className="p-3.5 rounded-[6px] bg-slate-50 dark:bg-[#080e18] border border-slate-200 dark:border-[#203047] leading-relaxed text-slate-800 dark:text-slate-100 text-xs whitespace-pre-line">
              {rootCause}
            </div>
          </div>

          {/* Section 2: Quy trình khắc phục */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {t.fixProcedure}
            </h4>
            <div className="space-y-1.5">
              {error.fixSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-[6px] bg-slate-50 dark:bg-[#080e18] border border-slate-200 dark:border-[#203047] text-xs text-slate-800 dark:text-slate-100"
                >
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-mono text-[10px] font-bold border border-cyan-200 dark:border-cyan-700 shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="whitespace-pre-line">{getErrorFixStep(error, idx, lang)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Registry Keys (nếu có) */}
          {error.registryChanges && error.registryChanges.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                {t.regKeys}
              </h4>
              <div className="space-y-1.5">
                {error.registryChanges.map((reg, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-[6px] bg-slate-50 dark:bg-[#080e18] border border-slate-200 dark:border-[#203047] font-mono text-xs space-y-0.5"
                  >
                    <div className="text-cyan-700 dark:text-cyan-300 font-bold break-all">{reg.path}</div>
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-[11px]">
                      <span>Key: <strong className="text-slate-900 dark:text-white">{reg.key}</strong></span>
                      <span>Type: <strong className="text-slate-900 dark:text-white">{reg.type}</strong></span>
                      <span>Value: <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{reg.value}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Script thực thi (Hỗ trợ 2 script cho máy chủ để kiểm tra) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  {t.execScript}
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-slate-100 dark:bg-[#0c1322] text-cyan-700 dark:text-cyan-400 font-semibold border border-slate-200 dark:border-[#223348]">
                  CMD
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsWrapText(!isWrapText)}
                  className="px-2 py-1 rounded-[6px] text-xs font-medium bg-slate-100 dark:bg-[#182338] hover:bg-slate-200 dark:hover:bg-[#202e48] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#293d5c] transition-colors cursor-pointer"
                >
                  {isWrapText ? 'No wrap' : 'Wrap lines'}
                </button>
                <button
                  onClick={handleCopyScript}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-xs font-medium bg-slate-100 dark:bg-[#182338] hover:bg-slate-200 dark:hover:bg-[#202e48] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#293d5c] transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{t.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>{t.copyCmd}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Selector các phương án Script cho Máy Chủ nếu có nhiều script */}
            {hasAltScripts && (
              <div className="flex flex-wrap gap-1.5 p-1.5 rounded-[6px] bg-slate-100 dark:bg-[#0a1120] border border-slate-200 dark:border-[#1e2f4a]">
                {error.alternativeScripts!.map((alt, idx) => (
                  <button
                    key={alt.id}
                    type="button"
                    onClick={() => setActiveAltIndex(idx)}
                    className={`px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-all cursor-pointer ${
                      activeAltIndex === idx
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#18243b]'
                    }`}
                  >
                    {alt.title}
                  </button>
                ))}
              </div>
            )}

            {/* Note cho phương án đang chọn */}
            {currentAlt?.note && (
              <div className="p-2 rounded-[4px] bg-slate-50 dark:bg-[#0a1120] border border-slate-200 dark:border-[#1e2f4a] text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                {currentAlt.note}
              </div>
            )}

            {/* Khung mã lệnh Script */}
            <div className={`p-3 rounded-[6px] bg-slate-900 dark:bg-[#060a12] border border-slate-800 dark:border-[#1c2838] font-mono text-xs text-cyan-300 leading-relaxed ${
              isWrapText ? 'whitespace-pre-wrap break-all' : 'overflow-x-auto whitespace-pre'
            }`}>
              {currentScript}
            </div>
          </div>

          {/* Risk Note */}
          {error.riskNote && (
            <div className="flex items-start gap-2.5 p-3 rounded-[6px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="whitespace-pre-line">
                <strong className="font-semibold text-amber-900 dark:text-amber-300">{t.riskNote}: </strong>
                {getErrorRiskNote(error, lang)}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-[#20304a] flex items-center justify-end gap-2.5 bg-slate-50 dark:bg-[#0c1424]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-[6px] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#1f2d47] border border-slate-200 dark:border-[#293d5c] transition-colors cursor-pointer"
          >
            {t.close}
          </button>
          
          {error.id === 'err-709-server' && onOpen709ServerDialog ? (
            <button
              onClick={() => {
                onClose();
                onOpen709ServerDialog();
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-[6px] text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow-xs transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{t.fixThisError}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                onRunFix(error);
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-[6px] text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow-xs transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              {t.fixThisError}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
