import React, { useState, useEffect, useCallback } from 'react';
import {
  Printer,
  X,
  Check,
  CheckCircle2,
  Settings,
  FileText,
  Trash2,
  ExternalLink,
  Play,
  Search,
  SlidersHorizontal,
  Share2,
  HardDrive,
  Network,
  ShieldCheck,
  AlertCircle,
  Layers,
  Star,
  Plus,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { getSystemPrinters, openPrinterGui, runSystemCommand, testNetworkTarget } from '../services/tauriBridge';

export interface DevicePrinter {
  id: string;
  name: string;
  driver: string;
  port: string;
  isDefault?: boolean;
  isSharing?: boolean;    // Máy in cục bộ đang được chia sẻ cho máy khác
  isRemoteLan?: boolean;  // Máy in được kết nối từ máy chủ khác qua LAN
  serverHost?: string;
  shareName?: string;
  status: 'ready' | 'offline' | 'error';
  queueJobs: PrintJob[];
}

export interface PrintJob {
  id: string;
  documentName: string;
  user: string;
  pages: number;
  size: string;
  submittedAt: string;
  status: 'Printing' | 'Spooling' | 'Paused' | 'Error';
}

const INITIAL_PRINTERS: DevicePrinter[] = [];

interface PrinterListModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onRunAction?: (actionName: string, cmdScript: string) => Promise<void> | void;
}

