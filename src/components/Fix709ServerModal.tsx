import React, { useState } from 'react';
import { X, Check, Copy, RotateCcw, ArrowRight, Terminal } from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface Fix709ServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onApplyOption: (optionId: 'replace_dll' | 'registry_rpc' | 'restore_backup') => void;
}

const SCRIPT_OPT1 = `rem === PHUONG AN 1: THAY THE 3 FILE DLL SPOOLER TUONG THICH ===
rem 1. Tao thu muc backup va sao luu 3 file he thong goc
if not exist "%ProgramData%\\PrintLANFixer\\backup_dll" mkdir "%ProgramData%\\PrintLANFixer\\backup_dll"
copy /y "%SystemRoot%\\System32\\win32spl.dll" "%ProgramData%\\PrintLANFixer\\backup_dll\\"
copy /y "%SystemRoot%\\System32\\spoolsv.exe" "%ProgramData%\\PrintLANFixer\\backup_dll\\"
copy /y "%SystemRoot%\\System32\\localspl.dll" "%ProgramData%\\PrintLANFixer\\backup_dll\\"

rem 2. Dung Spooler va thay the file tuong thich tu thu muc files
net stop spooler /y
takeown /f "%SystemRoot%\\System32\\win32spl.dll" /a 2>nul
icacls "%SystemRoot%\\System32\\win32spl.dll" /grant Administrators:F 2>nul
if exist ".\\files\\win32spl.dll" copy /y ".\\files\\win32spl.dll" "%SystemRoot%\\System32\\"
if exist "%~dp0files\\win32spl.dll" copy /y "%~dp0files\\win32spl.dll" "%SystemRoot%\\System32\\"

rem 3. Khoi dong lai Print Spooler
net start spooler`;

const SCRIPT_OPT2 = `rem === PHUONG AN 2: CAP NHAT REGISTRY MAY CHU (RpcProtocols = 7) ===
rem Luu y: Moi may con Win 10 can ket noi phai chay script ben may tram
reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Printers\\RPC" /v RpcProtocols /t REG_DWORD /d 7 /f
net stop spooler /y & net start spooler`;

export const Fix709ServerModal: React.FC<Fix709ServerModalProps> = ({
  isOpen,
  onClose,
  lang,
  onApplyOption,
}) => {
  const [selectedOption, setSelectedOption] = useState<'replace_dll' | 'registry_rpc'>('replace_dll');
  const [showScriptPreview, setShowScriptPreview] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const m = TRANSLATIONS[lang].fix709Modal;
  const activeScript = selectedOption === 'replace_dll' ? SCRIPT_OPT1 : SCRIPT_OPT2;
  const activeOptionLabel = selectedOption === 'replace_dll' ? m.option1Label : m.option2Label;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-xl max-h-[90vh] bg-white dark:bg-[#131f37] border border-slate-200 dark:border-[#2b3f62] rounded-[6px] shadow-2xl overflow-hidden flex flex-col z-10 transition-colors"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-[#20304a] flex items-center justify-between bg-slate-50 dark:bg-[#0c1424]">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950 px-2 py-0.5 rounded-[4px] border border-cyan-200 dark:border-cyan-700">
              0x00000709
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {m.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-[6px] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1c2a44] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-200 overflow-y-auto">
          <p className="text-slate-600 dark:text-slate-300">
            {m.description}
          </p>

          {/* Option 1 */}
          <div
            onClick={() => setSelectedOption('replace_dll')}
            className={`p-4 rounded-[6px] border transition-all cursor-pointer flex items-start gap-3.5 ${
              selectedOption === 'replace_dll'
                ? 'bg-cyan-50/50 dark:bg-cyan-950/30 border-cyan-500 dark:border-cyan-400 shadow-xs'
                : 'bg-slate-50 dark:bg-[#0a1120] border-slate-200 dark:border-[#1e2f4a] hover:border-slate-300 dark:hover:border-[#2c4368]'
            }`}
          >
            <input
              type="radio"
              name="fix_709_option"
              checked={selectedOption === 'replace_dll'}
              onChange={() => setSelectedOption('replace_dll')}
              className="mt-0.5 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
            />
            <div className="space-y-1.5 flex-1">
              <span className="font-bold text-slate-900 dark:text-white text-xs block">
                {m.option1Title}
              </span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong className="text-slate-900 dark:text-white">{m.advantageLabel} </strong>
                {m.option1Advantage}
              </p>
              <div className="p-2 rounded-[4px] bg-white dark:bg-[#131f37] border border-slate-200 dark:border-[#2b3f62] font-mono text-[11px] text-slate-600 dark:text-slate-300 break-all">
                📁 {m.backupPathLabel}{' '}
                <span className="text-cyan-700 dark:text-cyan-300 font-bold">%ProgramData%\\PrintLANFixer\\backup_dll</span>
              </div>
            </div>
          </div>

          {/* Option 2 */}
          <div
            onClick={() => setSelectedOption('registry_rpc')}
            className={`p-4 rounded-[6px] border transition-all cursor-pointer flex items-start gap-3.5 ${
              selectedOption === 'registry_rpc'
                ? 'bg-cyan-50/50 dark:bg-cyan-950/30 border-cyan-500 dark:border-cyan-400 shadow-xs'
                : 'bg-slate-50 dark:bg-[#0a1120] border-slate-200 dark:border-[#1e2f4a] hover:border-slate-300 dark:hover:border-[#2c4368]'
            }`}
          >
            <input
              type="radio"
              name="fix_709_option"
              checked={selectedOption === 'registry_rpc'}
              onChange={() => setSelectedOption('registry_rpc')}
              className="mt-0.5 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
            />
            <div className="space-y-1.5 flex-1">
              <span className="font-bold text-slate-900 dark:text-white text-xs block">
                {m.option2Title}
              </span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong className="text-slate-900 dark:text-white">{m.advantageLabel} </strong>
                {m.option2Advantage}
              </p>
              <p className="text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                ⚠️ {m.option2Note}
              </p>
            </div>
          </div>

          {/* Script Preview Box to Inspect Script */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowScriptPreview(!showScriptPreview)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>
                  {m.inspectScript.replace('{option}', activeOptionLabel)}
                </span>
                <span className="text-[10px] text-slate-400">({showScriptPreview ? m.collapse : m.expand})</span>
              </button>

              {showScriptPreview && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-slate-100 dark:bg-[#182338] hover:bg-slate-200 dark:hover:bg-[#202e48] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#293d5c] transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-400">{m.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                      <span>{m.copyScript}</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {showScriptPreview && (
              <pre className="p-3 rounded-[6px] bg-slate-900 dark:bg-[#060a12] border border-slate-800 dark:border-[#1c2838] font-mono text-[11px] text-cyan-300 leading-relaxed overflow-x-auto whitespace-pre">
                {activeScript}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-[#20304a] flex items-center justify-between bg-slate-50 dark:bg-[#0c1424]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onApplyOption('restore_backup');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-[#1c2c48] border border-slate-300 dark:border-[#2a3f62] transition-colors cursor-pointer"
            title={m.restoreBackupTooltip}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{m.restoreBackup}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-[6px] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#1f2d47] border border-slate-200 dark:border-[#293d5c] transition-colors cursor-pointer"
            >
              {m.cancel}
            </button>
            <button
              onClick={() => {
                onClose();
                onApplyOption(selectedOption);
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-[6px] text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow-xs transition-all cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>{m.apply}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
