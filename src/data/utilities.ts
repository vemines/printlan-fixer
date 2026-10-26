import { UtilityItem } from '../types/printer';

export const UTILITIES: UtilityItem[] = [
  // 1. Restart Print Spooler & Flush Stuck Queue
  {
    id: 'util-restart-spooler',
    title: 'Restart & Clean Print Spooler',
    group: 'spooler',
    description: 'Safely stop Spooler and dependent services, purge stuck print jobs (.SPL/.SHD) in the PRINTERS directory, and restart the service.',
    iconName: 'RefreshCw',
    steps: [
      { title: 'Stop Print Spooler service with timeout monitoring', action: 'Stop-Service Spooler -Force' },
      { title: 'Force terminate hanging spoolsv process if stuck', action: 'taskkill /f /im spoolsv.exe' },
      { title: 'Delete corrupted print spool files in PRINTERS folder', action: 'del /q /f "%SystemRoot%\\System32\\spool\\PRINTERS\\*.*"' },
      { title: 'Start Print Spooler service', action: 'Start-Service Spooler' }
    ],
    commands: {
      cmd: `net stop spooler /y
timeout /t 2 /nobreak >nul
taskkill /f /im spoolsv.exe 2>nul
del /q /f "%SystemRoot%\\System32\\spool\\PRINTERS\\*.*" 2>nul
net start spooler
sc query spooler`,
      powershell: `Stop-Service -Name Spooler -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
Stop-Process -Name spoolsv -Force -ErrorAction SilentlyContinue
Remove-Item "$env:SystemRoot\\System32\\spool\\PRINTERS\\*.*" -Force -ErrorAction SilentlyContinue
Start-Service -Name Spooler -ErrorAction SilentlyContinue
Get-Service Spooler | Select-Object Name, Status`
    }
  },

  // 2. Open Windows Credential Manager
  {
    id: 'util-credential-manager',
    title: 'Open Windows Credential Manager',
    group: 'shortcuts',
    description: 'View, add, or delete network credentials saved in Windows Credential Manager for connecting to shared LAN printers.',
    iconName: 'Key',
    steps: [
      { title: 'List currently stored credentials', action: 'cmdkey /list' },
      { title: 'Open Windows Credential Manager GUI', action: 'control /name Microsoft.CredentialManager' }
    ],
    commands: {
      cmd: `control /name Microsoft.CredentialManager`,
      powershell: `Start-Process "control.exe" -ArgumentList "/name Microsoft.CredentialManager"`
    }
  },

  // 3. Open Devices and Printers
  {
    id: 'util-open-devices-printers',
    title: 'Open Devices and Printers',
    group: 'shortcuts',
    description: 'Open the Devices and Printers window in Control Panel on Windows 10/11.',
    iconName: 'Printer',
    steps: [
      { title: 'Open Devices and Printers', action: 'explorer.exe shell:::{A8A91A66-3A7D-4424-8D24-04E180695C7A}' }
    ],
    commands: {
      cmd: `explorer.exe shell:::{A8A91A66-3A7D-4424-8D24-04E180695C7A}`,
      powershell: `Start-Process "explorer.exe" -ArgumentList "shell:::{A8A91A66-3A7D-4424-8D24-04E180695C7A}"`
    }
  },

  // 4. Open Print Management Console & Settings
  {
    id: 'util-open-print-mgmt',
    title: 'Open Print Management Console',
    group: 'shortcuts',
    description: 'Directly launch Windows standard management consoles: Print Management Console (or Print Server Properties on Windows Home) and Printers Settings.',
    iconName: 'Sliders',
    steps: [
      { title: 'Open Print Management or Print Server Properties', action: 'printmanagement.msc' },
      { title: 'Open Printers & Scanners in Windows Settings', action: 'ms-settings:printers' }
    ],
    commands: {
      cmd: `start printmanagement.msc 2>nul || rundll32.exe printui.dll,PrintUIEntry /s /t2
start ms-settings:printers`,
      powershell: `if (Get-Command printmanagement.msc -ErrorAction SilentlyContinue) {
    Start-Process "printmanagement.msc"
} else {
    Start-Process "rundll32.exe" -ArgumentList "printui.dll,PrintUIEntry /s /t2"
}
Start-Process "ms-settings:printers"`
    }
  },

  // 5. Enable Firewall File and Printer Sharing
  {
    id: 'util-enable-firewall-sharing',
    title: 'Enable Firewall File & Printer Sharing',
    group: 'network',
    description: 'Open TCP ports 135/445 and enable File and Printer Sharing and Network Discovery rules on Private/Domain firewall profiles.',
    iconName: 'ShieldCheck',
    steps: [
      { title: 'Enable File and Printer Sharing rules in Windows Firewall', action: 'netsh advfirewall ... File and Printer Sharing' },
      { title: 'Enable Network Discovery and start discovery services', action: 'sc start fdPHost, FDResPub, SSDPSRV' }
    ],
    commands: {
      cmd: `netsh advfirewall firewall set rule group="File and Printer Sharing" new enable=Yes 2>nul
netsh advfirewall firewall set rule group="@FirewallAPI.dll,-28502" new enable=Yes 2>nul
netsh advfirewall firewall set rule group="Network Discovery" new enable=Yes 2>nul
netsh advfirewall firewall set rule group="@FirewallAPI.dll,-32752" new enable=Yes 2>nul
for %%s in (fdPHost FDResPub SSDPSRV) do (sc config %%s start= auto & net start %%s 2>nul)`,
      powershell: `Enable-NetFirewallRule -Group "@FirewallAPI.dll,-28502", "@FirewallAPI.dll,-32752" -Profile Domain,Private -ErrorAction SilentlyContinue
Start-Service -Name fdPHost, FDResPub, SSDPSRV -ErrorAction SilentlyContinue`
    }
  },

  // 6. Toggle Windows Protected Print Mode (WPP Win 11 24H2)
  {
    id: 'util-wpp-toggle',
    title: 'Toggle Windows Protected Print (WPP)',
    group: 'win11',
    description: 'Disable Windows Protected Print mode on Windows 11 24H2 to allow installing and sharing legacy third-party printer drivers (V3/V4).',
    iconName: 'ShieldAlert',
    steps: [
      { title: 'Remove Registry policy enforcing WPP', action: 'reg delete HKLM\\...\\Printers\\WPP' },
      { title: 'Restart Print Spooler service', action: 'Restart-Service Spooler' },
      { title: 'Open Printers Settings to verify', action: 'start ms-settings:printers' }
    ],
    commands: {
      cmd: `reg delete "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Printers\\WPP" /v EnabledBy /f 2>nul
reg delete "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Printers\\WPP" /v WindowsProtectedPrintGroupPolicyState /f 2>nul
reg delete "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Printers\\WPP" /v WindowsProtectedPrintMode /f 2>nul
net stop spooler /y & net start spooler
start ms-settings:printers`,
      powershell: `$wppKey = "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Printers\\WPP"
if (Test-Path $wppKey) {
    Remove-ItemProperty -Path $wppKey -Name "EnabledBy", "WindowsProtectedPrintGroupPolicyState", "WindowsProtectedPrintMode" -ErrorAction SilentlyContinue
}
Restart-Service -Name Spooler -Force
Start-Process "ms-settings:printers"`
    }
  },

  // 7. Fix Canon LBP 2900 / 3300 Communication Error
  {
    id: 'util-fix-canon-2900',
    title: 'Fix Canon LBP 2900 / 3300 Comm Error',
    group: 'drivers',
    description: 'Resolve Communication Error on Canon 2900/3300: terminate hanging Canon Language Monitor processes (CNAB4SWK / captmon), clear print queue, and restart Spooler.',
    iconName: 'Printer',
    steps: [
      { title: 'Stop Spooler & kill hanging Canon Monitor processes', action: 'taskkill /f /im CNAB4SWK.EXE /im captmon.exe' },
      { title: 'Clear corrupted print jobs in Spool PRINTERS directory', action: 'del /q /f "%SystemRoot%\\System32\\spool\\PRINTERS\\*.*"' },
      { title: 'Restart Print Spooler service', action: 'net start spooler' }
    ],
    commands: {
      cmd: `net stop spooler /y
taskkill /f /im CNAB4SWK.EXE /im captmon.exe 2>nul
del /q /f "%SystemRoot%\\System32\\spool\\PRINTERS\\*.*" 2>nul
net start spooler`,
      powershell: `Stop-Service -Name Spooler -Force -ErrorAction SilentlyContinue
Stop-Process -Name CNAB4SWK, captmon -Force -ErrorAction SilentlyContinue
Remove-Item "$env:SystemRoot\\System32\\spool\\PRINTERS\\*.*" -Force -ErrorAction SilentlyContinue
Start-Service -Name Spooler`
    }
  }
];