export const PrinterListModal: React.FC<PrinterListModalProps> = ({
  isOpen,
  onClose,
  lang,
  onRunAction,
}) => {
  const [printers, setPrinters] = useState<DevicePrinter[]>(INITIAL_PRINTERS);
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [isLoadingPrinters, setIsLoadingPrinters] = useState<boolean>(false);

  const fetchPrinters = useCallback(async () => {
    setIsLoadingPrinters(true);
    try {
      const items = await getSystemPrinters();
      const mapped: DevicePrinter[] = items.map((p) => ({
        id: p.id,
        name: p.name,
        driver: p.driver,
        port: p.port,
        isDefault: p.is_default,
        isSharing: p.is_sharing,
        isRemoteLan: p.is_remote_lan,
        serverHost: p.server_host,
        shareName: p.share_name,
        status: p.status as 'ready' | 'offline' | 'error',
        queueJobs: p.queue_jobs.map((j) => ({
          id: j.id,
          documentName: j.document_name,
          user: j.user,
          pages: j.pages,
          size: j.size,
          submittedAt: j.submitted_at,
          status: (j.status || 'Spooling') as any,
        })),
      }));
      setPrinters(mapped);
      if (mapped.length > 0) {
        setSelectedPrinterId((prev) => (mapped.some((m) => m.id === prev) ? prev : mapped[0].id));
      } else {
        setSelectedPrinterId('');
      }
    } catch (err) {
      console.error('Lỗi nạp danh sách máy in:', err);
    } finally {
      setIsLoadingPrinters(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPrinters();
    }
  }, [isOpen, fetchPrinters]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Sharing form state for selected printer
  const selectedPrinter = printers.find(p => p.id === selectedPrinterId) || printers[0] || null;
  const isRemotePrinter = selectedPrinter?.isRemoteLan || selectedPrinter?.port.startsWith('\\\\');
  const [isSharedDraft, setIsSharedDraft] = useState<boolean>(selectedPrinter?.isSharing || false);
  const [shareNameDraft, setShareNameDraft] = useState<string>(selectedPrinter?.shareName || selectedPrinter?.name?.replace(/\s+/g, '_') || '');

  // Add LAN Printer form state
  const [showAddLanModal, setShowAddLanModal] = useState<boolean>(false);
  const [lanHost, setLanHost] = useState<string>('');
  const [lanPrinterName, setLanPrinterName] = useState<string>('');
  const [lanUsername, setLanUsername] = useState<string>('');
  const [lanPassword, setLanPassword] = useState<string>('');
  const [isConnectingLan, setIsConnectingLan] = useState<boolean>(false);

  // Custom Confirm/Alert Dialog state (replacing native browser confirm/alert)
  interface CustomDialogState {
    isOpen: boolean;
    type: 'confirm' | 'alert';
    title: string;
    message: string;
    confirmVariant?: 'danger' | 'primary';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
  }
  const [customDialog, setCustomDialog] = useState<CustomDialogState>({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
  });

  // Synchronize draft state when selected printer changes
  React.useEffect(() => {
    if (selectedPrinter) {
      setIsSharedDraft(selectedPrinter.isSharing || false);
      setShareNameDraft(selectedPrinter.shareName || selectedPrinter.name.replace(/\s+/g, '_'));
    }
  }, [selectedPrinterId]);

  // Handle ESC key to close inner dialogs or main modal
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (customDialog.isOpen) {
          setCustomDialog(prev => ({ ...prev, isOpen: false }));
        } else if (showAddLanModal) {
          setShowAddLanModal(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, customDialog.isOpen, showAddLanModal, onClose]);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 2500);
  };

  const filteredPrinters = printers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.port.toLowerCase().includes(search.toLowerCase())
  );

  const t = TRANSLATIONS[lang];
  const tp = t.printerModal;

  // Actions
  const handlePrintTest = async () => {
    if (!selectedPrinter || actionLoading) return;
    setActionLoading('test_page');
    try {
      const res = await openPrinterGui(selectedPrinter.name, 'test_page');
      if (!res.success) {
        setCustomDialog({
          isOpen: true,
          type: 'alert',
          title: tp.testPageErrorTitle,
          message: tp.testPageErrorMsg.replace('{name}', selectedPrinter.name).replace('{detail}', res.error || ''),
          confirmVariant: 'danger',
          confirmText: tp.dialogOk,
        });
      } else {
        showNotification(tp.noticeTestSent.replace('{name}', selectedPrinter.name));
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenPreferences = async () => {
    if (!selectedPrinter || actionLoading) return;
    setActionLoading('preferences');
    try {
      const res = await openPrinterGui(selectedPrinter.name, 'preferences');
      if (!res.success) {
        setCustomDialog({
          isOpen: true,
          type: 'alert',
          title: tp.prefErrorTitle,
          message: tp.prefErrorMsg.replace('{detail}', res.error || ''),
          confirmVariant: 'danger',
          confirmText: tp.dialogOk,
        });
      } else {
        showNotification(tp.noticePrefOpened.replace('{name}', selectedPrinter.name));
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenProperties = async () => {
    if (!selectedPrinter || actionLoading) return;
    setActionLoading('properties');
    try {
      const res = await openPrinterGui(selectedPrinter.name, 'properties');
      if (!res.success) {
        setCustomDialog({
          isOpen: true,
          type: 'alert',
          title: tp.propErrorTitle,
          message: tp.propErrorMsg.replace('{detail}', res.error || ''),
          confirmVariant: 'danger',
          confirmText: tp.dialogOk,
        });
      } else {
        showNotification(tp.noticePropOpened.replace('{name}', selectedPrinter.name));
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenSystemQueue = async () => {
    if (!selectedPrinter || actionLoading) return;
    setActionLoading('queue');
    try {
      const res = await openPrinterGui(selectedPrinter.name, 'queue');
      if (!res.success) {
        setCustomDialog({
          isOpen: true,
          type: 'alert',
          title: tp.queueErrorTitle,
          message: tp.queueErrorMsg.replace('{name}', selectedPrinter.name).replace('{detail}', res.error || ''),
          confirmVariant: 'danger',
          confirmText: tp.dialogOk,
        });
      } else {
        showNotification(tp.noticeQueueOpened);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearPrinterQueue = () => {
    if (!selectedPrinter || actionLoading) return;
    setCustomDialog({
      isOpen: true,
      type: 'confirm',
      title: tp.confirmClearQueueTitle,
      message: tp.confirmClearQueueMsg.replace('{name}', selectedPrinter.name),
      confirmVariant: 'danger',
      confirmText: tp.dialogConfirm,
      cancelText: tp.dialogCancel,
      onConfirm: async () => {
        setActionLoading('clear_queue');
        try {
          setPrinters(prev => prev.map(p => {
            if (p.id === selectedPrinter.id) {
              return { ...p, queueJobs: [] };
            }
            return p;
          }));
          const cmd = `Get-PrintJob -PrinterName '${selectedPrinter.name.replace(/'/g, "''")}' | Remove-PrintJob`;
          await runSystemCommand(cmd, true);
          showNotification(tp.noticeQueueCleared.replace('{name}', selectedPrinter.name));
          setTimeout(fetchPrinters, 800);
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const handleSetDefault = async () => {
    if (!selectedPrinter || actionLoading) return;
    setActionLoading('set_default');
    try {
      // Dùng WScript.Network SetDefaultPrinter để tránh lỗi 0x00000709 khi chạy UAC Admin
      const cmd = `(New-Object -ComObject WScript.Network).SetDefaultPrinter('${selectedPrinter.name.replace(/'/g, "''")}')`;
      const res = await runSystemCommand(cmd, true);
      if (!res.success && res.stderr) {
        setCustomDialog({
          isOpen: true,
          type: 'alert',
          title: tp.setDefaultErrorTitle,
          message: tp.setDefaultErrorMsg.replace('{name}', selectedPrinter.name).replace('{detail}', res.stderr || ''),
          confirmVariant: 'danger',
          confirmText: tp.dialogOk,
        });
        return;
      }
      setPrinters(prev => prev.map(p => ({
        ...p,
        isDefault: p.id === selectedPrinter.id
      })));
      showNotification(tp.noticeDefaultSet.replace('{name}', selectedPrinter.name));
      setTimeout(fetchPrinters, 800);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveDevice = () => {
    if (!selectedPrinter || actionLoading) return;
    const removedName = selectedPrinter.name;
    setCustomDialog({
      isOpen: true,
      type: 'confirm',
      title: tp.confirmRemoveTitle,
      message: tp.confirmRemoveMsg.replace('{name}', removedName),
      confirmVariant: 'danger',
      confirmText: tp.dialogConfirm,
      cancelText: tp.dialogCancel,
      onConfirm: async () => {
        setActionLoading('remove_device');
        try {
          // Dùng Remove-Printer qua PowerShell hỗ trợ cả máy in nội bộ lẫn máy in mạng
          const cmd = `Remove-Printer -Name '${removedName.replace(/'/g, "''")}' -ErrorAction Stop`;
          const res = await runSystemCommand(cmd, true);
          if (!res.success && res.stderr) {
            // Thử thêm xóa qua WMI CIM
            const fbCmd = `Get-CimInstance Win32_Printer -Filter "Name = '${removedName.replace(/'/g, "\\'")}'" | Remove-CimInstance`;
            const fbRes = await runSystemCommand(fbCmd, true);
            if (!fbRes.success) {
              setCustomDialog({
                isOpen: true,
                type: 'alert',
                title: tp.removeErrorTitle,
                message: tp.removeErrorMsg.replace('{name}', removedName).replace('{detail}', res.stderr || fbRes.stderr || ''),
                confirmVariant: 'danger',
                confirmText: tp.dialogOk,
              });
              return;
            }
          }
          const remaining = printers.filter(p => p.id !== selectedPrinter.id);
          setPrinters(remaining);
          if (remaining.length > 0) {
            setSelectedPrinterId(remaining[0].id);
          } else {
            setSelectedPrinterId('');
          }
          showNotification(tp.noticeDeviceRemoved.replace('{name}', removedName));
          setTimeout(fetchPrinters, 1000);
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  // Save Sharing Configuration
  const handleSaveSharing = async () => {
    if (!selectedPrinter || actionLoading) return;
    setActionLoading('save_sharing');
    try {
      const safeShareName = shareNameDraft.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      setPrinters(prev => prev.map(p => {
        if (p.id === selectedPrinter.id) {
          return { ...p, isSharing: isSharedDraft, shareName: safeShareName };
        }
        return p;
      }));

      const cmd = isSharedDraft
        ? `Set-Printer -Name '${selectedPrinter.name.replace(/'/g, "''")}' -Shared $true -ShareName '${safeShareName}'`
        : `Set-Printer -Name '${selectedPrinter.name.replace(/'/g, "''")}' -Shared $false`;

      await runSystemCommand(cmd, true);

      showNotification(
        isSharedDraft
          ? tp.noticeShareEnabled.replace('{shareName}', safeShareName)
          : tp.noticeShareDisabled
      );
      setTimeout(fetchPrinters, 1000);
    } finally {
      setActionLoading(null);
    }
  };

  // Open Windows Advanced Sharing Settings
  const handleOpenAdvancedSharing = () => {
    const cmd = `control.exe /name Microsoft.NetworkAndSharingCenter /page Advanced`;
    onRunAction?.('Open Windows Advanced Sharing Settings', cmd);
    showNotification(tp.noticeAdvSharingOpened);
  };

  // Add LAN Printer Handler - Kiểm tra kết nối mạng và xác minh máy in thực tế được cài đặt
  const handleAddLanPrinter = async (e: React.FormEvent) => {
    e.preventDefault();
    const host = lanHost.trim().replace(/^[\\\/]+/, '').replace(/[\\\/]+$/, '');
    const pName = lanPrinterName.trim();
    if (!host || !pName) {
      setCustomDialog({
        isOpen: true,
        type: 'alert',
        title: tp.dialogNotice,
        message: tp.fillRequiredFields,
        confirmVariant: 'primary',
        confirmText: tp.dialogOk
      });
      return;
    }

    setIsConnectingLan(true);
    const fullPath = `\\\\${host}\\${pName}`;

    // 1. Kiểm tra kết nối mạng tới máy chủ (TCP 445 / 135 / Ping)
    const netTest = await testNetworkTarget(host);
    if (!netTest.success) {
      setIsConnectingLan(false);
      setCustomDialog({
        isOpen: true,
        type: 'alert',
        title: tp.netConnectErrorTitle,
        message: tp.netConnectErrorMsg.replace('{host}', host).replace('{detail}', netTest.message),
        confirmVariant: 'danger',
        confirmText: tp.dialogOk
      });
      return;
    }

    // 2. Lưu Credential nếu người dùng nhập
    if (lanUsername.trim()) {
      const credCmd = `cmdkey /add:${host} /user:"${lanUsername.trim()}" /pass:"${lanPassword.trim()}"`;
      await runSystemCommand(credCmd, false);
    }

    // 3. Thực hiện kết nối máy in qua PowerShell Add-Printer
    const addCmd = `Add-Printer -ConnectionName '${fullPath}' -ErrorAction Stop`;
    const res = await runSystemCommand(addCmd, true);

    // 4. XÁC MINH THỰC TẾ: Đọc lại danh sách máy in từ hệ thống để đảm bảo máy in ĐÃ ĐƯỢC THÊM THẬT SỰ
    await new Promise(r => setTimeout(r, 800));
    const currentPrinters = await getSystemPrinters();
    const isActuallyAdded = currentPrinters.some(p => 
      p.name.toLowerCase() === fullPath.toLowerCase() ||
      p.port.toLowerCase().includes(host.toLowerCase()) ||
      p.name.toLowerCase().includes(pName.toLowerCase())
    );

    setIsConnectingLan(false);

    if (!res.success || !isActuallyAdded) {
      // Báo lỗi rõ ràng và KHÔNG đóng modal, KHÔNG báo thành công ảo
      const rawError = res.stderr.trim();
      let friendlyError = '';
      if (rawError.includes('0x80070709') || rawError.includes('printer name is invalid') || rawError.includes('does not exist')) {
        friendlyError = tp.errPrinterNotFound.replace('{host}', host).replace('{printer}', pName);
      } else if (rawError.includes('0x80070005') || rawError.includes('Access is denied')) {
        friendlyError = tp.errAccessDenied;
      } else {
        friendlyError = rawError || tp.errSystemNotFound;
      }

      setCustomDialog({
        isOpen: true,
        type: 'alert',
        title: tp.addLanErrorTitle,
        message: tp.addLanErrorMsg.replace('{path}', fullPath).replace('{detail}', friendlyError),
        confirmVariant: 'danger',
        confirmText: tp.dialogOk
      });
      return;
    }

    // 5. Kết nối THẬT SỰ thành công
    setShowAddLanModal(false);
    setLanHost('');
    setLanPrinterName('');
    setLanUsername('');
    setLanPassword('');

    showNotification(tp.noticeLanPrinterAdded.replace('{host}', host).replace('{printer}', pName));
    fetchPrinters();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Dialog Window with fixed height to prevent UI shift */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="printer-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl h-[640px] max-h-[92vh] bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-[#20304a] rounded-[6px] shadow-2xl overflow-hidden flex flex-col z-10 text-slate-900 dark:text-slate-100"
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#090f1b] border-b border-slate-200 dark:border-[#1e2f47] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-[6px] bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 id="printer-modal-title" className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                {tp.title}
                <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-[6px] bg-slate-200 dark:bg-[#15233c] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-[#223553]">
                  {printers.length}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {tp.desc}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-[6px] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Toast Notification at Bottom (Zero Layout Shift) */}
        {actionNotice && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex items-center gap-2 px-4 py-2 bg-slate-900/95 dark:bg-[#071324]/95 text-cyan-300 dark:text-cyan-200 border border-cyan-500/40 rounded-full shadow-2xl backdrop-blur-md text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Modal Body: 2 Columns (Left: Printer List, Right: Quick Inspector & Actions) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-0">

          {/* Left Column (5/12): Printer Selector List */}
          <div className="md:col-span-5 border-r border-slate-200 dark:border-[#1e2f47] flex flex-col bg-slate-50/50 dark:bg-[#0a1120] min-h-0">

            {/* Search Box, Refresh Button & Add LAN Printer Button */}
            <div className="p-3 border-b border-slate-200 dark:border-[#1e2f47] shrink-0 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={tp.search}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white dark:bg-[#070c17] border border-slate-300 dark:border-[#20304a] rounded-[6px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Refresh / Scan button */}
              <button
                type="button"
                onClick={() => fetchPrinters()}
                disabled={isLoadingPrinters}
                title={tp.scanPrintersTitle}
                className="flex items-center justify-center w-7 h-7 text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-[#131d2e] border border-slate-300 dark:border-[#20304a] hover:border-cyan-500 rounded-[6px] shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPrinters ? 'animate-spin text-cyan-500' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => setShowAddLanModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-[6px] shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-98 shrink-0"
                title={tp.addLanPrinter}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{tp.addLanPrinter}</span>
              </button>
            </div>

            {/* Scrollable Printers */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
              {isLoadingPrinters ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center text-slate-400 dark:text-slate-400">
                  <Loader2 className="w-7 h-7 mb-2 animate-spin text-cyan-500" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {tp.scanningPrintersText}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {tp.queryingSpoolerText}
                  </p>
                </div>
              ) : filteredPrinters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-slate-400 dark:text-slate-500">
                  <Printer className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {printers.length === 0 ? tp.emptyListNoPrinters : tp.emptyListNoMatching}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {printers.length === 0 ? tp.emptyListHelpNoPrinters : tp.emptyListHelpNoMatching}
                  </p>
                </div>
              ) : (
                filteredPrinters.map((printer) => {
                  const isSelected = selectedPrinter ? printer.id === selectedPrinter.id : false;
                const totalJobs = printer.queueJobs.length;

                return (
                  <div
                    key={printer.id}
                    onClick={() => setSelectedPrinterId(printer.id)}
                    className={`p-3 rounded-[6px] border transition-all cursor-pointer select-none text-xs flex items-center justify-between gap-2.5 ${isSelected
                      ? 'bg-cyan-50/80 dark:bg-cyan-950/50 border-cyan-400 dark:border-cyan-600/80 shadow-xs'
                      : 'bg-white dark:bg-[#0e172a] border-slate-200 dark:border-[#1b2b45] hover:border-slate-300 dark:hover:border-[#283e63]'
                      }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-[4px] shrink-0 mt-0.5 ${isSelected
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-100 dark:bg-[#15233c] text-slate-600 dark:text-slate-300'
                        }`}>
                        <Printer className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-bold truncate ${isSelected
                            ? 'text-cyan-900 dark:text-cyan-200'
                            : 'text-slate-900 dark:text-slate-100'
                            }`}>
                            {printer.name}
                          </span>

                          {printer.isDefault && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              Default
                            </span>
                          )}

                          {/* Remote LAN Printer (Shared by someone else) */}
                          {(printer.isRemoteLan || printer.port.startsWith('\\\\')) ? (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 flex items-center gap-1">
                              <Network className="w-2.5 h-2.5" />
                              <span>{tp.badgeShared}</span>
                            </span>
                          ) : printer.isSharing ? (
                            /* Local Printer (Being shared by this PC) */
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-1">
                              <Share2 className="w-2.5 h-2.5" />
                              <span>{tp.badgeSharing}</span>
                            </span>
                          ) : null}
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {printer.port}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className={`w-2 h-2 rounded-full ${printer.status === 'ready'
                        ? 'bg-emerald-500'
                        : printer.status === 'offline'
                          ? 'bg-slate-400'
                          : 'bg-rose-500'
                        }`} title={printer.status} />
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>

          {/* Right Column (7/12): Quick Inspector (Queue & Control Actions) */}
          <div className="md:col-span-7 flex flex-col bg-white dark:bg-[#0c1424] min-h-0">
            {selectedPrinter ? (
              <>
                {/* Printer Details Summary */}
                <div className="p-4 border-b border-slate-200 dark:border-[#1e2f47] bg-slate-50/70 dark:bg-[#0a101e] shrink-0 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${selectedPrinter.status === 'ready'
                      ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                      : selectedPrinter.status === 'offline'
                        ? 'bg-slate-400'
                        : 'bg-rose-500 ring-2 ring-rose-500/20'
                      }`}
                    title={selectedPrinter.status === 'ready' ? 'Ready' : selectedPrinter.status === 'offline' ? 'Offline' : 'Error'}
                  />
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedPrinter.name}
                  </h4>
                </div>

              </div>

              {/* Action Buttons Bar: In Test, Preferences, Properties, Set Default, Clear Queue, View Queue, Remove Device */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {/* 1. In Test */}
                <button
                  type="button"
                  onClick={handlePrintTest}
                  disabled={!!actionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-[6px] shadow-xs transition-all cursor-pointer active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed"
                  title={tp.printTestDesc}
                >
                  {actionLoading === 'test_page' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-white" />
                  )}
                  <span>{tp.printTest}</span>
                </button>

                {/* 2. Preferences */}
                <button
                  type="button"
                  onClick={handleOpenPreferences}
                  disabled={!!actionLoading}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#131f37] border border-slate-300 dark:border-[#223553] hover:bg-slate-50 dark:hover:bg-[#1a2c4c] rounded-[6px] shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  title={tp.preferencesDesc}
                >
                  {actionLoading === 'preferences' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-500" />
                  ) : (
                    <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  )}
                  <span>{tp.preferences}</span>
                </button>

                {/* 3. Properties */}
                <button
                  type="button"
                  onClick={handleOpenProperties}
                  disabled={!!actionLoading}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#131f37] border border-slate-300 dark:border-[#223553] hover:bg-slate-50 dark:hover:bg-[#1a2c4c] rounded-[6px] shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  title={tp.propertiesDesc}
                >
                  {actionLoading === 'properties' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-500" />
                  ) : (
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  )}
                  <span>{tp.properties}</span>
                </button>

                {/* 4. Set as Default */}
                <button
                  type="button"
                  onClick={handleSetDefault}
                  disabled={selectedPrinter.isDefault || !!actionLoading}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-[6px] shadow-xs transition-all disabled:opacity-60 disabled:cursor-not-allowed ${selectedPrinter.isDefault
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-default'
                    : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-[#131f37] border border-slate-300 dark:border-[#223553] hover:bg-slate-50 dark:hover:bg-[#1a2c4c] cursor-pointer active:scale-98'
                    }`}
                  title={tp.setDefaultDesc}
                >
                  {actionLoading === 'set_default' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-500" />
                  ) : (
                    <Star className={`w-3.5 h-3.5 ${selectedPrinter.isDefault ? 'fill-emerald-500 text-emerald-600' : 'text-slate-400'}`} />
                  )}
                  <span>{selectedPrinter.isDefault ? tp.isDefault : tp.setDefault}</span>
                </button>

                {/* 5. View Native Windows Queue Button */}
                <button
                  type="button"
                  onClick={handleOpenSystemQueue}
                  disabled={!!actionLoading}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#131f37] border border-slate-300 dark:border-[#223553] hover:bg-slate-50 dark:hover:bg-[#1a2c4c] rounded-[6px] shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  title={tp.viewQueueDesc}
                >
                  {actionLoading === 'queue' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-500" />
                  ) : (
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  )}
                  <span>{tp.viewQueue}</span>
                </button>

                {/* 6. Clear / Delete Queue Button */}
                <button
                  type="button"
                  onClick={handleClearPrinterQueue}
                  disabled={!!actionLoading}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-[6px] shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  title={tp.clearQueueDesc}
                >
                  {actionLoading === 'clear_queue' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  )}
                  <span>{tp.clearQueue}</span>
                </button>

                {/* 7. Remove Device Button */}
                <button
                  type="button"
                  onClick={handleRemoveDevice}
                  disabled={!!actionLoading}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-white dark:bg-[#131f37] border border-rose-300 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-[6px] shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  title={tp.removeDeviceDesc}
                >
                  {actionLoading === 'remove_device' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  )}
                  <span>{tp.removeDevice}</span>
                </button>
              </div>
            </div>

            {/* Content Body: Scrollable inspector container to prevent cut off */}
            <div className="flex-1 p-4 space-y-3.5 flex flex-col justify-start overflow-y-auto custom-scrollbar">

              {isRemotePrinter ? (
                /* Remote LAN Printer Info Card */
                <div className="p-4 rounded-[6px] border border-cyan-200 dark:border-[#1e3455] bg-cyan-50/40 dark:bg-[#071324] space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-cyan-200/60 dark:border-[#192b45]">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-cyan-800 dark:text-cyan-300 flex items-center gap-2">
                      <Network className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span>{tp.lanInfoTitle}</span>
                    </h5>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                      {tp.badgeShared}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-[4px] bg-white dark:bg-[#0d1728] border border-slate-200 dark:border-[#1c2c45]">
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
                        {tp.lanServerHost}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white truncate block">
                        {selectedPrinter.serverHost || (selectedPrinter.port.startsWith('\\\\') ? selectedPrinter.port.split('\\')[2] : 'LAN Host')}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-[4px] bg-white dark:bg-[#0d1728] border border-slate-200 dark:border-[#1c2c45]">
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
                        {tp.lanShareName}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white truncate block">
                        {selectedPrinter.shareName || (selectedPrinter.port.startsWith('\\\\') ? selectedPrinter.port.split('\\')[3] : selectedPrinter.name)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {tp.lanUncPath}
                    </label>
                    <div className="px-3 py-1.5 text-xs font-mono font-bold text-cyan-800 dark:text-cyan-200 bg-white dark:bg-[#0d1728] border border-cyan-200 dark:border-[#1c2c45] rounded-[4px] select-all">
                      {selectedPrinter.port}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-[4px] bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <span>{tp.lanNotice}</span>
                  </div>
                </div>
              ) : (
                /* Local Printer Sharing Controls */
                <>
                  {/* Manage advanced sharing settings (Windows 11 Settings Style Card) */}
                  <div
                    onClick={handleOpenAdvancedSharing}
                    className="p-3 rounded-[6px] border border-slate-200 dark:border-[#1e2f47] bg-slate-50/70 dark:bg-[#0a1120] hover:bg-slate-100/80 dark:hover:bg-[#0f1a30] hover:border-cyan-500/60 transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-[6px] bg-slate-200/80 dark:bg-[#15233c] text-cyan-600 dark:text-cyan-400 border border-slate-300/80 dark:border-[#223553] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Layers className="w-4 h-4 stroke-[1.75]" />
                      </div>
                      <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                        {tp.manageAdvancedSharing}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAdvancedSharing();
                      }}
                      className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#131f37] border border-slate-300 dark:border-[#223553] hover:bg-cyan-50 dark:hover:bg-cyan-950 hover:text-cyan-600 dark:hover:text-cyan-300 hover:border-cyan-400 dark:hover:border-cyan-700 rounded-[6px] shadow-xs transition-all cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-98"
                    >
                      <span>{tp.open}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-cyan-500" />
                    </button>
                  </div>

                  {/* In-Dialog Sharing Toggle & Share Name Configuration */}
                  <div className="p-3.5 rounded-[6px] border border-slate-200 dark:border-[#1e2f47] bg-slate-50/60 dark:bg-[#090f1b] space-y-2.5">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Share2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span>{tp.sharingConfig}</span>
                    </h5>

                    {/* Toggle Checkbox */}
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isSharedDraft}
                        onChange={(e) => setIsSharedDraft(e.target.checked)}
                        className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 dark:border-slate-700"
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {tp.allowSharing}
                      </span>
                    </label>

                    {/* Share Name Field - Always in DOM to prevent layout shift */}
                    <div className={`space-y-1 pt-1 transition-opacity duration-150 ${isSharedDraft ? 'opacity-100' : 'opacity-40 pointer-events-none select-none'}`}>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                        <span>{tp.shareName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">\\\\%PC_NAME%\\{shareNameDraft || 'SHARE_NAME'}</span>
                      </label>
                      <input
                        type="text"
                        disabled={!isSharedDraft}
                        value={shareNameDraft}
                        onChange={(e) => setShareNameDraft(e.target.value)}
                        placeholder="e.g. Canon_2900_LAN"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#131f37] border border-slate-300 dark:border-[#20304a] rounded-[6px] font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 disabled:bg-slate-100 dark:disabled:bg-[#070c17]"
                      />
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {tp.shareNameTip}
                      </p>
                    </div>

                    {/* Save Button */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleSaveSharing}
                        disabled={!!actionLoading}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-[6px] shadow-xs transition-all cursor-pointer active:scale-98 flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {actionLoading === 'save_sharing' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>{tp.saveSettings}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500">
            <div className="p-3.5 rounded-full bg-slate-100 dark:bg-[#131f37] mb-3">
              <Printer className="w-8 h-8 opacity-40 text-slate-500 dark:text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {tp.noPrinterSelectedTitle}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1.5 leading-relaxed">
              {tp.noPrinterSelectedDesc}
            </p>
          </div>
        )}

      </div>

        </div>

        {/* Add LAN Printer Modal Overlay - Pure clean dark backdrop, no weird nested blur */}
        {showAddLanModal && (
          <div 
            onClick={() => setShowAddLanModal(false)}
            className="absolute inset-0 z-40 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-150 cursor-pointer"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-[#20304a] rounded-[6px] shadow-2xl p-5 space-y-4 cursor-default"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#1e2f47]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-[4px] bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
                    <Network className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {tp.addLanModalTitle}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {tp.addLanModalDesc}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddLanModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-[4px] hover:bg-slate-100 dark:hover:bg-[#1a2c4c] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form with 4 requested fields */}
              <form onSubmit={handleAddLanPrinter} className="space-y-3">
                {/* 1. PC Name or IP */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {tp.hostFieldLabel} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={tp.hostPlaceholder}
                    value={lanHost}
                    onChange={(e) => setLanHost(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#070c17] border border-slate-300 dark:border-[#20304a] rounded-[6px] font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* 2. Printer Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {tp.printerFieldLabel} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={tp.printerPlaceholder}
                    value={lanPrinterName}
                    onChange={(e) => setLanPrinterName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#070c17] border border-slate-300 dark:border-[#20304a] rounded-[6px] font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* 3 & 4. Username & Password (Optional) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {tp.userFieldLabel}
                    </label>
                    <input
                      type="text"
                      placeholder={tp.userPlaceholder}
                      value={lanUsername}
                      onChange={(e) => setLanUsername(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#070c17] border border-slate-300 dark:border-[#20304a] rounded-[6px] font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {tp.passFieldLabel}
                    </label>
                    <input
                      type="password"
                      placeholder={tp.passPlaceholder}
                      value={lanPassword}
                      onChange={(e) => setLanPassword(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#070c17] border border-slate-300 dark:border-[#20304a] rounded-[6px] font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#1e2f47]">
                  <button
                    type="button"
                    onClick={() => setShowAddLanModal(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a2c4c] rounded-[6px] border border-slate-300 dark:border-[#223553] transition-colors"
                  >
                    {tp.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isConnectingLan}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-[6px] shadow-xs transition-all cursor-pointer active:scale-98 flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isConnectingLan ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>{isConnectingLan ? tp.connecting : tp.connectBtn}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Custom Confirmation / Alert Dialog (Replaces native browser window.confirm / alert) */}
        {customDialog.isOpen && (
          <div 
            onClick={() => setCustomDialog(prev => ({ ...prev, isOpen: false }))}
            className="absolute inset-0 z-50 bg-black/55 flex items-center justify-center p-4 animate-in fade-in duration-150 cursor-pointer"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white dark:bg-[#0d1627] border border-slate-200 dark:border-[#20304a] rounded-[6px] shadow-2xl px-5 pt-4 pb-3 space-y-4 cursor-default"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-[4px] shrink-0 ${customDialog.confirmVariant === 'danger'
                  ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                  : 'bg-cyan-50 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900'
                  }`}>
                  {customDialog.confirmVariant === 'danger' ? (
                    <Trash2 className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {customDialog.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {customDialog.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#1e2f47]">
                {customDialog.type === 'confirm' && (
                  <button
                    type="button"
                    onClick={() => setCustomDialog(prev => ({ ...prev, isOpen: false }))}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a2c4c] rounded-[6px] border border-slate-300 dark:border-[#223553] transition-colors"
                  >
                    {customDialog.cancelText || tp.dialogCancel}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const action = customDialog.onConfirm;
                    setCustomDialog(prev => ({ ...prev, isOpen: false }));
                    if (action) action();
                  }}
                  className={`px-4 py-1.5 text-xs font-bold text-white rounded-[6px] shadow-xs transition-all cursor-pointer active:scale-98 ${customDialog.confirmVariant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-cyan-600 hover:bg-cyan-500'
                    }`}
                >
                  {customDialog.confirmText || (customDialog.type === 'confirm' ? tp.dialogConfirm : tp.dialogOk)}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
