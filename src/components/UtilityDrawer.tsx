import React, { useState } from 'react';
import { 
  X, 
  Play, 
  Copy, 
  Check, 
  AlertTriangle, 
  Terminal, 
  CheckCircle2,
  Wrench,
  Loader2,
  Settings
} from 'lucide-react';
import { UtilityItem } from '../types/printer';
import { Language, TRANSLATIONS } from '../i18n/translations';

import { getUtilityTitle, getUtilityDesc, getUtilityActionLabel, getUtilityStepTitle } from '../i18n/dataTranslations';

interface UtilityDrawerProps {
  util: UtilityItem | null;
  onClose: () => void;
  onRunUtility: (util: UtilityItem) => void;
  lang: Language;
  isLoading?: boolean;
}

export const UtilityDrawer: React.FC<UtilityDrawerProps> = ({
  util,
  onClose,
  onRunUtility,
  lang,
  isLoading = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [isWrapText, setIsWrapText] = useState(false);
  const [customHost, setCustomHost] = useState('');
  const [customPrinter, setCustomPrinter] = useState('');
  const t = TRANSLATIONS[lang];

  React.useEffect(() => {
    if (!util) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [util, onClose]);

  if (!util) return null;

  const title = getUtilityTitle(util, lang);
  const desc = getUtilityDesc(util, lang);
  const actionLabel = getUtilityActionLabel(util, lang);

  const baseScript = (util.commands.cmd || util.commands.powershell || '');
  const hasHostParam = baseScript.includes('IP_MAY_CHU');
  const hasPrinterParam = baseScript.includes('TEN_MAY_IN');

  let currentScript = baseScript;

  if (customHost.trim()) {
    currentScript = currentScript.replace(/IP_MAY_CHU/g, customHost.trim());
  }
  if (customPrinter.trim()) {
    currentScript = currentScript.replace(/TEN_MAY_IN/g, customPrinter.trim());
  }

  const handleCopyScript = () => {
    navigator.clipboard.writeText(currentScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 pb-16 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog container - clean white in light mode, high contrast in dark mode */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="utility-dialog-title"
        className="relative w-full max-w-2xl max-h-[82vh] bg-white dark:bg-[#131f37] border border-slate-200 dark:border-[#2b3f62] rounded-[6px] shadow-2xl overflow-hidden flex flex-col z-10 transition-colors"
      >
        
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 dark:border-[#20304a] flex items-center justify-between bg-slate-50 dark:bg-[#0c1424]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950 px-2 py-0.5 rounded-[6px] border border-cyan-200 dark:border-cyan-700">
              TOOL
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-[6px] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#182338] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-800 dark:text-slate-100">
          
          {/* Section 1: Tiêu đề tool & Mô tả chi tiết */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 flex items-center gap-1.5">
              <Wrench className="w-4 h-4" />
              {title}
            </h4>
            <div className="p-3.5 rounded-[6px] bg-slate-50 dark:bg-[#080e18] border border-slate-200 dark:border-[#203047] leading-relaxed text-slate-800 dark:text-slate-100 text-xs whitespace-pre-line">
              {desc}
            </div>
          </div>

          {/* Section 2: Các bước thực hiện (steps) */}
          {util.steps && util.steps.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {t.fixProcedure}
              </h4>
              <div className="space-y-1.5">
                {util.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-[6px] bg-slate-50 dark:bg-[#080e18] border border-slate-200 dark:border-[#203047] text-xs space-y-1 text-slate-800 dark:text-slate-100"
                  >
                    <div className="flex items-start gap-2">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-mono text-[10px] font-bold border border-cyan-200 dark:border-cyan-700 shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="font-semibold whitespace-pre-line">{getUtilityStepTitle(util, idx, lang)}</span>
                    </div>
                    {step.action && (
                      <div className="ml-6 font-mono text-[11px] text-cyan-700 dark:text-cyan-300 break-all bg-slate-100/60 dark:bg-[#060a12] p-1.5 rounded-[4px] border border-slate-200 dark:border-[#1e2d42]">
                        {step.action}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Parameters Input (If tool needs Host IP or Printer Name) */}
          {(hasHostParam || hasPrinterParam) && (
            <div className="p-3.5 rounded-[6px] bg-cyan-50/70 dark:bg-[#0d1c32] border border-cyan-200 dark:border-cyan-800/60 space-y-2.5">
              <h5 className="font-bold text-xs uppercase tracking-wider text-cyan-900 dark:text-cyan-200 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" />
                <span>{t.utilityDrawer.customParams}</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {hasHostParam && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t.utilityDrawer.serverIpLabel}
                    </label>
                    <input
                      type="text"
                      placeholder="192.168.1.100"
                      value={customHost}
                      onChange={(e) => setCustomHost(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs bg-white dark:bg-[#070c17] border border-slate-300 dark:border-[#20304a] rounded-[4px] font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                {hasPrinterParam && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t.utilityDrawer.printerNameLabel}
                    </label>
                    <input
                      type="text"
                      placeholder="Canon LBP 2900"
                      value={customPrinter}
                      onChange={(e) => setCustomPrinter(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs bg-white dark:bg-[#070c17] border border-slate-300 dark:border-[#20304a] rounded-[4px] font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Script lệnh thực thi */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  {t.execScript}
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-slate-100 dark:bg-[#0c1322] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#223348]">
                  CMD / PowerShell
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

            <div className={`p-3 rounded-[6px] bg-slate-900 dark:bg-[#060a12] border border-slate-800 dark:border-[#1c2838] font-mono text-xs text-cyan-300 leading-relaxed ${
              isWrapText ? 'whitespace-pre-wrap break-all' : 'overflow-x-auto whitespace-pre'
            }`}>
              {currentScript}
            </div>
          </div>

          {/* Risk Note if dangerous */}
          {util.isDangerous && (
            <div className="flex items-start gap-2.5 p-3 rounded-[6px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-xs text-rose-800 dark:text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-rose-900 dark:text-rose-300">{t.riskNote}: </strong>
                {t.utilityDrawer.riskNotice}
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
          <button
            disabled={isLoading}
            onClick={() => {
              onClose();
              const updatedSteps = util.steps.map(step => {
                let action = step.action;
                if (customHost.trim()) {
                  action = action.replace(/IP_MAY_CHU/g, customHost.trim());
                }
                if (customPrinter.trim()) {
                  action = action.replace(/TEN_MAY_IN/g, customPrinter.trim());
                }
                return { ...step, action };
              });
              onRunUtility({
                ...util,
                commands: {
                  cmd: currentScript,
                  powershell: currentScript,
                },
                steps: updatedSteps,
              });
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-[6px] text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow-xs transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t.fixing}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{actionLabel}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
