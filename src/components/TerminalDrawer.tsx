import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Search, 
  Trash2, 
  Copy, 
  Check, 
  X,
  Loader2
} from 'lucide-react';
import { LogEntry, LogType } from '../types/printer';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface TerminalDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  logs: LogEntry[];
  onClearLogs: () => void;
  isRunning: boolean;
  currentTaskName?: string;
  lang: Language;
}

export const TerminalDrawer: React.FC<TerminalDrawerProps> = ({
  isOpen,
  onToggle,
  logs,
  onClearLogs,
  isRunning,
  currentTaskName,
  lang,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUpRef = useRef<boolean>(false);
  const t = TRANSLATIONS[lang];

  // Track if user manually scrolled up
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 40;
    isUserScrolledUpRef.current = !isAtBottom;
  };

  // Scroll to bottom when drawer opens or new logs arrive if user hasn't scrolled up
  useEffect(() => {
    if (!isOpen) {
      isUserScrolledUpRef.current = false;
      return;
    }
    if (scrollContainerRef.current && !isUserScrolledUpRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs.length, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onToggle]);

  if (!isOpen) return null;

  const handleCopyLogs = (e: React.MouseEvent) => {
    e.stopPropagation();
    const fullText = filteredLogs
      .map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    const matchType = filterType === 'all' || log.type === filterType;
    const matchSearch = !searchQuery.trim() || log.message.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchType && matchSearch;
  });

  const getLogStyle = (type: LogType) => {
    switch (type) {
      case 'success':
        return 'text-emerald-700 dark:text-emerald-400 font-medium';
      case 'warn':
        return 'text-amber-700 dark:text-amber-400 font-medium';
      case 'error':
        return 'text-rose-700 dark:text-rose-400 font-bold';
      case 'step':
        return 'text-cyan-700 dark:text-cyan-400 font-semibold';
      case 'cmd':
        return 'text-indigo-700 dark:text-indigo-300 font-mono';
      default:
        return 'text-slate-800 dark:text-slate-200';
    }
  };

  const getLogPrefix = (type: LogType) => {
    switch (type) {
      case 'success': return '[SUCCESS] ';
      case 'warn': return '[WARN]    ';
      case 'error': return '[ERROR]   ';
      case 'step': return '[STEP]    ';
      case 'cmd': return '[EXEC]    ';
      default: return '[INFO]    ';
    }
  };

  return (
    <div
      onClick={onToggle}
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity duration-150 animate-in fade-in"
    >
      {/* Right-Side Drawer Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Terminal Log"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl h-full bg-white dark:bg-[#0c1424] border-l border-slate-200 dark:border-[#20304a] flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 text-slate-900 dark:text-slate-100"
      >
        {/* Drawer Header */}
        <div className="p-3.5 bg-slate-50 dark:bg-[#090f1b] border-b border-slate-200 dark:border-[#1e2f47] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-[6px] bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 shrink-0">
              <Terminal className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                  {t.logTitle}
                </h3>
                {isRunning ? (
                  <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Running</span>
                  </span>
                ) : logs.length > 0 ? (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-slate-200 dark:bg-[#131f37] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-[#20304a]">
                    {logs.length} entries
                  </span>
                ) : null}
              </div>
              {isRunning && currentTaskName && (
                <p className="text-[11px] text-cyan-600 dark:text-cyan-400 truncate max-w-xs font-mono mt-0.5">
                  Task: {currentTaskName}
                </p>
              )}
            </div>
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Copy Logs */}
            <button
              onClick={handleCopyLogs}
              className={`p-1.5 rounded-[6px] border text-xs transition-colors cursor-pointer ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-400 text-emerald-600 dark:text-emerald-400'
                  : 'bg-white dark:bg-[#131f37] border-slate-200 dark:border-[#20304a] hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Copy logs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Clear Logs */}
            <button
              onClick={onClearLogs}
              className="p-1.5 rounded-[6px] bg-white dark:bg-[#131f37] border border-slate-200 dark:border-[#20304a] hover:border-rose-300 dark:hover:border-rose-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
              title="Clear logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Close Drawer Button */}
            <button
              onClick={onToggle}
              className="p-1.5 rounded-[6px] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer ml-1"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search + Level Filter */}
        <div className="px-3.5 py-2 bg-slate-100/80 dark:bg-[#0e172a] border-b border-slate-200 dark:border-[#1e2f47] flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="relative flex-1 min-w-[140px]">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in logs..."
              className="w-full h-8 bg-white dark:bg-[#070c17] border border-slate-300 dark:border-[#223553] rounded-[6px] px-2.5 pl-7 py-1 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-[#070c17] p-0.5 rounded-[6px] border border-slate-200 dark:border-[#223553] shrink-0">
            {['all', 'step', 'success', 'error'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterType(lvl)}
                className={`px-2 py-0.5 rounded-[6px] text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                  filterType === lvl
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Terminal Screen Canvas with onScroll listener (Adapted to Theme) */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-3.5 bg-slate-100/60 dark:bg-[#070b14] border-t border-slate-200 dark:border-transparent font-mono text-[11px] leading-relaxed space-y-1 select-text custom-scrollbar"
        >
          {filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500 text-xs text-center px-6 select-none py-12">
              <Terminal className="w-6 h-6 text-slate-300 dark:text-slate-700 mb-1" />
              <span>{t.logReady}</span>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2 hover:bg-slate-200/60 dark:hover:bg-white/[0.04] py-0.5 px-1.5 rounded-[4px] transition-colors"
              >
                <span className="text-slate-400 dark:text-slate-500 text-[10px] shrink-0 select-none">
                  [{log.timestamp}]
                </span>
                <span
                  className={`text-[10px] font-bold shrink-0 select-none ${
                    log.type === 'success'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : log.type === 'warn'
                      ? 'text-amber-700 dark:text-amber-400'
                      : log.type === 'error'
                      ? 'text-rose-700 dark:text-rose-400'
                      : log.type === 'step'
                      ? 'text-cyan-700 dark:text-cyan-400'
                      : log.type === 'cmd'
                      ? 'text-indigo-700 dark:text-indigo-300'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {getLogPrefix(log.type)}
                </span>
                <span className={`break-all ${getLogStyle(log.type)}`}>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
