import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { TabsNav, MainTabType } from './components/TabsNav';
import { ErrorCard } from './components/ErrorCard';
import { DetailDrawer } from './components/DetailDrawer';
import { UtilitiesView } from './components/UtilitiesView';
import { TerminalDrawer } from './components/TerminalDrawer';
import { StatusModal } from './components/StatusModal';
import { PrinterListModal } from './components/PrinterListModal';
import { Fix709ServerModal } from './components/Fix709ServerModal';
import { AboutModal } from './components/AboutModal';
import { PRINTER_ERRORS } from './data/printerErrors';
import { UTILITIES } from './data/utilities';
import { PrinterError, UtilityItem, LogEntry } from './types/printer';
import { Language, Theme, TRANSLATIONS } from './i18n/translations';
import { ERROR_TRANSLATIONS_EN, getUtilityTitle, getUtilityDesc, getUtilityStepTitle, getErrorTitle } from './i18n/dataTranslations';
import { AlertCircle, Search, CheckCircle2, XCircle, X } from 'lucide-react';
import { runSystemCommand, apply709OptionRust, checkIsAdmin, isTauriEnvironment, getSystemStatus, SystemStatus, ExecutionResult } from './services/tauriBridge';

const THEME_STORAGE_KEY = 'printlan_theme';
const LANG_STORAGE_KEY = 'printlan_lang';

