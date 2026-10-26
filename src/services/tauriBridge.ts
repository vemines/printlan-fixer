import { invoke } from '@tauri-apps/api/core';
import { Language, TRANSLATIONS } from '../i18n/translations';

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exit_code: number;
}

export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/**
 * Thực thi lệnh CMD hoặc PowerShell qua Rust backend nếu trong môi trường Tauri
 */
export async function runSystemCommand(command: string, isPowerShell: boolean = false): Promise<ExecutionResult> {
  if (isTauriEnvironment()) {
    try {
      const res = await invoke<ExecutionResult>('execute_command', {
        command,
        isPowershell: isPowerShell,
      });
      return res;
    } catch (err: unknown) {
      return {
        success: false,
        stdout: '',
        stderr: err instanceof Error ? err.message : String(err),
        exit_code: -1,
      };
    }
  }

  // Fallback mô phỏng khi chạy trên web browser thông thường
  await new Promise((r) => setTimeout(r, 300));
  return {
    success: true,
    stdout: `[WEB_SIMULATION] ${command}`,
    stderr: '',
    exit_code: 0,
  };
}

/**
 * Gọi hàm xử lý lỗi 709 máy chủ từ Rust
 */
export async function apply709OptionRust(optionId: 'replace_dll' | 'registry_rpc' | 'restore_backup'): Promise<ExecutionResult> {
  if (isTauriEnvironment()) {
    try {
      const res = await invoke<ExecutionResult>('apply_709_server_option', {
        optionId,
      });
      return res;
    } catch (err: unknown) {
      return {
        success: false,
        stdout: '',
        stderr: err instanceof Error ? err.message : String(err),
        exit_code: -1,
      };
    }
  }

  await new Promise((r) => setTimeout(r, 300));
  return {
    success: true,
    stdout: `[WEB_SIMULATION] Applied 709 option: ${optionId}`,
    stderr: '',
    exit_code: 0,
  };
}

export interface SystemStatus {
  is_admin: boolean;
  spooler_running: boolean;
  spooler_status_text: string;
  firewall_sharing_enabled: boolean;
  port_445_open: boolean;
  port_135_open: boolean;
}

export interface PrinterJob {
  id: string;
  document_name: string;
  user: string;
  pages: number;
  size: string;
  submitted_at: string;
  status: string;
}

export interface PrinterItem {
  id: string;
  name: string;
  driver: string;
  port: string;
  is_default: boolean;
  is_sharing: boolean;
  is_remote_lan: boolean;
  server_host?: string;
  share_name?: string;
  status: 'ready' | 'offline' | 'error';
  queue_jobs: PrinterJob[];
}

export interface CredentialItem {
  id: string;
  target: string;
  raw_target?: string;
  user: string;
  cred_type: string;
}

export interface TargetTestResult {
  success: boolean;
  message: string;
}

/**
 * Kiểm tra quyền Administrator
 */
export async function checkIsAdmin(): Promise<boolean> {
  if (isTauriEnvironment()) {
    try {
      return await invoke<boolean>('check_is_admin');
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * Quét toàn bộ trạng thái hệ thống thực tế (Spooler, Firewall, Port 445/135, Admin)
 */
export async function getSystemStatus(): Promise<SystemStatus> {
  if (isTauriEnvironment()) {
    try {
      return await invoke<SystemStatus>('get_system_status');
    } catch {
      return {
        is_admin: false,
        spooler_running: false,
        spooler_status_text: 'Error',
        firewall_sharing_enabled: false,
        port_445_open: false,
        port_135_open: false,
      };
    }
  }

  // Fallback khi chạy web browser
  return {
    is_admin: true,
    spooler_running: true,
    spooler_status_text: 'Running',
    firewall_sharing_enabled: true,
    port_445_open: true,
    port_135_open: true,
  };
}

/**
 * Quét danh sách máy in và hàng đợi in thực tế từ Windows WMI / Spooler
 */
export async function getSystemPrinters(): Promise<PrinterItem[]> {
  if (isTauriEnvironment()) {
    try {
      return await invoke<PrinterItem[]>('get_system_printers');
    } catch (err: unknown) {
      console.error('Failed to get system printers:', err);
      return [];
    }
  }

  return [];
}

/**
 * Lấy danh sách tài khoản kết nối mạng từ Windows Credential Manager
 */
export async function getStoredCredentials(): Promise<CredentialItem[]> {
  if (isTauriEnvironment()) {
    try {
      return await invoke<CredentialItem[]>('get_stored_credentials');
    } catch (err: unknown) {
      console.error('Failed to get stored credentials:', err);
      return [];
    }
  }

  return [];
}

/**
 * Xóa thông tin đăng nhập trong Windows Credential Manager
 */
export async function deleteStoredCredential(target: string): Promise<ExecutionResult> {
  if (isTauriEnvironment()) {
    try {
      return await invoke<ExecutionResult>('delete_stored_credential', { target });
    } catch (err: unknown) {
      return {
        success: false,
        stdout: '',
        stderr: err instanceof Error ? err.message : String(err),
        exit_code: -1,
      };
    }
  }

  return { success: true, stdout: 'Deleted', stderr: '', exit_code: 0 };
}

/**
 * Kiểm tra kết nối mạng thực tế tới máy chủ (SMB 445, RPC 135, ICMP Ping)
 */
export async function testNetworkTarget(target: string): Promise<TargetTestResult> {
  if (isTauriEnvironment()) {
    try {
      return await invoke<TargetTestResult>('test_network_target', { target });
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return {
    success: true,
    message: '[WEB] Connected successfully to ' + target,
  };
}

export function translateNetworkTargetMsg(msg: string, lang: Language): string {
  const nm = TRANSLATIONS[lang]?.networkMessages;
  if (!nm) return msg;
  if (msg.includes('SMB Port') || msg.includes('TCP 445')) {
    return nm.smbOpen;
  }
  if (msg.includes('RPC Port') || msg.includes('TCP 135')) {
    return nm.rpcOpen;
  }
  if (msg.includes('ICMP Ping')) {
    return nm.icmpPing;
  }
  if (msg.includes('Cannot reach') || msg.includes('Offline')) {
    return nm.cannotReach;
  }
  if (msg.includes('Invalid host')) {
    return nm.invalidHost;
  }
  return msg;
}

/**
 * Mở trực tiếp các cửa sổ giao diện Win32 native của máy in (Properties, Preferences, Queue, Test Page)
 * mà không bị ẩn bởi CREATE_NO_WINDOW và không block app
 */
export async function openPrinterGui(
  printerName: string,
  action: 'properties' | 'preferences' | 'queue' | 'test_page'
): Promise<{ success: boolean; error?: string }> {
  if (isTauriEnvironment()) {
    try {
      await invoke('open_printer_gui', { printerName, action });
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return { success: true };
}

/**
 * Mở URL trên trình duyệt web mặc định của hệ thống
 */
export async function openBrowserUrl(url: string): Promise<void> {
  if (isTauriEnvironment()) {
    try {
      await invoke('open_browser_url', { url });
      return;
    } catch (err) {
      console.error('Failed to open url via tauri:', err);
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}
