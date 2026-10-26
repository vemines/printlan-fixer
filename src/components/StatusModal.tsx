import React from 'react';
import { X, CheckCircle2, AlertTriangle, RefreshCw, Shield, Wifi, Wrench, Loader2 } from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { SystemStatus } from '../services/tauriBridge';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  systemStatus: SystemStatus | null;
  isCheckingStatus: boolean;
  onRefreshStatus: () => Promise<void>;
  onFixService: (serviceName: string) => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  isOpen,
  onClose,
  lang,
  systemStatus,
  isCheckingStatus,
  onRefreshStatus,
  onFixService,
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const t = TRANSLATIONS[lang];

  const spoolerOk = systemStatus?.spooler_running ?? false;
  const firewallOk = systemStatus?.firewall_sharing_enabled ?? false;
  const portsOk = (systemStatus?.port_445_open ?? false) && (systemStatus?.port_135_open ?? false);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-modal-title"
        className="relative w-full max-w-lg bg-white dark:bg-[#111928] border border-slate-200 dark:border-[#2b3e5a] rounded-[6px] shadow-2xl p-5 z-10 space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1e2d42] pb-3">
          <div>
            <h3 id="status-modal-title" className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {t.statusModalTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
              {t.statusModalDesc}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onRefreshStatus()}
              disabled={isCheckingStatus}
              title={t.statusModal.refreshTitle}
              className="p-1.5 rounded-[6px] text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-[#182338] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isCheckingStatus ? 'animate-spin text-cyan-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-[6px] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#182338] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Status Items List */}
        <div className="space-y-2.5">
          {/* 1. Print Spooler */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-[6px] bg-slate-50 dark:bg-[#0a101b] border border-slate-200 dark:border-[#25364d]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-2 rounded-[6px] border shrink-0 ${
                spoolerOk
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-400'
              }`}>
                <RefreshCw className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{t.spoolerService}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {spoolerOk ? t.statusModal.spoolerRunning : t.statusModal.spoolerStopped}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isCheckingStatus ? (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-[6px]">
                  <Loader2 className="w-3 h-3 animate-spin text-cyan-500" />
                  Checking
                </span>
              ) : spoolerOk ? (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-[6px] border border-emerald-200 dark:border-emerald-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-[6px] border border-rose-200 dark:border-rose-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Stopped
                </span>
              )}

              <button
                onClick={() => {
                  onFixService(spoolerOk ? 'restart_spooler' : 'start_spooler');
                  onClose();
                }}
                className="px-2.5 py-1 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950 hover:bg-cyan-100 dark:hover:bg-cyan-900 border border-cyan-200 dark:border-cyan-800/60 rounded-[6px] transition-colors cursor-pointer flex items-center gap-1"
              >
                <Wrench className="w-3 h-3" />
                {spoolerOk ? t.restartSpooler : t.statusModal.startSpooler}
              </button>
            </div>
          </div>

          {/* 2. Firewall */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-[6px] bg-slate-50 dark:bg-[#0a101b] border border-slate-200 dark:border-[#25364d]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-2 rounded-[6px] border shrink-0 ${
                firewallOk
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-400'
              }`}>
                <Shield className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{t.firewallService}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {firewallOk ? t.statusModal.firewallEnabled : t.statusModal.firewallDisabled}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isCheckingStatus ? (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-[6px]">
                  <Loader2 className="w-3 h-3 animate-spin text-cyan-500" />
                  Checking
                </span>
              ) : firewallOk ? (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-[6px] border border-emerald-200 dark:border-emerald-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-[6px] border border-amber-200 dark:border-amber-800/50">
                  <AlertTriangle className="w-3 h-3" />
                  Blocked
                </span>
              )}

              <button
                onClick={() => {
                  onFixService('firewall');
                  onClose();
                }}
                className="px-2.5 py-1 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950 hover:bg-cyan-100 dark:hover:bg-cyan-900 border border-cyan-200 dark:border-cyan-800/60 rounded-[6px] transition-colors cursor-pointer flex items-center gap-1"
              >
                <Wrench className="w-3 h-3" />
                {t.enableFirewall}
              </button>
            </div>
          </div>

          {/* 3. Ports 445 / 135 */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-[6px] bg-slate-50 dark:bg-[#0a101b] border border-slate-200 dark:border-[#25364d]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-2 rounded-[6px] border shrink-0 ${
                portsOk
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-400'
              }`}>
                <Wifi className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{t.portsService}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Port 445 (SMB): {systemStatus?.port_445_open ? 'OK' : 'Closed'} | Port 135 (RPC): {systemStatus?.port_135_open ? 'OK' : 'Closed'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isCheckingStatus ? (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-[6px]">
                  <Loader2 className="w-3 h-3 animate-spin text-cyan-500" />
                  Checking
                </span>
              ) : portsOk ? (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-[6px] border border-emerald-200 dark:border-emerald-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Listening
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-[6px] border border-rose-200 dark:border-rose-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Closed
                </span>
              )}

              <button
                onClick={() => {
                  onFixService('ports');
                }}
                className="px-2.5 py-1 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950 hover:bg-cyan-100 dark:hover:bg-cyan-900 border border-cyan-200 dark:border-cyan-800/60 rounded-[6px] transition-colors cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                {t.testPorts}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-[6px] text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

