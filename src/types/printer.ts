export type ErrorRole = 'server' | 'client' | 'both';

export type ErrorCategory = 
  | 'rpc' 
  | 'point_and_print' 
  | 'driver' 
  | 'network' 
  | 'security' 
  | 'spooler'
  | 'win11_modern';

export interface CommandScript {
  cmd?: string;
  powershell?: string;
  reg?: string;
}

export interface RegistryChange {
  path: string;
  key: string;
  type: 'REG_DWORD' | 'REG_SZ';
  value: string | number;
  description: string;
}

export interface AlternativeScript {
  id: string;
  title: string;
  note?: string;
  cmd: string;
  powershell?: string;
}

export interface PrinterError {
  id: string;
  code: string;               // e.g. "0x0000011b" or "0x00000bc4"
  win32Code?: string;          // e.g. "ERROR_PRINTER_NOT_FOUND" or "1801"
  name: string;               // Tiêu đề ngắn gọn
  role: ErrorRole;            // 'server' | 'client' | 'both'
  category: ErrorCategory;
  shortDesc: string;          // Tóm tắt 1 câu
  rootCause: string;          // Nguyên nhân cốt lõi chuyên sâu
  affectedWindows: string[];  // ['Win 10', 'Win 11 22H2', 'Win 11 24H2']
  fixSteps: string[];         // Các bước khắc phục
  commands: CommandScript;    // Script có thể copy hoặc chạy
  alternativeScripts?: AlternativeScript[]; // Các script phương án lựa chọn (cho Máy Chủ 709...)
  registryChanges?: RegistryChange[];
  servicesAffected?: string[];
  riskNote?: string;          // Cảnh báo nếu có hạ bảo mật
  isPopular?: boolean;        // Lỗi thường gặp nhất
}

export type LogType = 'info' | 'success' | 'warn' | 'error' | 'step' | 'cmd';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: LogType;
  message: string;
  stepNumber?: number;
  totalSteps?: number;
}

export interface UtilityItem {
  id: string;
  title: string;
  group: 'spooler' | 'network' | 'drivers' | 'win11' | 'shortcuts';
  description: string;
  iconName: string;
  badge?: string;
  isDangerous?: boolean;
  steps: {
    title: string;
    action: string;
  }[];
  commands: CommandScript;
}
