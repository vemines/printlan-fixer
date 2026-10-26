import React, { useState, useRef, useEffect } from 'react';
import {
  Printer,
  Terminal,
  Sun,
  Moon,
  ChevronDown,
  Check,
  Loader2,
  Info
} from 'lucide-react';
import { Language, Theme, TRANSLATIONS } from '../i18n/translations';

import { SystemStatus } from '../services/tauriBridge';

interface HeaderProps {
  onToggleTerminal: () => void;
  isTerminalOpen: boolean;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  theme: Theme;
  onThemeToggle: () => void;
  onOpenStatusModal: () => void;
  onOpenPrintersModal: () => void;
  onOpenAboutModal: () => void;
  systemStatus?: SystemStatus | null;
  isCheckingStatus?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleTerminal,
  isTerminalOpen,
  lang,
  onLanguageChange,
  theme,
  onThemeToggle,
  onOpenStatusModal,
  onOpenPrintersModal,
  onOpenAboutModal,
  systemStatus,
  isCheckingStatus = false,
}) => {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[lang];

  // Calculate health
  const isHealthy = systemStatus
    ? systemStatus.spooler_running && systemStatus.port_445_open && systemStatus.port_135_open
    : true;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLang = (selectedLang: Language) => {
    onLanguageChange(selectedLang);
    setIsLangMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1424] transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">

          {/* Left: App Logo (centered), Title + Status: Available, and 2-line Subtitle */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-[6px] bg-cyan-950/30 dark:bg-cyan-950/60 border border-cyan-500/30 text-white shadow-xs shrink-0 p-1.5">
              <img src="/printer.png" alt="PrintLAN Fixer" className="w-full h-full object-contain drop-shadow-xs" />
            </div>

            <div className="min-w-0">
              {/* Row 1: App Title + Available badge inline on the right of title */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  {t.appTitle}
                </h1>

                {isCheckingStatus ? (
                  <button
                    type="button"
                    onClick={onOpenStatusModal}
                    className="inline-flex items-center gap-1.5 h-6 px-2.5 bg-cyan-50 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700/60 rounded-[6px] text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
                    title={t.header.checkingTitle}
                  >
                    <Loader2 className="w-3 h-3 animate-spin text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span>{t.header.checkingText}</span>
                  </button>
                ) : isHealthy ? (
                  <button
                    type="button"
                    onClick={onOpenStatusModal}
                    className="inline-flex items-center gap-1.5 h-6 px-2.5 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 rounded-[6px] text-[11px] font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/80 transition-all cursor-pointer shadow-2xs"
                    title={t.header.healthyTitle}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{t.header.healthyText}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenStatusModal}
                    className="inline-flex items-center gap-1.5 h-6 px-2.5 bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 rounded-[6px] text-[11px] font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/80 transition-all cursor-pointer shadow-2xs"
                    title={t.header.degradedTitle}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                    <span>{t.header.degradedText}</span>
                  </button>
                )}
              </div>

              {/* Subtitle */}
              <p className="text-[13px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {t.appSubtitleLine1}
              </p>
            </div>
          </div>

          {/* Right Toolbar: Printers, Log, Theme Toggle, Language Menu */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Devices Printer List Button */}
            <button
              type="button"
              onClick={onOpenPrintersModal}
              className="w-8 h-8 inline-flex items-center justify-center bg-white dark:bg-[#131b2e] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-[6px] hover:bg-slate-50 dark:hover:bg-[#1a253d] transition-all cursor-pointer shadow-xs"
              title={t.header.printerListTitle}
              aria-label="Device Printers"
            >
              <Printer size={15} className="text-cyan-600 dark:text-cyan-400" />
            </button>

            {/* Log Button */}
            <button
              type="button"
              onClick={onToggleTerminal}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] text-xs font-semibold border transition-all cursor-pointer shadow-xs ${isTerminalOpen
                ? 'bg-cyan-50 dark:bg-cyan-950/70 border-cyan-400 dark:border-cyan-500/60 text-cyan-700 dark:text-cyan-300'
                : 'bg-white dark:bg-[#131b2e] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a253d]'
                }`}
              title={t.header.toggleLog}
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>{t.log}</span>
            </button>

            {/* Theme Toggle Button (Sun / Moon) */}
            <button
              type="button"
              onClick={onThemeToggle}
              className="w-8 h-8 inline-flex items-center justify-center bg-white dark:bg-[#131b2e] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-[6px] hover:bg-slate-50 dark:hover:bg-[#1a253d] transition-all cursor-pointer shadow-xs"
              title={theme === 'dark' ? t.header.switchLight : t.header.switchDark}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Language Selector: Pop up dropdown menu */}
            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setIsLangMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 h-8 px-2.5 bg-white dark:bg-[#131b2e] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-[6px] text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#1a253d] transition-all cursor-pointer shadow-xs"
                aria-label="Language selection"
              >
                <span>{lang.toUpperCase()}</span>
                <ChevronDown
                  size={13}
                  className={`text-slate-400 transition-transform duration-150 ${isLangMenuOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {/* Popup Dropdown Menu */}
              {isLangMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-36 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-700 rounded-[6px] shadow-xl py-1 z-50 animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={() => handleSelectLang('vi')}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${lang === 'vi'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a253d]'
                      }`}
                  >
                    <span>Tiếng Việt</span>
                    {lang === 'vi' && <Check size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectLang('en')}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${lang === 'en'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a253d]'
                      }`}
                  >
                    <span>English</span>
                    {lang === 'en' && <Check size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>
                </div>
              )}
            </div>

            {/* Info / About Button (Positioned to the right of language selector) */}
            <button
              type="button"
              onClick={onOpenAboutModal}
              className="w-8 h-8 inline-flex items-center justify-center bg-white dark:bg-[#131b2e] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-[6px] hover:bg-slate-50 dark:hover:bg-[#1a253d] hover:text-cyan-600 dark:hover:text-cyan-400 transition-all cursor-pointer shadow-xs"
              title={t.header.aboutTitle}
              aria-label="Application info & support"
            >
              <Info size={15} className="text-cyan-600 dark:text-cyan-400" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
