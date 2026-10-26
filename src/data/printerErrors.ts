import { PrinterError } from '../types/printer';

export const PRINTER_ERRORS: PrinterError[] = [
  // ==========================================
  // NHÓM DÒNG MÃ "BC" (0x00000BCx - Point & Print & Driver Package)
  // ==========================================
  {
    id: 'err-bc4',
    code: '0x00000bc4',
    win32Code: 'ERROR_PRINTER_NOT_FOUND (3012)',
    name: 'Không tìm thấy máy in (Win 11 RPC Block)',
    role: 'client',
    category: 'rpc',
    isPopular: true,
    shortDesc: 'Windows không tìm thấy máy in khi duyệt chia sẻ trên Windows 11 22H2/23H2/24H2.',
    rootCause: 'Bản cập nhật Windows 11 thay đổi chính sách RPC mặc định sang "RPC over TCP", chặn kết nối RPC over Named Pipes truyền thống qua port 445 SMB.',
    affectedWindows: ['Windows 11 22H2', 'Windows 11 23H2', 'Windows 11 24H2'],
    fixSteps: [
      'Bật chính sách cho phép RPC over Named Pipes trong Registry máy trạm',
      'Cho phép fallback xác thực NTLM khi kết nối máy in qua IP (ForceKerberosForRpc = 0)',
      'Khởi động lại dịch vụ Print Spooler',
      'Kết nối lại máy in qua đường dẫn IP: \\\\IP_MAY_CHU\\TEN_SHARE'
    ],
    commands: {
      cmd: `reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Printers\\RPC" /v RpcUseNamedPipeProtocol /t REG_DWORD /d 1 /f
reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Printers\\RPC" /v ForceKerberosForRpc /t REG_DWORD /d 0 /f
net stop spooler /y & net start spooler`,
      powershell: `$rpcKey = "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Printers\\RPC"
if (-not (Test-Path $rpcKey)) { New-Item -Path $rpcKey -Force | Out-Null }
Set-ItemProperty -Path $rpcKey -Name "RpcUseNamedPipeProtocol" -Value 1 -Type DWord
Set-ItemProperty -Path $rpcKey -Name "ForceKerberosForRpc" -Value 0 -Type DWord
Restart-Service -Name Spooler -Force`
    },
    registryChanges: [
      {
        path: 'HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Printers\\RPC',
        key: 'RpcUseNamedPipeProtocol',
        type: 'REG_DWORD',
        value: 1,
        description: 'Ép buộc Windows 11 dùng RPC qua Named Pipes (TCP 445) thay vì chỉ RPC over TCP'
      },
      {
        path: 'HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Printers\\RPC',
        key: 'ForceKerberosForRpc',
        type: 'REG_DWORD',
        value: 0,
        description: 'Cho phép fallback sang xác thực NTLM khi kết nối máy in qua IP'
      }
    ],
    servicesAffected: ['Spooler']
  },
  {
    id: 'err-bcb',
    code: '0x00000bcb',
    win32Code: 'ERROR_PRINTER_DRIVER_DOWNLOAD_NEEDED (3019)',
    name: 'Bị chặn tải Driver máy in chia sẻ',
    role: 'client',
    category: 'point_and_print',
    isPopular: true,
    shortDesc: 'Máy trạm không thể tự tải và cài đặt driver từ máy chủ do chính sách bảo mật Point and Print.',
    rootCause: 'Sau bản cập nhật bảo mật PrintNightmare của Microsoft, tài khoản người dùng thông thường (Standard User) không được phép tự nạp driver từ xa nếu không có quyền Administrator.',
    affectedWindows: ['Windows 10 20H2+', 'Windows 11 All Versions'],
    fixSteps: [
      'Gỡ bỏ giới hạn cài đặt Driver chỉ dành cho Administrator trong Registry',
      'Tắt cảnh báo nhắc quyền Elevation khi kết nối máy in Point and Print',
      'Khởi động lại Spooler và kết nối lại máy in'
    ],
    commands: {
      cmd: `reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Printers\\PointAndPrint" /v RestrictDriverInstallationToAdministrators /t REG_DWORD /d 0 /f
reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Printers\\PointAndPrint" /v NoWarningNoElevationOnInstall /t REG_DWORD /d 1 /f
reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Printers\\PointAndPrint" /v UpdatePromptSettings /t REG_DWORD /d 2 /f
net stop spooler /y & net start spooler`,
      powershell: `$pnp = "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Printers\\PointAndPrint"
if (-not (Test-Path $pnp)) { New-Item -Path $pnp -Force | Out-Null }
Set-ItemProperty -Path $pnp -Name "RestrictDriverInstallationToAdministrators" -Value 0 -Type DWord
Set-ItemProperty -Path $pnp -Name "NoWarningNoElevationOnInstall" -Value 1 -Type DWord
Set-ItemProperty -Path $pnp -Name "UpdatePromptSettings" -Value 2 -Type DWord
Restart-Service -Name Spooler -Force`
    },
    riskNote: 'Cho phép cài đặt driver từ máy chủ mạng LAN (Trong môi trường doanh nghiệp nên dùng Whitelist Server để phòng chống CVE-2021-34527).',
    servicesAffected: ['Spooler']
  },
  {
    id: 'err-bc5',
    code: '0x00000bc5',
    win32Code: 'ERROR_PRINTER_DRIVER_WARNED (3013)',
    name: 'Cảnh báo Driver máy in không đáng tin cậy',
    role: 'client',
    category: 'driver',
    shortDesc: 'The printer driver is known to be unreliable.',
    rootCause: 'Driver nằm trong danh sách cảnh báo của hệ thống hoặc phát sinh cảnh báo tương thích khi nạp từ xa.',
    affectedWindows: ['Windows 10', 'Windows 11'],
    fixSteps: [
      'Kiểm tra kho driver PnPUtil trên máy trạm',
      'Nâng cấp driver WHQL mới nhất từ nhà sản xuất',
      'Cài đặt driver chính thức cục bộ (Local Install) trước khi kết nối'
    ],
    commands: {
      cmd: `pnputil /enum-drivers
rundll32 printui.dll,PrintUIEntry /s /t2`,
      powershell: `Get-PrinterDriver | Format-Table Name, MajorVersion, DriverVersion, InfPath`
    }
  },
  {
    id: 'err-bc6',
    code: '0x00000bc6',
    win32Code: 'ERROR_PRINTER_DRIVER_BLOCKED (3014)',
    name: 'Driver máy in bị chặn (Nguy hại hệ thống)',
    role: 'client',
    category: 'driver',
    shortDesc: 'The printer driver is known to harm the system.',
    rootCause: 'Driver nằm trong danh sách cấm/chặn (Blocklist) của Windows do vi phạm bảo mật hoặc gây mất an toàn hệ thống.',
    affectedWindows: ['Windows 10', 'Windows 11'],
    fixSteps: [
      'Gỡ bỏ driver nằm trong Blocklist',
      'Chuyển sang driver PCL6/PostScript chuẩn hoặc Universal Print Driver',
      'Cài đặt driver chính thức cục bộ qua pnputil'
    ],
    commands: {
      cmd: `pnputil /enum-drivers
rundll32 printui.dll,PrintUIEntry /s /t2`,
      powershell: `Get-PrinterDriver | Format-Table Name, MajorVersion, DriverVersion, InfPath`
    }
  },
  {
    id: 'err-bc7',
    code: '0x00000bc7',
    win32Code: 'ERROR_PRINTER_DRIVER_PACKAGE_IN_USE (3015)',
    name: 'Gói Driver đang bận sử dụng',
    role: 'both',
    category: 'driver',
    shortDesc: 'Không thể cập nhật hoặc ghi đè driver do đang có tiến trình spooler nắm giữ file.',
    rootCause: 'Gói driver đang được liên kết với một máy in hoặc cổng in đang hoạt động nên Windows chặn việc xóa/ghi đè file DLL.',
    affectedWindows: ['Windows 10', 'Windows 11'],
    fixSteps: [
      'Dừng Spooler và kiểm tra các máy in đang sử dụng gói driver này',
      'Dọn sạch các lệnh in đang kẹt trong thư mục Spool PRINTERS',
      'Xóa kết nối máy in cũ trước khi cập nhật hoặc gỡ driver qua PnPUtil',
      'Khởi động lại Spooler'
    ],
    commands: {
      cmd: `net stop spooler /y
taskkill /f /im spoolsv.exe /im printisolationhost.exe 2>nul
del /q /f "%SystemRoot%\\System32\\spool\\PRINTERS\\*.*" 2>nul
net start spooler`,
      powershell: `Stop-Service -Name Spooler -Force -ErrorAction SilentlyContinue
Stop-Process -Name spoolsv, printisolationhost -Force -ErrorAction SilentlyContinue
Remove-Item "$env:SystemRoot\\System32\\spool\\PRINTERS\\*.*" -Force -ErrorAction SilentlyContinue
Start-Service -Name Spooler`
    }
  },
  {
    id: 'err-bc8',
    code: '0x00000bc8',
    win32Code: 'ERROR_CORE_DRIVER_PACKAGE_NOT_FOUND (3016)',
    name: 'Thiếu gói Core Driver lõi của Windows',
    role: 'client',
    category: 'driver',
    shortDesc: 'Máy trạm thiếu các file driver nền tảng (ntprint.inf / mscms.dll) để nạp driver máy in.',
    rootCause: 'Bản cài đặt Windows Lite (tinh giảm) hoặc Windows cập nhật thiếu tính năng Internet Printing Client, thiếu file mscms.dll trong thư mục spool drivers.',
    affectedWindows: ['Windows 10', 'Windows 11'],
    fixSteps: [
      'Dừng dịch vụ Print Spooler trước khi can thiệp file driver',
      'Kích hoạt tính năng Internet Printing Client qua DISM',
      'Sao chép mscms.dll vào thư mục spool drivers x64\\3 (hoặc arm64\\3 trên ARM64)',
      'Khởi động lại Spooler'
    ],
    commands: {
      cmd: `net stop spooler /y
if not exist "%SystemRoot%\\System32\\spool\\drivers\\x64\\3" mkdir "%SystemRoot%\\System32\\spool\\drivers\\x64\\3"
copy /y "%SystemRoot%\\System32\\mscms.dll" "%SystemRoot%\\System32\\spool\\drivers\\x64\\3\\mscms.dll"
if exist "%SystemRoot%\\SysWOW64\\mscms.dll" (
    if not exist "%SystemRoot%\\System32\\spool\\drivers\\w32x86\\3" mkdir "%SystemRoot%\\System32\\spool\\drivers\\w32x86\\3"
    copy /y "%SystemRoot%\\SysWOW64\\mscms.dll" "%SystemRoot%\\System32\\spool\\drivers\\w32x86\\3\\mscms.dll"
)
net start spooler`,
      powershell: `Stop-Service -Name Spooler -Force -ErrorAction SilentlyContinue
$dest64 = "$env:SystemRoot\\System32\\spool\\drivers\\x64\\3"
if (-not (Test-Path $dest64)) { New-Item -Path $dest64 -ItemType Directory -Force | Out-Null }
Copy-Item "$env:SystemRoot\\System32\\mscms.dll" "$dest64\\mscms.dll" -Force -ErrorAction SilentlyContinue
if (Test-Path "$env:SystemRoot\\SysWOW64\\mscms.dll") {
    $dest32 = "$env:SystemRoot\\System32\\spool\\drivers\\w32x86\\3"
    if (-not (Test-Path $dest32)) { New-Item -Path $dest32 -ItemType Directory -Force | Out-Null }
    Copy-Item "$env:SystemRoot\\SysWOW64\\mscms.dll" "$dest32\\mscms.dll" -Force -ErrorAction SilentlyContinue
}
Restart-Service -Name Spooler -Force`
    }
  },
  {
    id: 'err-bcd',
    code: '0x00000bcd',
    win32Code: 'ERROR_INVALID_PRINTER_DRIVER_MANIFEST (3021)',
    name: 'Lỗi Driver Manifest (Package Point & Print)',
    role: 'client',
    category: 'point_and_print',
    shortDesc: 'Gói driver máy in chứa manifest (.inf/.cat) không hợp lệ hoặc thiếu chữ ký catalog hợp lệ.',
    rootCause: 'File manifest của driver bị lỗi cú pháp hoặc vi phạm chính sách kiểm tra toàn vẹn của Windows Spooler. Lỗi này bắt nguồn từ chính gói driver, không thể khắc phục bằng can thiệp Registry.',
    affectedWindows: ['Windows 10', 'Windows 11'],
    fixSteps: [
      'Gỡ bỏ gói driver lỗi khỏi Driver Store qua PnPUtil',
      'Tải bản driver V3 WHQL chính hãng từ nhà sản xuất máy in',
      'Hoặc sử dụng driver Microsoft PCL6 / Universal Print Driver',
      'Cài đặt driver cục bộ trên máy trạm trước khi kết nối'
    ],
    commands: {
      cmd: `pnputil /enum-drivers`,
      powershell: `Get-PrinterDriver`
    },
    servicesAffected: ['Spooler']
  },
  {
    id: 'err-bce',
    code: '0x00000bce',
    win32Code: 'ERROR_PRINTER_NOT_SHAREABLE (3022)',
    name: 'Máy in không hỗ trợ chia sẻ / Tên share lỗi',
    role: 'server',
    category: 'network',
    shortDesc: 'Cổng máy in hoặc thiết bị không hỗ trợ chia sẻ, hoặc Share Name không hợp lệ.',
    rootCause: 'Cổng in cục bộ WSD/ảo không cho phép share, hoặc tên chia sẻ vượt quá 31 ký tự, có khoảng trắng hoặc dấu tiếng Việt.',
    affectedWindows: ['Windows 7', 'Windows 10', 'Windows 11'],
    fixSteps: [
      'Vào Máy Chủ > Printer Properties > Tab Sharing',
      'Đổi tên Share Name thành ký tự liền, không dấu, tối đa 12 ký tự (Ví dụ: HP_Laser, Canon2900)',
      'Đảm bảo cổng máy in là USB hoặc TCP/IP vật lý thay vì cổng ảo WSD'
    ],
    commands: {
      cmd: `rundll32 printui.dll,PrintUIEntry /Xs /n "TEN_MAY_IN" Shared TRUE ShareName "Canon2900"`,
      powershell: `Set-Printer -Name "TEN_MAY_IN" -Shared $true -ShareName "Canon2900"`
    }
  },

  // ==========================================
  // NHÓM LỖI PRINTNIGHTMARE & RPC PHỔ BIẾN
  // ==========================================
  {
    id: 'err-11b',
    code: '0x0000011b',
    win32Code: 'RPC_C_AUTHN_LEVEL_PKT_PRIVACY (KB5005565 / Win32 1819)',
    name: 'Lỗi bảo mật RPC Packet Privacy (KB5005565)',
    role: 'server',
    category: 'rpc',
    isPopular: true,
    shortDesc: 'Máy chủ ép mã hóa RPC Packet Privacy khiến máy trạm chưa cập nhật bị từ chối kết nối.',
    rootCause: 'Bản vá PrintNightmare buộc Spooler thực thi mã hóa mức độ RPC Privacy (RpcAuthnLevelPrivacyEnabled = 1). Không phải mã lỗi tiêu chuẩn của WinError.h mà phát sinh do mismatch đàm phán bảo mật.',
    affectedWindows: ['Windows 10', 'Windows 11', 'Windows 7'],
    fixSteps: [
      'Khuyến nghị chuẩn: Cập nhật đầy đủ bản vá Windows trên cả máy chủ và máy trạm',
      'Nếu trong mạng Workgroup: Đặt RpcAuthnLevelPrivacyEnabled = 0 trên máy chủ',
      'Khởi động lại Spooler trên máy chủ',
      'Tuyệt đối không thực thi trên Domain Controller'
    ],
    commands: {
      cmd: `reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Print" /v RpcAuthnLevelPrivacyEnabled /t REG_DWORD /d 0 /f
net stop spooler /y & net start spooler`,
      powershell: `Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Print" -Name "RpcAuthnLevelPrivacyEnabled" -Value 0 -Type DWord
Restart-Service -Name Spooler -Force`
    },
    riskNote: 'Hạ bảo mật RPC Spooler. Tuyệt đối không chạy trên Domain Controller; chỉ dùng cho mạng văn phòng nhỏ độc lập.',
    registryChanges: [
      {
        path: 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\Print',
        key: 'RpcAuthnLevelPrivacyEnabled',
        type: 'REG_DWORD',
        value: 0,
        description: 'Tắt ép buộc RPC Privacy level để các máy trạm cũ có thể in qua máy chủ'
      }
    ],
    servicesAffected: ['Spooler']
  },
  {
    id: 'err-709',
    code: '0x00000709',
    win32Code: 'ERROR_INVALID_PRINTER_NAME (1801)',
    name: 'Không thể kết nối máy in (Lỗi 709 - Phía Máy Trạm)',
    role: 'client',
    category: 'rpc',
    isPopular: true,
    shortDesc: 'Máy trạm Win 10/11 báo lỗi 0x00000709 khi kết nối tới máy in chia sẻ qua mạng LAN.',
    rootCause: 'Xảy ra khi máy trạm kết nối tới máy in qua đường dẫn chia sẻ mạng (\\\\SERVER\\Printer). Trên Windows 11/10, Spooler mặc định từ chối RPC over Named Pipes và yêu cầu xác thực Kerberos qua IP thất bại.',
    affectedWindows: ['Windows 10', 'Windows 11'],
    fixSteps: [
      'Bật chính sách cho phép RPC over Named Pipes (RpcUseNamedPipeProtocol = 1)',
      'Tắt ép buộc Kerberos cho kết nối RPC qua mạng LAN (ForceKerberosForRpc = 0)',
      'Kích hoạt chế độ Legacy Default Printer Mode (tránh lỗi Windows tự đổi máy in)',
      'Khởi động lại Spooler và kết nối lại máy in'
    ],
    commands: {
      cmd: `reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Printers\\RPC" /v RpcUseNamedPipeProtocol /t REG_DWORD /d 1 /f
reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Printers\\RPC" /v ForceKerberosForRpc /t REG_DWORD /d 0 /f
reg add "HKCU\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Windows" /v LegacyDefaultPrinterMode /t REG_DWORD /d 1 /f
net stop spooler /y & net start spooler`,
      powershell: `$rpcKey = "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Printers\\RPC"
if (-not (Test-Path $rpcKey)) { New-Item -Path $rpcKey -Force | Out-Null }
Set-ItemProperty -Path $rpcKey -Name "RpcUseNamedPipeProtocol" -Value 1 -Type DWord
Set-ItemProperty -Path $rpcKey -Name "ForceKerberosForRpc" -Value 0 -Type DWord
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Windows" -Name "LegacyDefaultPrinterMode" -Value 1 -Type DWord -ErrorAction SilentlyContinue
Restart-Service -Name Spooler -Force`
    },
    riskNote: 'Chỉ chạy script cập nhật Registry phía máy trạm để kích hoạt RPC over Named Pipes (cổng 445).',
    registryChanges: [
      {
        path: 'HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Printers\\RPC',
        key: 'RpcUseNamedPipeProtocol',
        type: 'REG_DWORD',
        value: 1,
        description: 'Ép client kết nối in qua Named Pipes'
      },
      {
        path: 'HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Printers\\RPC',
        key: 'ForceKerberosForRpc',
        type: 'REG_DWORD',
        value: 0,
        description: 'Cho phép fallback xác thực NTLM qua mạng LAN'
      },
      {
        path: 'HKCU\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Windows',
        key: 'LegacyDefaultPrinterMode',
        type: 'REG_DWORD',
        value: 1,
        description: 'Tắt tính năng Windows tự đổi máy in mặc định gây lỗi 709'
      }
    ],
    servicesAffected: ['Spooler']
  },
  {
    id: 'err-709-server',
    code: '0x00000709',
    win32Code: 'ERROR_INVALID_PRINTER_NAME (1801)',
    name: 'Lỗi chia sẻ máy in Win 11 (Lỗi 709 - Phía Máy Chủ)',
    role: 'server',
    category: 'rpc',
    isPopular: true,
    shortDesc: 'Máy chủ Win 11 cắm máy in chặn máy con Win 10 in. Cung cấp 2 phương án: Thay 3 file DLL Spooler hoặc cấu hình Registry.',
    rootCause: 'Bản cập nhật Windows 11 thay đổi Spooler RPC listener mặc định sang RPC over TCP và chặn Named Pipes, khiến các máy con Windows 10 không thể kết nối tới máy in chia sẻ.',
    affectedWindows: ['Windows 11 22H2', 'Windows 11 23H2', 'Windows 11 24H2'],
    fixSteps: [
      'Phương án 1 (Thay 3 file DLL Spooler): Chỉ làm 1 lần trên máy chủ, tự động backup vào %ProgramData%\\PrintLANFixer\\backup_dll, máy con Win 10 in được ngay không cần chỉnh.',
      'Phương án 2 (Cập nhật Registry RpcProtocols = 7): An toàn tuyệt đối, không thay đổi bất kỳ file hệ thống của Windows. Lưu ý: Mỗi máy con Win 10 cần kết nối phải chạy script bên máy trạm.',
      'Khôi phục 3 file gốc từ thư mục backup bất cứ lúc nào.'
    ],
    commands: {
      cmd: `rem === PHUONG AN 1: THAY THE 3 FILE DLL SPOOLER TUONG THICH ===
rem 1. Tao thu muc backup va sao luu 3 file he thong goc
if not exist "%ProgramData%\\PrintLANFixer\\backup_dll" mkdir "%ProgramData%\\PrintLANFixer\\backup_dll"
copy /y "%SystemRoot%\\System32\\win32spl.dll" "%ProgramData%\\PrintLANFixer\\backup_dll\\"
copy /y "%SystemRoot%\\System32\\spoolsv.exe" "%ProgramData%\\PrintLANFixer\\backup_dll\\"
copy /y "%SystemRoot%\\System32\\localspl.dll" "%ProgramData%\\PrintLANFixer\\backup_dll\\"

rem 2. Dung Spooler va thay the file tuong thich tu thu muc files
net stop spooler /y
takeown /f "%SystemRoot%\\System32\\win32spl.dll" /a 2>nul
icacls "%SystemRoot%\\System32\\win32spl.dll" /grant Administrators:F 2>nul
takeown /f "%SystemRoot%\\System32\\spoolsv.exe" /a 2>nul
icacls "%SystemRoot%\\System32\\spoolsv.exe" /grant Administrators:F 2>nul
takeown /f "%SystemRoot%\\System32\\localspl.dll" /a 2>nul
icacls "%SystemRoot%\\System32\\localspl.dll" /grant Administrators:F 2>nul
if exist ".\\files\\win32spl.dll" copy /y ".\\files\\win32spl.dll" "%SystemRoot%\\System32\\"
if exist "%~dp0files\\win32spl.dll" copy /y "%~dp0files\\win32spl.dll" "%SystemRoot%\\System32\\"

rem 3. Khoi dong lai Print Spooler
net start spooler`,
      powershell: `# Phuong an 1: Sao luu 3 file goc va thay the file tuong thich
$backupDir = "$env:ProgramData\\PrintLANFixer\\backup_dll"
if (-not (Test-Path $backupDir)) { New-Item -Path $backupDir -ItemType Directory -Force | Out-Null }
Copy-Item "$env:SystemRoot\\System32\\win32spl.dll" "$backupDir\\win32spl.dll" -Force -ErrorAction SilentlyContinue
Copy-Item "$env:SystemRoot\\System32\\spoolsv.exe" "$backupDir\\spoolsv.exe" -Force -ErrorAction SilentlyContinue
Copy-Item "$env:SystemRoot\\System32\\localspl.dll" "$backupDir\\localspl.dll" -Force -ErrorAction SilentlyContinue
Stop-Service -Name Spooler -Force -ErrorAction SilentlyContinue
Start-Service -Name Spooler`
    },
    alternativeScripts: [
      {
        id: 'opt1-dll',
        title: 'Phương Án 1: Thay 3 File DLL Spooler (Tự động Backup)',
        note: 'Ưu điểm: Chỉ làm 1 lần trên máy chủ, tất cả máy con Win 10 in được ngay. Đường dẫn backup: %ProgramData%\\PrintLANFixer\\backup_dll',
        cmd: `rem === PHUONG AN 1: THAY THE 3 FILE DLL SPOOLER TUONG THICH ===
rem 1. Tao thu muc backup va sao luu 3 file he thong goc
if not exist "%ProgramData%\\PrintLANFixer\\backup_dll" mkdir "%ProgramData%\\PrintLANFixer\\backup_dll"
copy /y "%SystemRoot%\\System32\\win32spl.dll" "%ProgramData%\\PrintLANFixer\\backup_dll\\"
copy /y "%SystemRoot%\\System32\\spoolsv.exe" "%ProgramData%\\PrintLANFixer\\backup_dll\\"
copy /y "%SystemRoot%\\System32\\localspl.dll" "%ProgramData%\\PrintLANFixer\\backup_dll\\"

rem 2. Dung Spooler va thay the file tuong thich tu thu muc files
net stop spooler /y
takeown /f "%SystemRoot%\\System32\\win32spl.dll" /a 2>nul
icacls "%SystemRoot%\\System32\\win32spl.dll" /grant Administrators:F 2>nul
takeown /f "%SystemRoot%\\System32\\spoolsv.exe" /a 2>nul
icacls "%SystemRoot%\\System32\\spoolsv.exe" /grant Administrators:F 2>nul
takeown /f "%SystemRoot%\\System32\\localspl.dll" /a 2>nul
icacls "%SystemRoot%\\System32\\localspl.dll" /grant Administrators:F 2>nul
if exist ".\\files\\win32spl.dll" copy /y ".\\files\\win32spl.dll" "%SystemRoot%\\System32\\"
if exist "%~dp0files\\win32spl.dll" copy /y "%~dp0files\\win32spl.dll" "%SystemRoot%\\System32\\"

rem 3. Khoi dong lai Print Spooler
net start spooler`,
        powershell: `# 1. Sao luu 3 file goc
$backupDir = "$env:ProgramData\\PrintLANFixer\\backup_dll"
if (-not (Test-Path $backupDir)) { New-Item -Path $backupDir -ItemType Directory -Force | Out-Null }
Copy-Item "$env:SystemRoot\\System32\\win32spl.dll" "$backupDir\\win32spl.dll" -Force -ErrorAction SilentlyContinue
Copy-Item "$env:SystemRoot\\System32\\spoolsv.exe" "$backupDir\\spoolsv.exe" -Force -ErrorAction SilentlyContinue
Copy-Item "$env:SystemRoot\\System32\\localspl.dll" "$backupDir\\localspl.dll" -Force -ErrorAction SilentlyContinue

# 2. Dung Spooler va khoi dong lai
Stop-Service -Name Spooler -Force -ErrorAction SilentlyContinue
Start-Service -Name Spooler`
      },
      {
        id: 'opt2-reg',
        title: 'Phương Án 2: Cập Nhật Registry Server (RpcProtocols = 7)',
        note: 'Ưu điểm: An toàn tuyệt đối, không thay đổi bất kỳ file hệ thống của Windows. Lưu ý: Mỗi máy con Win 10 cần kết nối phải chạy script bên máy trạm.',
        cmd: `rem === PHUONG AN 2: CAP NHAT REGISTRY MAY CHU (RpcProtocols = 7) ===
rem Luu y: Moi may con Win 10 can ket noi phai chay script ben may tram
reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Printers\\RPC" /v RpcProtocols /t REG_DWORD /d 7 /f
net stop spooler /y & net start spooler`,
        powershell: `# Luu y: Moi may con Win 10 can ket noi phai chay script ben may tram
$rpcKey = "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Printers\\RPC"
if (-not (Test-Path $rpcKey)) { New-Item -Path $rpcKey -Force | Out-Null }
Set-ItemProperty -Path $rpcKey -Name "RpcProtocols" -Value 7 -Type DWord
Restart-Service -Name Spooler -Force`
      },
      {
        id: 'opt-restore',
        title: 'Khôi Phục 3 File Gốc Từ Thư Mục Backup',
        note: 'Khôi phục lại toàn bộ 3 file hệ thống gốc từ %ProgramData%\\PrintLANFixer\\backup_dll',
        cmd: `rem === KHOI PHUC 3 FILE GOC TU BACKUP ===
net stop spooler /y
copy /y "%ProgramData%\\PrintLANFixer\\backup_dll\\*.*" "%SystemRoot%\\System32\\"
net start spooler`,
        powershell: `Stop-Service -Name Spooler -Force -ErrorAction SilentlyContinue
Copy-Item "$env:ProgramData\\PrintLANFixer\\backup_dll\\*.*" "$env:SystemRoot\\System32\\" -Force -ErrorAction SilentlyContinue
Start-Service -Name Spooler`
      }
    ],
    riskNote: 'Phương án 1 thay file hệ thống Spooler (đã tự động backup). Phương án 2 an toàn tuyệt đối nhưng cần chạy script bên máy trạm.',
    registryChanges: [
      {
        path: 'HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Printers\\RPC',
        key: 'RpcProtocols',
        type: 'REG_DWORD',
        value: 7,
        description: 'Mở cả giao thức kết nối TCP và Named Pipes trên máy chủ'
      }
    ],
    servicesAffected: ['Spooler']
  },

  {
    id: 'err-07c',
    code: '0x0000007c',
    win32Code: 'ERROR_INVALID_LEVEL (124)',
    name: 'Không thỏa hiệp cấu trúc RPC Spooler (Level 124)',
    role: 'client',
    category: 'rpc',
    isPopular: true,
    shortDesc: 'Lỗi thường gặp khi kết nối từ máy trạm Win 10/11 đến máy chủ sau các đợt update Windows.',
    rootCause: 'Spooler giữa hai máy không đồng bộ cấu trúc DRIVER_INFO_x khi gửi qua RPC hoặc thiếu thư viện mscms.dll.',
    affectedWindows: ['Windows 10', 'Windows 11'],
    fixSteps: [
      'Cấu hình đồng bộ RPC over Named Pipes trên máy trạm',
      'Đặt ForceKerberosForRpc = 0 cho phép NTLM fallback',
      'Chép bổ sung mscms.dll vào spool driver',
      'Restart Print Spooler'
    ],
    commands: {
      cmd: `reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Printers\\RPC" /v RpcUseNamedPipeProtocol /t REG_DWORD /d 1 /f
net stop spooler /y
if not exist "%SystemRoot%\\System32\\spool\\drivers\\x64\\3" mkdir "%SystemRoot%\\System32\\spool\\drivers\\x64\\3"
copy /y "%SystemRoot%\\System32\\mscms.dll" "%SystemRoot%\\System32\\spool\\drivers\\x64\\3\\mscms.dll"
net start spooler`,
      powershell: `Stop-Service -Name Spooler -Force -ErrorAction SilentlyContinue
$rpcKey = "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Printers\\RPC"
if (-not (Test-Path $rpcKey)) { New-Item -Path $rpcKey -Force | Out-Null }
Set-ItemProperty -Path $rpcKey -Name "RpcUseNamedPipeProtocol" -Value 1 -Type DWord
$dest = "$env:SystemRoot\\System32\\spool\\drivers\\x64\\3"
if (-not (Test-Path $dest)) { New-Item -Path $dest -ItemType Directory -Force | Out-Null }
Copy-Item "$env:SystemRoot\\System32\\mscms.dll" "$dest\\mscms.dll" -Force -ErrorAction SilentlyContinue
Start-Service -Name Spooler`
    }
  },
  {
    id: 'err-6ba',
    code: '0x000006ba',
    win32Code: 'RPC_S_SERVER_UNAVAILABLE (1722)',
    name: 'Dịch vụ RPC Server không khả dụng',
    role: 'both',
    category: 'rpc',
    isPopular: true,
    shortDesc: 'Báo lỗi "The RPC server is unavailable" khi thêm máy in hoặc gửi lệnh in.',
    rootCause: 'Dịch vụ Print Spooler hoặc RPC Endpoint Mapper bị tắt, hoặc Firewall máy chủ chặn các cổng kết nối RPC (Port 135) và SMB (Port 445).',
    affectedWindows: ['Windows 7', 'Windows 10', 'Windows 11'],
    fixSteps: [
      'Khởi động lại các dịch vụ cốt lõi: Spooler, RpcSs, RpcEptMapper',
      'Mở Windows Firewall cho nhóm File and Printer Sharing',
      'Kiểm tra thông mạng giữa 2 máy'
    ],
    commands: {
      cmd: `sc config spooler start= auto & net start spooler
net start RpcSs 2>nul
net start RpcEptMapper 2>nul
netsh advfirewall firewall set rule group="File and Printer Sharing" new enable=Yes 2>nul
netsh advfirewall firewall set rule group="@FirewallAPI.dll,-28502" new enable=Yes 2>nul`,
      powershell: `Start-Service -Name Spooler, RpcSs, RpcEptMapper -ErrorAction SilentlyContinue
Enable-NetFirewallRule -Group "@FirewallAPI.dll,-28502" -Profile Domain,Private -ErrorAction SilentlyContinue`
    },
    servicesAffected: ['Spooler', 'RpcSs', 'RpcEptMapper']
  },
  {
    id: 'err-6d9',
    code: '0x000006d9',
    win32Code: 'EPT_S_NOT_REGISTERED (1753)',
    name: 'Không có Endpoint - Do tắt Windows Firewall',
    role: 'both',
    category: 'security',
    isPopular: true,
    shortDesc: 'Thông báo "There are no more endpoints available from the endpoint mapper".',
    rootCause: 'Dịch vụ Windows Defender Firewall (MpsSvc) bị tắt hoàn toàn. Windows Spooler bắt buộc dịch vụ Firewall phải chạy để khởi tạo RPC Endpoint Mapper cho chia sẻ máy in.',
    affectedWindows: ['Windows 10', 'Windows 11'],
    fixSteps: [
      'Bật lại dịch vụ Windows Defender Firewall (MpsSvc) sang chế độ Automatic',
      'Mở quyền File and Printer Sharing trong Firewall',
      'Khởi động lại Spooler'
    ],
    commands: {
      cmd: `sc config BFE start= auto & net start BFE 2>nul
sc config MpsSvc start= auto & net start MpsSvc 2>nul
netsh advfirewall firewall set rule group="File and Printer Sharing" new enable=Yes 2>nul
netsh advfirewall firewall set rule group="@FirewallAPI.dll,-28502" new enable=Yes 2>nul
net stop spooler /y & net start spooler`,
      powershell: `Set-Service -Name BFE, MpsSvc -StartupType Automatic -ErrorAction SilentlyContinue
Start-Service -Name BFE, MpsSvc -ErrorAction SilentlyContinue
Enable-NetFirewallRule -Group "@FirewallAPI.dll,-28502" -ErrorAction SilentlyContinue
Restart-Service -Name Spooler -Force`
    },
    servicesAffected: ['MpsSvc', 'Spooler']
  },
  {
    id: 'err-6be',
    code: '0x000006be',
    win32Code: 'RPC_S_CALL_FAILED (1726)',
    name: 'Cuộc gọi RPC thất bại (Spooler Crash)',
    role: 'both',
    category: 'spooler',
    shortDesc: 'Đang kết nối thì bị ngắt kết nối đột ngột với mã lỗi 0x000006be.',
    rootCause: 'Dịch vụ Print Spooler (spoolsv.exe) trên máy chủ bị sập (crash) đột ngột do gặp file in lỗi hoặc driver bị dump bộ nhớ.',
    affectedWindows: ['Windows 10', 'Windows 11'],
    fixSteps: [
      'Kill tiến trình spoolsv.exe đang treo',
      'Dọn sạch toàn bộ file rác kẹt trong thư mục Spool Printers',
      'Khởi động lại Spooler'
    ],
    commands: {
      cmd: `net stop spooler /y
timeout /t 3 /nobreak >nul
taskkill /f /im spoolsv.exe 2>nul
del /q /f "%SystemRoot%\\System32\\spool\\PRINTERS\\*.*" 2>nul
net start spooler`,
      powershell: `$spooler = Get-Service -Name Spooler -ErrorAction SilentlyContinue
if ($spooler -and $spooler.Status -ne 'Stopped') {
    Stop-Service -Name Spooler -Force -ErrorAction SilentlyContinue
    $timeout = 15
    while ($timeout -gt 0 -and (Get-Service -Name Spooler).Status -ne 'Stopped') {
        Start-Sleep -Seconds 1
        $timeout--
    }
    if ((Get-Service -Name Spooler).Status -ne 'Stopped') {
        Stop-Process -Name spoolsv -Force -ErrorAction SilentlyContinue
    }
}
Remove-Item "$env:SystemRoot\\System32\\spool\\PRINTERS\\*.*" -Force -Recurse -ErrorAction SilentlyContinue
Start-Service -Name Spooler`
    },
    servicesAffected: ['Spooler']
  },

  // ==========================================
  // NHÓM MẠNG LAN, SMB & XÁC THỰC QUYỀN TRUY CẬP
  // ==========================================
  {
    id: 'err-4005',
    code: '0x80004005',
    win32Code: 'E_FAIL (Unspecified failure)',
    name: 'Lỗi không xác định (E_FAIL / 0x80004005)',
    role: 'client',
    category: 'point_and_print',
    isPopular: true,
    shortDesc: 'Thông báo: Unspecified error (E_FAIL) khi kết nối máy in mạng LAN.',
    rootCause: '0x80004005 là mã HRESULT chung trong WinError.h. Không thể gán cứng cho một nguyên nhân duy nhất; thường xuất phát từ lỗi mạng SMB, sai credential hoặc chính sách Point & Print chặn tải driver.',
    affectedWindows: ['Windows 10', 'Windows 11', 'Windows 11 24H2'],
    fixSteps: [
      'Chẩn đoán: Kiểm tra kết nối mạng SMB (Port 445) tới máy chủ',
      'Trên Win 11 24H2: Tắt bắt buộc ký số SMB (RequireSecuritySignature = 0) nếu máy chủ cũ không hỗ trợ',
      'Kiểm tra và lưu thông tin đăng nhập vào Windows Credential',
      'Nếu do quyền nạp driver: Cài driver WHQL cục bộ trước bằng quyền Admin'
    ],
    commands: {
      cmd: `reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\LanmanWorkstation\\Parameters" /v RequireSecuritySignature /t REG_DWORD /d 0 /f
reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\LanmanWorkstation\\Parameters" /v AllowInsecureGuestAuth /t REG_DWORD /d 1 /f
cmdkey /list`,
      powershell: `Set-SmbClientConfiguration -RequireSecuritySignature $false -Force -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\LanmanWorkstation\\Parameters" -Name "AllowInsecureGuestAuth" -Value 1 -Type DWord -ErrorAction SilentlyContinue
cmdkey /list`
    }
  },
  {
    id: 'err-005',
    code: '0x00000005',
    win32Code: 'ERROR_ACCESS_DENIED (5)',
    name: 'Access is denied (Bị từ chối truy cập)',
    role: 'client',
    category: 'security',
    isPopular: true,
    shortDesc: 'Không có quyền kết nối hoặc nạp driver từ máy in chia sẻ.',
    rootCause: 'Tài khoản kết nối từ máy trạm không có quyền "Print" trong Printer Properties > Security của máy chủ, hoặc máy trạm chưa xác thực SMB.',
    affectedWindows: ['Windows 10', 'Windows 11'],
    fixSteps: [
      'Trên máy chủ: Cấp quyền Print cho tài khoản Everyone / Guest',
      'Trên máy trạm: Kiểm tra danh sách Network Credential',
      'Lưu tài khoản và mật khẩu máy chủ vào Windows Credential Manager'
    ],
    commands: {
      cmd: `cmdkey /list
control /name Microsoft.CredentialManager`,
      powershell: `Get-SmbConnection -ErrorAction SilentlyContinue
cmdkey /list`
    }
  },
  {
    id: 'err-52e',
    code: '0x0000052e',
    win32Code: 'ERROR_LOGON_FAILURE (1326)',
    name: 'Sai tài khoản hoặc mật khẩu máy chủ',
    role: 'client',
    category: 'security',
    isPopular: true,
    shortDesc: 'Thông báo: Logon failure: unknown user name or bad password.',
    rootCause: 'Máy trạm gửi thông tin đăng nhập sai hoặc máy chủ bật Password Protected Sharing mà máy trạm chưa lưu tài khoản (kèm SMB Signing chặn Guest trên Win 11 24H2).',
    affectedWindows: ['Windows 7', 'Windows 10', 'Windows 11'],
    fixSteps: [
      'Phương án A (An toàn): Tạo tài khoản có mật khẩu trên Server và lưu vào Windows Credential',
      'Phương án B (Workgroup): Bật AllowInsecureGuestAuth = 1 và tắt RequireSecuritySignature = 0',
      'Nếu Server là Win 11 24H2: Chạy Set-SmbServerConfiguration -RequireSecuritySignature $false trên Server'
    ],
    commands: {
      cmd: `reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\LanmanWorkstation\\Parameters" /v AllowInsecureGuestAuth /t REG_DWORD /d 1 /f
reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\LanmanWorkstation\\Parameters" /v RequireSecuritySignature /t REG_DWORD /d 0 /f
cmdkey /list`,
      powershell: `Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\LanmanWorkstation\\Parameters" -Name "AllowInsecureGuestAuth" -Value 1 -Type DWord
Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\LanmanWorkstation\\Parameters" -Name "RequireSecuritySignature" -Value 0 -Type DWord`
    }
  },
  {
    id: 'err-35',
    code: '0x80070035',
    win32Code: 'ERROR_BAD_NETPATH (53)',
    name: 'Không tìm thấy đường dẫn mạng',
    role: 'client',
    category: 'network',
    isPopular: true,
    shortDesc: 'Thông báo: The network path was not found khi vào \\\\MAYCHU.',
    rootCause: 'Máy trạm và máy chủ không thông mạng LAN, hoặc tắt Network Discovery, hoặc dịch vụ LanmanWorkstation/LanmanServer bị dừng.',
    affectedWindows: ['Windows 10', 'Windows 11'],
    fixSteps: [
      'Bật dịch vụ LanmanWorkstation trên máy trạm',
      'Bật Network Discovery trong tường lửa đa ngôn ngữ',
      'Khởi động các dịch vụ dò tìm mạng: fdPHost, FDResPub, SSDPSRV',
      'Dùng địa chỉ IP thay vì tên máy tính'
    ],
    commands: {
      cmd: `sc config LanmanWorkstation start= auto & net start LanmanWorkstation
for %%s in (fdPHost FDResPub SSDPSRV) do (sc config %%s start= auto & net start %%s 2>nul)
netsh advfirewall firewall set rule group="Network Discovery" new enable=Yes 2>nul
netsh advfirewall firewall set rule group="@FirewallAPI.dll,-32752" new enable=Yes 2>nul`,
      powershell: `Start-Service -Name LanmanWorkstation, fdPHost, FDResPub, SSDPSRV -ErrorAction SilentlyContinue
Enable-NetFirewallRule -Group "@FirewallAPI.dll,-32752" -ErrorAction SilentlyContinue`
    },
    servicesAffected: ['LanmanWorkstation', 'fdPHost', 'FDResPub', 'SSDPSRV']
  },
  {
    id: 'err-040',
    code: '0x00000040',
    win32Code: 'ERROR_NETNAME_DELETED (64)',
    name: 'Tên mạng không còn khả dụng (Mất kết nối SMB)',
    role: 'both',
    category: 'network',
    shortDesc: 'The specified network name is no longer available.',
    rootCause: 'Kết nối mạng bị đứt giữa chừng, máy chủ sleep, hoặc cấu hình SMB Dialect không tương thích.',
    affectedWindows: ['Windows 10', 'Windows 11'],
    fixSteps: [
      'Tắt chế độ Sleep trên máy chủ chia sẻ máy in',
      'Mở đầy đủ rule tường lửa cho File and Printer Sharing',
      'Tắt các tính năng ngắt nguồn mạng gây rớt gói (giữ lại Wake-on-LAN)',
      'Restart Print Spooler'
    ],
    commands: {
      cmd: `powercfg /change standby-timeout-ac 0
netsh advfirewall firewall set rule group="@FirewallAPI.dll,-28502" new enable=Yes 2>nul
net stop spooler /y & net start spooler`,
      powershell: `powercfg /change standby-timeout-ac 0
Get-NetAdapter | Disable-NetAdapterPowerManagement -ArpOffload -NSOffload -D0PacketCoalescing -NoRestart -ErrorAction SilentlyContinue
Enable-NetFirewallRule -Group "@FirewallAPI.dll,-28502" -ErrorAction SilentlyContinue
Restart-Service -Name Spooler -Force`
    }
  },
  {
    id: 'err-3e3',
    code: '0x000003e3',
    win32Code: 'ERROR_OPERATION_ABORTED (995)',
    name: 'Tiến trình lọc in bị hủy (Operation Aborted)',
    role: 'client',
    category: 'driver',
    shortDesc: 'Thông báo: The I/O operation has been aborted because of either a thread exit or an application request.',
    rootCause: 'Tiến trình printfilterpipelinesvc.exe bị hủy đột ngột do xung đột driver V4 / IPP Class Driver hoặc kết nối máy in trong HKCU\\Printers\\Connections bị hỏng.',
    affectedWindows: ['Windows 10', 'Windows 11'],
    fixSteps: [
      'Dừng Print Spooler và tắt tiến trình printfilterpipelinesvc.exe',
      'Khởi động lại Spooler và kiểm tra driver V3 thay cho V4'
    ],
    commands: {
      cmd: `taskkill /f /im printfilterpipelinesvc.exe 2>nul & net stop spooler /y & net start spooler`,
      powershell: `Stop-Process -Name printfilterpipelinesvc -Force -ErrorAction SilentlyContinue
Restart-Service -Name Spooler -Force`
    }
  },

  // ==========================================
  // NHÓM LỖI DRIVER, CỔNG & PHẦN CỨNG ĐẶC THÙ
  // ==========================================
  {
    id: 'err-07e',
    code: '0x0000007e',
    win32Code: 'ERROR_MOD_NOT_FOUND (126)',
    name: 'Thiếu DLL phụ thuộc của driver máy in',
    role: 'client',
    category: 'driver',
    isPopular: true,
    shortDesc: 'Thông báo: The specified module could not be found (ERROR_MOD_NOT_FOUND).',
    rootCause: 'Spooler gọi LoadLibraryExW nạp driver nhưng thất bại do thiếu một DLL phụ thuộc bất kỳ trong Driver Store hoặc đường dẫn hệ thống. Không mặc định là thiếu mscms.dll.',
    affectedWindows: ['Windows 10', 'Windows 11'],
    fixSteps: [
      'Chẩn đoán: Mở Print Management kiểm tra danh sách file phụ thuộc của Driver',
      'Tải và cài đặt lại gói driver WHQL chính thức đầy đủ từ nhà sản xuất',
      'Chạy dism và sfc quét khôi phục các thư viện hệ thống Windows bị thiếu'
    ],
    commands: {
      cmd: `rundll32 printui.dll,PrintUIEntry /s /t2
pnputil /enum-drivers`,
      powershell: `Get-PrinterDriver | Select-Object Name, MajorVersion, DriverPath, InfPath
sfc /verifyonly`
    }
  },
  {
    id: 'err-057',
    code: '0x00000057',
    win32Code: 'ERROR_INVALID_PARAMETER (87)',
    name: 'Tham số API không hợp lệ (Invalid Parameter)',
    role: 'both',
    category: 'driver',
    shortDesc: 'The parameter is incorrect (87) khi gọi API cài đặt hoặc cấu hình máy in.',
    rootCause: 'Tham số truyền vào hàm Spooler API không hợp lệ (sai cấu hình DevMode, tên cổng không khớp hoặc khổ giấy sai). Không mặc định là do lệch kiến trúc CPU.',
    affectedWindows: ['Windows 7', 'Windows 10', 'Windows 11'],
    fixSteps: [
      'Kiểm tra lại cấu hình cổng in và tên chia sẻ trong Printer Properties',
      'Nếu chia sẻ máy in đa nền tảng: Cài Additional Drivers trên máy chủ',
      'Cài lại driver tương thích đúng phiên bản hệ điều hành'
    ],
    commands: {
      cmd: `rundll32 printui.dll,PrintUIEntry /s /t2`,
      powershell: `Get-Printer | Select-Object Name, PortName, DriverName, Shared`
    }
  },
  {
    id: 'err-704',
    code: '0x00000704',
    win32Code: 'ERROR_UNKNOWN_PORT (1796)',
    name: 'Cổng máy in không xác định (Unknown Port)',
    role: 'both',
    category: 'driver',
    shortDesc: 'The specified port is unknown (1796) khi cấu hình hoặc gửi lệnh in.',
    rootCause: 'Tên cổng gán cho máy in không tồn tại trong danh sách Ports của Spooler hoặc máy in mạng bị đổi IP khiến kết nối cổng cũ bị mất.',
    affectedWindows: ['Windows 10', 'Windows 11'],
    fixSteps: [
      'Kiểm tra cổng hiện tại của máy in qua Get-Printer',
      'Tạo lại cổng IP mới hoặc gán lại máy in về đúng tên cổng hợp lệ qua Set-Printer',
      'Khởi động lại dịch vụ Print Spooler'
    ],
    commands: {
      cmd: `cscript %windir%\\System32\\Printing_Admin_Scripts\\en-US\\prnport.vbs -l 2>nul || powershell Get-PrinterPort`,
      powershell: `Get-PrinterPort | Select-Object Name, Description, PrinterHostAddress, PortNumber
Get-Printer | Select-Object Name, PortName`
    }
  },
  {
    id: 'err-bbb',
    code: '0x00000bbb',
    win32Code: 'ERROR_SPL_NO_STARTDOC (3003)',
    name: 'Lỗi luồng in chưa khởi tạo StartDocPrinter',
    role: 'both',
    category: 'driver',
    shortDesc: 'Hàm WritePrinter được gọi khi chưa có tài liệu in nào được mở thành công qua StartDocPrinter.',
    rootCause: 'Lỗi xảy ra ở tầng ứng dụng hoặc print rendering filter pipeline khi truyền dữ liệu in vào Spooler. Đây không phải lỗi cấu hình cổng TCP/IP mồ côi.',
    affectedWindows: ['Windows 10', 'Windows 11'],
    fixSteps: [
      'Khởi động lại Print Spooler và ứng dụng gửi lệnh in',
      'Dọn sạch các lệnh in kẹt dở dang trong thư mục spool\\PRINTERS',
      'Kiểm tra và đổi sang driver chuẩn PCL6 / Universal nếu lỗi tái diễn'
    ],
    commands: {
      cmd: `net stop spooler /y
del /q /f "%SystemRoot%\\System32\\spool\\PRINTERS\\*.*" 2>nul
net start spooler`,
      powershell: `Stop-Service -Name Spooler -Force -ErrorAction SilentlyContinue
Remove-Item "$env:SystemRoot\\System32\\spool\\PRINTERS\\*.*" -Force -ErrorAction SilentlyContinue
Start-Service -Name Spooler`
    }
  }
];
