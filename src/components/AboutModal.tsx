import React, { useState, useEffect } from 'react';
import {
  X,
  Info,
  ShieldAlert,
  MessageSquareCode,
  Heart,
  ExternalLink,
  AlertTriangle,
  Code2,
  User,
  Coffee,
  CheckCircle2,
  Globe
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { openBrowserUrl } from '../services/tauriBridge';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

type TabType = 'about' | 'disclaimer' | 'feedback' | 'donate';

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, lang }) => {
  const [activeTab, setActiveTab] = useState<TabType>('about');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];
  const m = t.aboutModal;

  const GITHUB_REPO_URL = 'https://github.com/vemines/printlan-fixer';
  const GITHUB_ISSUES_URL = 'https://github.com/vemines/printlan-fixer/issues';
  const AUTHOR_GITHUB_URL = 'https://github.com/vemines';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-modal-title"
        className="relative w-full max-w-2xl bg-white dark:bg-[#111928] border border-slate-200 dark:border-[#2b3e5a] rounded-[8px] shadow-2xl p-5 z-10 space-y-4 max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1e2d42] pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-cyan-950/30 dark:bg-cyan-950/60 border border-cyan-500/30 text-white shadow-xs shrink-0 p-1.5 flex items-center justify-center">
              <img src="/printer.png" alt="PrintLAN Fixer" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 id="about-modal-title" className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{m.title}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700/60">
                  v1.0.0
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {m.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[6px] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#182338] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-[#1e2d42] pb-2 shrink-0 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] transition-all cursor-pointer ${
              activeTab === 'about'
                ? 'bg-cyan-50 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700/60 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#182338]'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-cyan-500" />
            <span>{m.tabAbout}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('disclaimer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] transition-all cursor-pointer ${
              activeTab === 'disclaimer'
                ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#182338]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>{m.tabDisclaimer}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('feedback')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] transition-all cursor-pointer ${
              activeTab === 'feedback'
                ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700/60 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#182338]'
            }`}
          >
            <MessageSquareCode className="w-3.5 h-3.5 text-blue-500" />
            <span>{m.tabFeedback}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('donate')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] transition-all cursor-pointer ${
              activeTab === 'donate'
                ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#182338]'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>{m.tabDonate}</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto pr-1 text-xs space-y-4">

          {/* TAB 1: ABOUT & AUTHOR */}
          {activeTab === 'about' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="p-3.5 rounded-[6px] bg-slate-50 dark:bg-[#0c1424] border border-slate-200 dark:border-[#1e2d42] leading-relaxed text-slate-700 dark:text-slate-200">
                {m.appIntro}
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-[6px] bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-[#1e2d42] flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-500" />
                    <span>{m.authorLabel}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => openBrowserUrl(AUTHOR_GITHUB_URL)}
                    className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{m.authorName}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-3 rounded-[6px] bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-[#1e2d42] flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-cyan-500" />
                    <span>{m.licenseLabel}</span>
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{m.licenseValue}</span>
                </div>
              </div>

              {/* Pre-check notice */}
              <div className="p-3.5 rounded-[6px] bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/50 space-y-2">
                <h4 className="font-bold text-cyan-900 dark:text-cyan-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span>{m.preCheckTitle}</span>
                </h4>
                <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 list-disc list-inside leading-relaxed text-[11.5px]">
                  <li>{m.preCheck1}</li>
                  <li>{m.preCheck2}</li>
                  <li>{m.preCheck3}</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: DISCLAIMER */}
          {activeTab === 'disclaimer' && (
            <div className="space-y-3.5 animate-in fade-in duration-100">
              <div className="p-3.5 rounded-[6px] bg-amber-50/70 dark:bg-amber-950/40 border border-amber-300/70 dark:border-amber-700/60 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{m.disclaimerTitle}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                  {m.disclaimerP1}
                </p>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                  {m.disclaimerP2}
                </p>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-semibold">
                  {m.disclaimerP3}
                </p>
              </div>

              <div className="p-3 rounded-[6px] bg-slate-50 dark:bg-[#0c1424] border border-slate-200 dark:border-[#1e2d42] text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Toàn bộ mã nguồn và script can thiệp đều công khai, minh bạch 100% trên GitHub.</span>
              </div>
            </div>
          )}

          {/* TAB 3: FEEDBACK & GITHUB ISSUES */}
          {activeTab === 'feedback' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="p-3.5 rounded-[6px] bg-slate-50 dark:bg-[#0c1424] border border-slate-200 dark:border-[#1e2d42] space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MessageSquareCode className="w-4 h-4 text-blue-500" />
                  <span>{m.feedbackTitle}</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {m.feedbackDesc}
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => openBrowserUrl(GITHUB_ISSUES_URL)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-[6px] shadow-xs transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{m.openGithubIssues}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openBrowserUrl(GITHUB_REPO_URL)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-[#1a253d] hover:bg-slate-200 dark:hover:bg-[#223150] text-slate-800 dark:text-slate-200 font-semibold rounded-[6px] border border-slate-300 dark:border-[#2b3e5a] transition-colors cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{m.githubRepo}</span>
                  </button>
                </div>
              </div>

              {/* Guide card */}
              <div className="p-3.5 rounded-[6px] bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-1.5 text-[11.5px]">
                <h5 className="font-bold text-blue-900 dark:text-blue-200">{m.feedbackGuideTitle}</h5>
                <ul className="space-y-1 text-slate-700 dark:text-slate-300 list-disc list-inside leading-relaxed">
                  <li>{m.feedbackGuide1}</li>
                  <li>{m.feedbackGuide2}</li>
                  <li>{m.feedbackGuide3}</li>
                  <li className="font-medium text-blue-800 dark:text-blue-300">{m.feedbackGuide4}</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: DONATE (QR CODE) */}
          {activeTab === 'donate' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="p-3.5 rounded-[6px] bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
                <div className="p-2 rounded-[6px] bg-rose-500/10 text-rose-500 shrink-0">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-rose-900 dark:text-rose-200 mb-1">{m.donateTitle}</h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {m.donateDesc}
                  </p>
                </div>
              </div>

              {/* QR Image Card */}
              <div className="p-4 rounded-[6px] bg-slate-50 dark:bg-[#0a101b] border border-slate-200 dark:border-[#25364d] flex flex-col items-center justify-center space-y-3">
                <div className="p-2.5 bg-white rounded-[10px] border border-slate-200 dark:border-slate-700 shadow-md max-w-[240px] overflow-hidden">
                  <img
                    src="/QRCode.jpg"
                    alt="VietQR Donate"
                    className="w-full h-auto object-contain rounded-[4px]"
                  />
                </div>
                <div className="text-center font-bold text-slate-900 dark:text-white text-xs">
                  {m.qrTitle}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#1e2d42] shrink-0 text-xs">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
            PrintLAN Fixer
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-[6px] text-xs font-semibold bg-slate-100 dark:bg-[#182338] hover:bg-slate-200 dark:hover:bg-[#202e48] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#293d5c] transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