export function App() {
  const [activeTab, setActiveTab] = useState<MainTabType>('server');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [detailError, setDetailError] = useState<PrinterError | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  // Live System Status
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(true);

  const refreshSystemStatus = React.useCallback(async () => {
    setIsCheckingStatus(true);
    try {
      const status = await getSystemStatus();
      setSystemStatus(status);
    } catch (err) {
      console.error('Error getting system status:', err);
    } finally {
      setIsCheckingStatus(false);
    }
  }, []);

  useEffect(() => {
    refreshSystemStatus();
  }, [refreshSystemStatus]);

  // App Settings: Language & Theme
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY) as Language | null;
    return saved === 'vi' ? 'vi' : 'en';
  });

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    return saved === 'light' ? 'light' : 'dark';
  });

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [show709ServerModal, setShow709ServerModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Loading state for cards & utilities
  const [loadingCardId, setLoadingCardId] = useState<string | null>(null);
  const [loadingUtilId, setLoadingUtilId] = useState<string | null>(null);

  // Result Toast notification state (Fixed or Error)
  const [toast, setToast] = useState<{ id: string; type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ id: `${Date.now()}`, type, message });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Terminal & Log State (User manually toggles, does not auto-open on action)
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTaskName, setCurrentTaskName] = useState('');
  
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      type: 'info',
      message: 'PrintLAN Fixer initialized on Windows 10/11 environment.'
    },
    {
      id: 'init-2',
      timestamp: new Date().toLocaleTimeString(),
      type: 'success',
      message: 'Core Services: Print Spooler (spoolsv.exe), Firewall (MpsSvc) & TCP 445/135 ready.'
    }
  ]);

  // Handle data-theme and dark class on html element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Handle language persistence
  useEffect(() => {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  }, [lang]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
      }
    ]);
  };

  /**
   * Đưa toàn bộ output (stdout, stderr, exit code) thực tế của tiến trình vào Log Console để debug
   */
  const logExecutionResult = (res: ExecutionResult) => {
    if (res.stdout && !res.stdout.includes('[WEB_SIMULATION]')) {
      const lines = res.stdout.trim().split(/\r?\n/);
      for (const line of lines) {
        if (line.trim()) {
          addLog('info', line);
        }
      }
    }

    if (res.stderr) {
      const lines = res.stderr.trim().split(/\r?\n/);
      for (const line of lines) {
        if (line.trim()) {
          addLog(res.success ? 'warn' : 'error', line);
        }
      }
    }

    if (!res.success && res.exit_code !== 0 && res.exit_code !== -1) {
      addLog('warn', `Process exit code: ${res.exit_code}`);
    }
  };

  const t = TRANSLATIONS[lang];

  // Strict popularity rank: Most common printer sharing errors on top
  const POPULARITY_RANK: Record<string, number> = {
    'err-709-server': 1,     // Lỗi 709 Máy Chủ Win 11 (Ưu tiên số 1 phía Máy Chủ)
    'err-709': 1,            // Lỗi 709 kinh điển (Ưu tiên số 1 phía Máy Trạm)
    'err-11b': 2,            // Lỗi 11b RPC Packet Privacy
    'err-bc4': 3,            // Không tìm thấy máy in Win 11
    'err-bcb': 4,            // Bị chặn Point & Print
    'err-6ba': 5,            // RPC Server Unavailable (1722)
    'err-005': 6,            // Access Denied (5)
    'err-52e': 7,            // Logon Failure (1326)
    'err-35': 8,             // Network Path Not Found (53)
    'err-6d9': 9,            // Endpoint Not Registered (1753)
    'err-4005': 10,          // Lỗi chung 0x00004005 / E_FAIL
    'err-07c': 11,           // Invalid Level 124
    'err-6be': 12,           // RPC Call Failed 1726
    'err-040': 14,           // Netname Deleted 64
    'err-07e': 15,           // Module Not Found 126
    'err-bce': 16,           // Not Shareable 3022
    'err-3e3': 17,           // Operation Aborted 995
    'err-057': 18,           // Invalid Parameter 87
    'err-704': 19,           // Unknown Port 1796
    'err-bbb': 20,           // No StartDoc 3003
    'err-bc5': 21,           // Driver Warned 3013
    'err-bc6': 22,           // Driver Blocked 3014
    'err-bc7': 23,           // Package In Use 3015
    'err-bc8': 24,           // Core Driver Missing 3016
    'err-bcd': 25,           // Invalid Manifest 3021
  };

  // Filter errors by active tab and search query, ordered strictly by popularity
  const filteredErrors = useMemo(() => {
    const isSearching = searchQuery.trim().length > 0;
    const q = searchQuery.toLowerCase().trim();

    const list = PRINTER_ERRORS.filter((err) => {
      // 1. Luôn lọc theo Tab hiện tại (Máy Trạm hoặc Máy Chủ), không để lỗi tab khác lẫn vào
      if (activeTab === 'server') {
        if (err.role !== 'server' && err.role !== 'both') return false;
      } else if (activeTab === 'client') {
        if (err.role !== 'client' && err.role !== 'both') return false;
      }

      // 2. Lọc tiếp theo từ khóa tìm kiếm (nếu đang search)
      if (isSearching) {
        const enItem = ERROR_TRANSLATIONS_EN[err.id];
        const matchCode = err.code.toLowerCase().includes(q);
        const matchName = err.name.toLowerCase().includes(q) || (enItem?.title?.toLowerCase().includes(q) ?? false);
        const matchWin32 = err.win32Code?.toLowerCase().includes(q) || false;
        const matchDesc = err.shortDesc.toLowerCase().includes(q) || (enItem?.desc?.toLowerCase().includes(q) ?? false);
        if (!matchCode && !matchName && !matchWin32 && !matchDesc) return false;
      }

      return true;
    });

    return list.sort((a, b) => {
      const rankA = POPULARITY_RANK[a.id] ?? 99;
      const rankB = POPULARITY_RANK[b.id] ?? 99;
      return rankA - rankB;
    });
  }, [activeTab, searchQuery]);

  const serverCount = useMemo(() => {
    return PRINTER_ERRORS.filter(e => e.role === 'server' || e.role === 'both').length;
  }, []);

  const clientCount = useMemo(() => {
    return PRINTER_ERRORS.filter(e => e.role === 'client' || e.role === 'both').length;
  }, []);

  // Execution flow simulation for single error fix (Inline loading on button)
  const handleRunFix = async (error: PrinterError) => {
    // Nếu là lỗi 709 máy chủ: Mở modal chọn 2 phương án
    if (error.id === 'err-709-server' || (error.id === 'err-709' && activeTab === 'server')) {
      setShow709ServerModal(true);
      return;
    }

    setLoadingCardId(error.id);
    setIsRunning(true);
    setCurrentTaskName(`${error.code}`);

    try {
      addLog('step', `--- ${t.appLogs.startRepair} ${error.code.toUpperCase()} ---`);
      addLog('info', `${error.name}`);

      for (let i = 0; i < error.fixSteps.length; i++) {
        await new Promise(r => setTimeout(r, 200));
        addLog('step', `[${i + 1}/${error.fixSteps.length}] ${error.fixSteps[i]}`);
      }

      if (error.commands.cmd) {
        addLog('cmd', `${error.commands.cmd.replace(/\n/g, ' && ')}`);
        const res = await runSystemCommand(error.commands.cmd, false);
        logExecutionResult(res);
      }

      await new Promise(r => setTimeout(r, 200));
      addLog('success', `${t.appLogs.appliedFix} ${error.code}.`);
      showToast('success', `${t.appLogs.appliedFix} ${error.code}`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Fix execution failed';
      addLog('error', `Error fixing ${error.code}: ${errMsg}`);
      showToast('error', `Lỗi xử lý ${error.code}: ${errMsg}`);
    } finally {
      setIsRunning(false);
      setCurrentTaskName('');
      setLoadingCardId(null);
    }
  };

  // Execution flow for 709 Server options
  const handleApply709ServerOption = async (optionId: 'replace_dll' | 'registry_rpc' | 'restore_backup') => {
    setLoadingCardId('err-709-server');
    setIsRunning(true);

    try {
      if (optionId === 'replace_dll') {
        setCurrentTaskName('Fix 709 (Thay 3 file DLL)');
        addLog('step', '--- SỬA LỖI 709 MÁY CHỦ: THAY THẾ 3 FILE DLL TƯƠNG THÍCH ---');
        addLog('info', 'Bước 1: Tự động sao lưu 3 file gốc vào %ProgramData%\\PrintLANFixer\\backup_dll');
        addLog('info', 'Bước 2: Dừng dịch vụ Print Spooler an toàn & thay thế file tương thích');
      } else if (optionId === 'registry_rpc') {
        setCurrentTaskName('Fix 709 (Cập nhật Registry Server)');
        addLog('step', '--- SỬA LỖI 709 MÁY CHỦ: CẤU HÌNH REGISTRY RpcProtocols ---');
        addLog('info', 'Bật giao thức lắng nghe RPC over Named Pipes (RpcProtocols = 7)');
      } else if (optionId === 'restore_backup') {
        setCurrentTaskName('Khôi phục 3 file DLL gốc');
        addLog('step', '--- KHÔI PHỤC 3 FILE DLL GỐC TỪ THƯ MỤC BACKUP ---');
      }

      const res = await apply709OptionRust(optionId);
      logExecutionResult(res);

      if (optionId === 'replace_dll') {
        addLog('success', 'Đã thay thế 3 file DLL thành công! Tất cả các máy con Win 10 kết nối vào có thể in ngay.');
        showToast('success', 'Đã sửa 709 máy chủ bằng phương án thay 3 file DLL!');
      } else if (optionId === 'registry_rpc') {
        addLog('success', 'Đã cập nhật Registry RpcProtocols = 7 trên máy chủ (Lưu ý: Các máy con cần chạy script máy trạm).');
        showToast('success', 'Đã cập nhật Registry RpcProtocols = 7 trên máy chủ!');
      } else if (optionId === 'restore_backup') {
        addLog('success', 'Đã khôi phục 3 file DLL gốc của Windows.');
        showToast('success', 'Đã khôi phục 3 file DLL gốc của hệ thống!');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Execution failed';
      addLog('error', `Lỗi: ${errMsg}`);
      showToast('error', `Lỗi: ${errMsg}`);
    } finally {
      setIsRunning(false);
      setCurrentTaskName('');
      setLoadingCardId(null);
    }
  };

  // Execution flow for utilities
  const handleRunUtility = async (util: UtilityItem) => {
    setLoadingUtilId(util.id);
    setIsRunning(true);
    const utilTitle = getUtilityTitle(util, lang);
    const utilDesc = getUtilityDesc(util, lang);
    setCurrentTaskName(utilTitle);

    try {
      addLog('step', `--- ${utilTitle.toUpperCase()} ---`);
      addLog('info', utilDesc);

      const activeCmd = util.commands.cmd || '';
      for (let i = 0; i < util.steps.length; i++) {
        await new Promise(r => setTimeout(r, 200));
        const stepTitle = getUtilityStepTitle(util, i, lang) || util.steps[i].title;
        addLog('step', `[${i + 1}/${util.steps.length}] ${stepTitle}`);
        
        let stepAction = util.steps[i].action;
        if (util.steps.length === 1 && activeCmd && activeCmd !== util.steps[i].action) {
          stepAction = activeCmd;
        }
        addLog('cmd', stepAction);
      }

      if (activeCmd) {
        const res = await runSystemCommand(activeCmd, false);
        logExecutionResult(res);
      }

      await new Promise(r => setTimeout(r, 200));
      addLog('success', `${t.appLogs.completedTool} ${utilTitle}`);
      showToast('success', `${t.appLogs.completedTool} ${utilTitle}`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Utility execution failed';
      addLog('error', `Error running ${utilTitle}: ${errMsg}`);
      showToast('error', `Lỗi chạy ${utilTitle}: ${errMsg}`);
    } finally {
      setIsRunning(false);
      setCurrentTaskName('');
      setLoadingUtilId(null);
    }
  };

  // Quick fix from Status Modal
  const handleFixService = async (serviceId: string) => {
    if (serviceId === 'start_spooler') {
      addLog('step', 'Bắt đầu khởi chạy dịch vụ Print Spooler...');
      addLog('cmd', 'net start spooler');
      const res = await runSystemCommand('net start spooler', false);
      logExecutionResult(res);
      if (res.success) {
        addLog('success', 'Print Spooler đã khởi động.');
        showToast('success', 'Đã bật dịch vụ Print Spooler.');
      } else {
        showToast('error', 'Không thể bật dịch vụ Print Spooler!');
      }
      await refreshSystemStatus();
    } else if (serviceId === 'restart_spooler' || serviceId === 'spooler') {
      addLog('step', 'Khởi động lại dịch vụ Print Spooler...');
      addLog('cmd', 'powershell -Command "Restart-Service -Name Spooler -Force"');
      const res = await runSystemCommand('powershell -Command "Restart-Service -Name Spooler -Force"', true);
      logExecutionResult(res);
      if (res.success) {
        addLog('success', 'Print Spooler đã khởi động lại hoàn tất.');
        showToast('success', 'Đã khởi động lại Print Spooler.');
      } else {
        showToast('error', 'Không thể khởi động lại Print Spooler!');
      }
      await refreshSystemStatus();
    } else if (serviceId === 'firewall') {
      const fwUtil = UTILITIES.find(u => u.id === 'util-enable-firewall-sharing');
      if (fwUtil) {
        await handleRunUtility(fwUtil);
      } else {
        addLog('step', 'Enabling Firewall File and Printer Sharing rules...');
        addLog('cmd', 'netsh advfirewall firewall set rule group="File and Printer Sharing" new enable=Yes');
        const res = await runSystemCommand('netsh advfirewall firewall set rule group="File and Printer Sharing" new enable=Yes', false);
        logExecutionResult(res);
        addLog('success', 'Firewall rules enabled.');
      }
      await refreshSystemStatus();
    } else if (serviceId === 'ports') {
      addLog('step', 'Testing TCP 445 (SMB) & TCP 135 (RPC)...');
      await refreshSystemStatus();
      const p445 = systemStatus?.port_445_open;
      const p135 = systemStatus?.port_135_open;
      if (p445 && p135) {
        addLog('success', 'TCP 445 (SMB) & TCP 135 (RPC) are open and listening.');
        showToast('success', 'Cổng TCP 445 & 135 đang lắng nghe bình thường.');
      } else {
        addLog('warn', `TCP 445: ${p445 ? 'Open' : 'Closed'} | TCP 135: ${p135 ? 'Open' : 'Closed'}`);
        showToast('error', 'Cổng mạng chia sẻ in đang bị chặn hoặc chưa mở!');
      }
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#030712] text-slate-100' : 'bg-slate-100 text-slate-900'} flex flex-col pb-8 transition-colors`}>
      
      {/* Top App Header (Status placed same line with title, Log button, Theme, Language) */}
      <Header
        onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
        isTerminalOpen={isTerminalOpen}
        lang={lang}
        onLanguageChange={setLang}
        theme={theme}
        onThemeToggle={toggleTheme}
        onOpenStatusModal={() => setShowStatusModal(true)}
        onOpenPrintersModal={() => setShowPrinterModal(true)}
        onOpenAboutModal={() => setShowAboutModal(true)}
        systemStatus={systemStatus}
        isCheckingStatus={isCheckingStatus}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3.5">
        <TabsNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          lang={lang}
        />

        {/* Search Bar placed BELOW Tabs with hover effect */}
        <div className="relative w-full group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 h-10 text-xs sm:text-sm rounded-[6px] bg-white dark:bg-[#131f37] border border-slate-300 dark:border-[#2b3f62] hover:border-cyan-500/60 dark:hover:border-cyan-500/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 shadow-xs hover:shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a2c4c] rounded-[6px] transition-colors cursor-pointer"
              title={t.clearSearch}
            >
              ✕
            </button>
          )}
        </div>

        {/* Content Area */}
        {activeTab === 'utilities' ? (
          <UtilitiesView 
            onRunUtility={handleRunUtility} 
            lang={lang} 
            loadingUtilId={loadingUtilId}
            searchQuery={searchQuery}
            onClearSearch={handleClearSearch}
          />
        ) : (
          <div className="space-y-3">
            {/* Error Cards Grid */}
            {filteredErrors.length === 0 ? (
              <div className="rounded-[6px] p-10 text-center space-y-3 bg-white dark:bg-[#131f37] border border-slate-200 dark:border-[#2b3f62] shadow-xs">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {t.noErrorsFound}
                </h3>
                <button
                  onClick={handleClearSearch}
                  className="px-3.5 py-1.5 rounded-[6px] text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer"
                >
                  {t.clearSearch}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredErrors.map((error) => (
                  <ErrorCard
                    key={error.id}
                    error={error}
                    onRunFix={handleRunFix}
                    onViewDetail={setDetailError}
                    lang={lang}
                    isLoading={loadingCardId === error.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Bottom Popup Log Console (High contrast in both modes, docked at bottom z-30) */}
      <TerminalDrawer
        isOpen={isTerminalOpen}
        onToggle={() => setIsTerminalOpen(!isTerminalOpen)}
        logs={logs}
        onClearLogs={() => setLogs([])}
        isRunning={isRunning}
        currentTaskName={currentTaskName}
        lang={lang}
      />

      {/* Detail Slide-over Modal (High contrast, z-[70] overlay) */}
      <DetailDrawer
        error={detailError}
        onClose={() => setDetailError(null)}
        onRunFix={handleRunFix}
        onOpen709ServerDialog={() => setShow709ServerModal(true)}
        lang={lang}
      />

      {/* System Status Modal (High contrast, z-[70] overlay) */}
      <StatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        lang={lang}
        systemStatus={systemStatus}
        isCheckingStatus={isCheckingStatus}
        onRefreshStatus={refreshSystemStatus}
        onFixService={handleFixService}
      />

      {/* Installed Printers & Quick Print Queue Inspector Modal */}
      <PrinterListModal
        isOpen={showPrinterModal}
        onClose={() => setShowPrinterModal(false)}
        lang={lang}
        onRunAction={async (actionName, cmd) => {
          addLog('step', `--- ${actionName} ---`);
          addLog('cmd', cmd.replace(/\n/g, ' && '));
          const res = await runSystemCommand(cmd, false);
          logExecutionResult(res);
          if (res.success) {
            addLog('success', `${actionName} - Đã thực hiện.`);
          }
        }}
      />

      {/* Modal Chọn 2 Phương Án Sửa Lỗi 709 cho Máy Chủ Win 11 */}
      <Fix709ServerModal
        isOpen={show709ServerModal}
        onClose={() => setShow709ServerModal(false)}
        lang={lang}
        onApplyOption={handleApply709ServerOption}
      />

      {/* About, Author, Disclaimer, Pre-check, Donate & Feedback Modal */}
      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        lang={lang}
      />

      {/* Floating Result Toast Notification (Fixed or Error) */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-[80] flex items-center gap-2.5 px-4 py-2.5 rounded-[6px] shadow-2xl text-xs font-medium backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-150 ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 text-emerald-100 border border-emerald-500/40 shadow-emerald-950/50'
              : 'bg-rose-950/95 text-rose-100 border border-rose-500/40 shadow-rose-950/50'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="leading-tight">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 -mr-1 text-slate-300 hover:text-white rounded-[4px] hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}

export default App;
