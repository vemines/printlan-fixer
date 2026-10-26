use serde::{Deserialize, Serialize};
use std::process::Command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[derive(Debug, Serialize, Deserialize)]
pub struct ExecutionOutput {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
}

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[tauri::command]
fn execute_command(command: String, is_powershell: bool) -> Result<ExecutionOutput, String> {
    let mut cmd = if is_powershell {
        let mut c = Command::new("powershell");
        c.args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", &command]);
        c
    } else {
        let mut c = Command::new("cmd");
        c.args(["/C", &command]);
        c
    };

    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    match cmd.output() {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            let exit_code = output.status.code().unwrap_or(-1);
            let success = output.status.success();

            Ok(ExecutionOutput {
                success,
                stdout,
                stderr,
                exit_code,
            })
        }
        Err(err) => Err(format!("Lỗi khởi chạy tiến trình: {}", err)),
    }
}

const WIN32SPL_BYTES: &[u8] = include_bytes!("../resources/Spooler64/win32spl.dll");
const LOCALSPL_BYTES: &[u8] = include_bytes!("../resources/Spooler64/localspl.dll");
const SPOOLSV_BYTES: &[u8] = include_bytes!("../resources/Spooler64/spoolsv.exe");

#[tauri::command]
fn apply_709_server_option(option_id: String) -> Result<ExecutionOutput, String> {
    let batch_script = match option_id.as_str() {
        "replace_dll" => {
            // Trích xuất 3 file từ binary ra ổ đĩa trước khi copy vào System32
            let spooler_dir = std::path::PathBuf::from(r"C:\ProgramData\PrintLANFixer\Spooler64");
            if let Err(e) = std::fs::create_dir_all(&spooler_dir) {
                return Err(format!("Không thể tạo thư mục lưu Spooler64: {}", e));
            }
            if let Err(e) = std::fs::write(spooler_dir.join("win32spl.dll"), WIN32SPL_BYTES) {
                return Err(format!("Lỗi trích xuất win32spl.dll: {}", e));
            }
            if let Err(e) = std::fs::write(spooler_dir.join("localspl.dll"), LOCALSPL_BYTES) {
                return Err(format!("Lỗi trích xuất localspl.dll: {}", e));
            }
            if let Err(e) = std::fs::write(spooler_dir.join("spoolsv.exe"), SPOOLSV_BYTES) {
                return Err(format!("Lỗi trích xuất spoolsv.exe: {}", e));
            }

            r#"
            @echo off
            if not exist "%ProgramData%\PrintLANFixer\backup_dll" mkdir "%ProgramData%\PrintLANFixer\backup_dll"
            copy /y "%SystemRoot%\System32\win32spl.dll" "%ProgramData%\PrintLANFixer\backup_dll\" >nul 2>&1
            copy /y "%SystemRoot%\System32\spoolsv.exe" "%ProgramData%\PrintLANFixer\backup_dll\" >nul 2>&1
            copy /y "%SystemRoot%\System32\localspl.dll" "%ProgramData%\PrintLANFixer\backup_dll\" >nul 2>&1

            net stop spooler /y >nul 2>&1

            takeown /A /F "%SystemRoot%\System32\win32spl.dll" >nul 2>&1
            icacls "%SystemRoot%\System32\win32spl.dll" /grant Administrators:F /grant SYSTEM:F >nul 2>&1

            takeown /A /F "%SystemRoot%\System32\localspl.dll" >nul 2>&1
            icacls "%SystemRoot%\System32\localspl.dll" /grant Administrators:F /grant SYSTEM:F >nul 2>&1

            takeown /A /F "%SystemRoot%\System32\spoolsv.exe" >nul 2>&1
            icacls "%SystemRoot%\System32\spoolsv.exe" /grant Administrators:F /grant SYSTEM:F >nul 2>&1

            copy /y "%ProgramData%\PrintLANFixer\Spooler64\win32spl.dll" "%SystemRoot%\System32\" >nul 2>&1
            copy /y "%ProgramData%\PrintLANFixer\Spooler64\localspl.dll" "%SystemRoot%\System32\" >nul 2>&1
            copy /y "%ProgramData%\PrintLANFixer\Spooler64\spoolsv.exe" "%SystemRoot%\System32\" >nul 2>&1

            reg add "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Print" /v RpcAuthnLevelPrivacyEnabled /t REG_DWORD /d 0 /f >nul 2>&1
            reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows NT\Printers\RPC" /v RpcUseNamedPipeProtocol /t REG_DWORD /d 1 /f >nul 2>&1
            reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows NT\Printers\RPC" /v RpcProtocols /t REG_DWORD /d 7 /f >nul 2>&1

            net start spooler >nul 2>&1
            echo [OK] Da thay the 3 file Spooler64 va khoi dong lai Spooler thanh cong.
            "#
        }
        "registry_rpc" => {
            r#"
            @echo off
            reg add "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Print" /v RpcAuthnLevelPrivacyEnabled /t REG_DWORD /d 0 /f >nul 2>&1
            reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows NT\Printers\RPC" /v RpcUseNamedPipeProtocol /t REG_DWORD /d 1 /f >nul 2>&1
            reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows NT\Printers\RPC" /v RpcProtocols /t REG_DWORD /d 7 /f >nul 2>&1
            net stop spooler /y >nul 2>&1
            net start spooler >nul 2>&1
            echo [OK] Da cap nhat Registry RpcProtocols = 7 va khoi dong lai Spooler.
            "#
        }
        "restore_backup" => {
            r#"
            @echo off
            net stop spooler /y >nul 2>&1
            if exist "%ProgramData%\PrintLANFixer\backup_dll\win32spl.dll" copy /y "%ProgramData%\PrintLANFixer\backup_dll\win32spl.dll" "%SystemRoot%\System32\" >nul 2>&1
            if exist "%ProgramData%\PrintLANFixer\backup_dll\localspl.dll" copy /y "%ProgramData%\PrintLANFixer\backup_dll\localspl.dll" "%SystemRoot%\System32\" >nul 2>&1
            if exist "%ProgramData%\PrintLANFixer\backup_dll\spoolsv.exe" copy /y "%ProgramData%\PrintLANFixer\backup_dll\spoolsv.exe" "%SystemRoot%\System32\" >nul 2>&1
            net start spooler >nul 2>&1
            echo [OK] Da khoi phuc 3 file he thong goc tu thu muc backup.
            "#
        }
        _ => return Err(format!("Phuong an khong hop le: {}", option_id)),
    };

    execute_command(batch_script.to_string(), false)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemStatus {
    pub is_admin: bool,
    pub spooler_running: bool,
    pub spooler_status_text: String,
    pub firewall_sharing_enabled: bool,
    pub port_445_open: bool,
    pub port_135_open: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PrinterJob {
    pub id: String,
    pub document_name: String,
    pub user: String,
    pub pages: u32,
    pub size: String,
    pub submitted_at: String,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PrinterItem {
    pub id: String,
    pub name: String,
    pub driver: String,
    pub port: String,
    pub is_default: bool,
    pub is_sharing: bool,
    pub is_remote_lan: bool,
    pub server_host: Option<String>,
    pub share_name: Option<String>,
    pub status: String,
    pub queue_jobs: Vec<PrinterJob>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CredentialItem {
    pub id: String,
    pub target: String,
    pub raw_target: String,
    pub user: String,
    pub cred_type: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TargetTestResult {
    pub success: bool,
    pub message: String,
}

#[tauri::command]
fn check_is_admin() -> bool {
    let mut cmd = Command::new("cmd");
    cmd.args(["/C", "net session >nul 2>&1"]);
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    match cmd.status() {
        Ok(status) => status.success(),
        Err(_) => false,
    }
}

#[tauri::command]
fn get_system_status() -> SystemStatus {
    let is_admin = check_is_admin();

    // 1. Kiểm tra dịch vụ Print Spooler
    let mut spooler_cmd = Command::new("cmd");
    spooler_cmd.args(["/C", "sc query spooler"]);
    #[cfg(windows)]
    spooler_cmd.creation_flags(CREATE_NO_WINDOW);

    let (spooler_running, spooler_status_text) = match spooler_cmd.output() {
        Ok(out) => {
            let text = String::from_utf8_lossy(&out.stdout).to_uppercase();
            if text.contains("RUNNING") {
                (true, "Running".to_string())
            } else if text.contains("STOPPED") {
                (false, "Stopped".to_string())
            } else if text.contains("PAUSED") {
                (false, "Paused".to_string())
            } else {
                (false, "Unknown".to_string())
            }
        }
        Err(_) => (false, "Error".to_string()),
    };

    // 2. Kiểm tra Windows Firewall cho File & Printer Sharing
    let mut fw_cmd = Command::new("cmd");
    fw_cmd.args([
        "/C",
        "netsh advfirewall firewall show rule name=\"File and Printer Sharing (Spooler Service - RPC)\"",
    ]);
    #[cfg(windows)]
    fw_cmd.creation_flags(CREATE_NO_WINDOW);

    let firewall_sharing_enabled = match fw_cmd.output() {
        Ok(out) => {
            let text = String::from_utf8_lossy(&out.stdout).to_lowercase();
            text.contains("enabled:                              yes")
                || text.contains("enabled: yes")
                || text.contains("action:                               allow")
        }
        Err(_) => false,
    };

    // 3. Kiểm tra Port 445 (SMB) & 135 (RPC) qua TCP socket nội bộ
    let port_445_open = std::net::TcpStream::connect_timeout(
        &"127.0.0.1:445".parse().unwrap(),
        std::time::Duration::from_millis(300),
    )
    .is_ok();

    let port_135_open = std::net::TcpStream::connect_timeout(
        &"127.0.0.1:135".parse().unwrap(),
        std::time::Duration::from_millis(300),
    )
    .is_ok();

    SystemStatus {
        is_admin,
        spooler_running,
        spooler_status_text,
        firewall_sharing_enabled,
        port_445_open,
        port_135_open,
    }
}

#[tauri::command]
fn get_system_printers() -> Result<Vec<PrinterItem>, String> {
    // 1. Quét danh sách máy in qua WMI / CIM
    let ps_printers = "& { Get-CimInstance Win32_Printer | Select-Object Name, DriverName, PortName, Shared, ShareName, Default, WorkOffline, PrinterStatus | ConvertTo-Json -Compress }";
    let output = execute_command(ps_printers.to_string(), true)?;

    if !output.success && !output.stderr.is_empty() {
        return Err(format!("Lỗi truy vấn máy in: {}", output.stderr));
    }

    let stdout_trimmed = output.stdout.trim();
    if stdout_trimmed.is_empty() {
        return Ok(Vec::new());
    }

    let parsed_json: serde_json::Value = match serde_json::from_str(stdout_trimmed) {
        Ok(v) => v,
        Err(_) => return Ok(Vec::new()),
    };

    let printer_entries: Vec<&serde_json::Value> = if parsed_json.is_array() {
        parsed_json.as_array().unwrap().iter().collect()
    } else if parsed_json.is_object() {
        vec![&parsed_json]
    } else {
        vec![]
    };

    // 2. Quét danh sách tác vụ in (Print Jobs)
    let ps_jobs = "& { Get-CimInstance Win32_PrintJob -ErrorAction SilentlyContinue | Select-Object JobId, Name, Document, Owner, TotalPages, Size, JobStatus, TimeSubmitted | ConvertTo-Json -Compress }";
    let jobs_output = execute_command(ps_jobs.to_string(), true).unwrap_or(ExecutionOutput {
        success: false,
        stdout: String::new(),
        stderr: String::new(),
        exit_code: 0,
    });

    let mut all_jobs: Vec<(String, PrinterJob)> = Vec::new();
    if jobs_output.success && !jobs_output.stdout.trim().is_empty() {
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(jobs_output.stdout.trim()) {
            let job_entries = if v.is_array() {
                v.as_array().unwrap().clone()
            } else if v.is_object() {
                vec![v]
            } else {
                vec![]
            };

            for j in job_entries {
                let job_full_name = j["Name"].as_str().unwrap_or("").to_string();
                let job_id = j["JobId"].as_u64().map(|id| id.to_string()).unwrap_or_else(|| "1".to_string());
                let doc = j["Document"].as_str().unwrap_or("Document").to_string();
                let owner = j["Owner"].as_str().unwrap_or("User").to_string();
                let pages = j["TotalPages"].as_u64().unwrap_or(1) as u32;
                let size_bytes = j["Size"].as_u64().unwrap_or(0);
                let size_str = if size_bytes > 1024 * 1024 {
                    format!("{:.1} MB", size_bytes as f64 / (1024.0 * 1024.0))
                } else if size_bytes > 1024 {
                    format!("{:.1} KB", size_bytes as f64 / 1024.0)
                } else {
                    format!("{} B", size_bytes)
                };
                let status = j["JobStatus"].as_str().unwrap_or("Spooling").to_string();

                all_jobs.push((
                    job_full_name,
                    PrinterJob {
                        id: job_id,
                        document_name: doc,
                        user: owner,
                        pages,
                        size: size_str,
                        submitted_at: "Hôm nay".to_string(),
                        status,
                    },
                ));
            }
        }
    }

    let mut result = Vec::new();

    for (index, p) in printer_entries.into_iter().enumerate() {
        let name = p["Name"].as_str().unwrap_or("").trim().to_string();
        if name.is_empty() {
            continue;
        }

        let driver = p["DriverName"].as_str().unwrap_or("Generic Printer Driver").to_string();
        let port = p["PortName"].as_str().unwrap_or("").to_string();
        let is_default = p["Default"].as_bool().unwrap_or(false);
        let is_sharing = p["Shared"].as_bool().unwrap_or(false);
        let share_name = p["ShareName"].as_str().map(|s| s.to_string());
        let work_offline = p["WorkOffline"].as_bool().unwrap_or(false);
        let printer_status = p["PrinterStatus"].as_i64().unwrap_or(3);

        let is_remote_lan = port.starts_with(r"\\") || port.starts_with("//") || driver.to_lowercase().contains("remote");

        let server_host = if is_remote_lan && port.starts_with(r"\\") {
            let parts: Vec<&str> = port.trim_start_matches(r"\\").split('\\').collect();
            parts.first().map(|s| s.to_string())
        } else {
            None
        };

        let status = if work_offline {
            "offline".to_string()
        } else if printer_status == 3 || printer_status == 4 {
            "ready".to_string()
        } else {
            "error".to_string()
        };

        // Lọc các tác vụ in thuộc về máy in này
        let matched_jobs: Vec<PrinterJob> = all_jobs
            .iter()
            .filter(|(full_name, _)| full_name.starts_with(&name))
            .map(|(_, job)| job.clone())
            .collect();

        result.push(PrinterItem {
            id: format!("printer-{}", index + 1),
            name,
            driver,
            port,
            is_default,
            is_sharing,
            is_remote_lan,
            server_host,
            share_name,
            status,
            queue_jobs: matched_jobs,
        });
    }

    Ok(result)
}

fn is_generic_or_system_cred(target: &str, cred_type: &str) -> bool {
    let type_lower = cred_type.to_lowercase();
    if type_lower.contains("generic") {
        return true;
    }
    let target_lower = target.to_lowercase();
    if target_lower.contains("virtualapp")
        || target_lower.starts_with("git:")
        || target_lower.starts_with("microsoftaccount")
        || target_lower.starts_with("windowslive")
        || target_lower.starts_with("sso_pop_device")
        || target_lower.contains("docker")
        || target_lower.contains("antigravity")
        || target_lower.contains("adobe")
        || target_lower.contains("vscode")
    {
        return true;
    }
    false
}

#[tauri::command]
fn get_stored_credentials() -> Result<Vec<CredentialItem>, String> {
    let mut cmd = Command::new("cmd");
    cmd.args(["/C", "cmdkey /list"]);
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let output = match cmd.output() {
        Ok(out) => String::from_utf8_lossy(&out.stdout).to_string(),
        Err(e) => return Err(format!("Lỗi khi chạy cmdkey: {}", e)),
    };

    let mut list = Vec::new();
    let mut cur_target: Option<(String, String)> = None; // (clean_target, raw_target)
    let mut cur_type = String::new();
    let mut cur_user = String::new();
    let mut count = 0;

    for line in output.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("Target:") {
            if let Some((clean, raw)) = cur_target.take() {
                if !is_generic_or_system_cred(&raw, &cur_type) {
                    count += 1;
                    list.push(CredentialItem {
                        id: format!("cred-{}", count),
                        target: clean,
                        raw_target: raw,
                        user: if cur_user.is_empty() { "(Không có user)".to_string() } else { cur_user.clone() },
                        cred_type: if cur_type.is_empty() { "Domain Password".to_string() } else { cur_type.clone() },
                    });
                }
            }
            let raw_target = trimmed.trim_start_matches("Target:").trim();
            // Lọc bỏ prefix như Domain:target= hoặc LegacyGeneric:target=
            let clean_target = if let Some(idx) = raw_target.find("target=") {
                &raw_target[idx + 7..]
            } else {
                raw_target
            };
            cur_target = Some((clean_target.to_string(), raw_target.to_string()));
            cur_type.clear();
            cur_user.clear();
        } else if trimmed.starts_with("Type:") {
            cur_type = trimmed.trim_start_matches("Type:").trim().to_string();
        } else if trimmed.starts_with("User:") {
            cur_user = trimmed.trim_start_matches("User:").trim().to_string();
        }
    }

    if let Some((clean, raw)) = cur_target.take() {
        if !is_generic_or_system_cred(&raw, &cur_type) {
            count += 1;
            list.push(CredentialItem {
                id: format!("cred-{}", count),
                target: clean,
                raw_target: raw,
                user: if cur_user.is_empty() { "(Không có user)".to_string() } else { cur_user },
                cred_type: if cur_type.is_empty() { "Domain Password".to_string() } else { cur_type },
            });
        }
    }

    // Ưu tiên hiển thị các thông tin liên quan tới máy chủ mạng / IP trước
    list.sort_by(|a, b| {
        let is_ip_or_lan_a = a.target.contains('.') || a.cred_type.contains("Domain");
        let is_ip_or_lan_b = b.target.contains('.') || b.cred_type.contains("Domain");
        is_ip_or_lan_b.cmp(&is_ip_or_lan_a)
    });

    Ok(list)
}

#[tauri::command]
fn open_printer_gui(printer_name: String, action: String) -> Result<(), String> {
    let arg = match action.as_str() {
        "properties" => "/p",
        "preferences" => "/e",
        "queue" => "/o",
        "test_page" => "/k",
        _ => return Err(format!("Action khong hop le: {}", action)),
    };

    let mut cmd = Command::new("rundll32.exe");
    cmd.args(["printui.dll,PrintUIEntry", arg, "/n", &printer_name]);
    // Không dùng CREATE_NO_WINDOW để Windows GUI hiển thị trên desktop bình thường
    cmd.spawn().map_err(|e| format!("Không thể mở giao diện máy in: {}", e))?;
    Ok(())
}

#[tauri::command]
fn delete_stored_credential(target: String) -> Result<ExecutionOutput, String> {
    let trimmed = target.trim();
    let clean = if let Some(idx) = trimmed.find("target=") {
        trimmed[idx + 7..].trim()
    } else {
        trimmed
    };

    // Chuẩn bị danh sách định dạng mục tiêu mà cmdkey hỗ trợ
    let mut candidates: Vec<String> = Vec::new();

    // 1. Thử trực tiếp target truyền vào (không bọc dấu ngoặc kép sau /delete:)
    if !trimmed.is_empty() {
        candidates.push(trimmed.to_string());
    }

    // 2. Thử với prefix Domain:target= nếu chưa có
    let domain_cand = format!("Domain:target={}", clean);
    if !clean.is_empty() && !candidates.contains(&domain_cand) {
        candidates.push(domain_cand);
    }

    // 3. Thử với clean target (không tiền tố)
    if !clean.is_empty() && !candidates.contains(&clean.to_string()) {
        candidates.push(clean.to_string());
    }

    // 4. Thử với prefix LegacyGeneric:target=
    let generic_cand = format!("LegacyGeneric:target={}", clean);
    if !clean.is_empty() && !candidates.contains(&generic_cand) {
        candidates.push(generic_cand);
    }

    let mut last_output: Option<ExecutionOutput> = None;

    for cand in candidates {
        // Cú pháp chuẩn của cmdkey: cmdkey /delete:<target_name> KHÔNG có dấu ngoặc kép
        let cmd = format!("cmdkey /delete:{}", cand);
        if let Ok(out) = execute_command(cmd, false) {
            let stdout_lower = out.stdout.to_lowercase();
            let stderr_lower = out.stderr.to_lowercase();
            let is_success = out.success
                && (stdout_lower.contains("successfully") || stdout_lower.contains("thành công"))
                && !stdout_lower.contains("element not found")
                && !stderr_lower.contains("element not found");

            if is_success {
                return Ok(out);
            }
            last_output = Some(out);
        }
    }

    if let Some(out) = last_output {
        Ok(out)
    } else {
        Err("Không thể thực thi lệnh xóa credential".to_string())
    }
}

#[tauri::command]
fn test_network_target(target: String) -> TargetTestResult {
    let clean_target = target
        .trim()
        .trim_start_matches(r"\\")
        .trim_start_matches("//")
        .split('\\')
        .next()
        .unwrap_or("")
        .to_string();

    if clean_target.is_empty() {
        return TargetTestResult {
            success: false,
            message: "Invalid host name or IP address.".to_string(),
        };
    }

    // 1. Thử kết nối TCP Port 445 (SMB)
    if let Ok(addr) = format!("{}:445", clean_target).parse::<std::net::SocketAddr>() {
        if std::net::TcpStream::connect_timeout(&addr, std::time::Duration::from_millis(1500)).is_ok() {
            return TargetTestResult {
                success: true,
                message: "SMB Port (TCP 445) open - Server ready for printing!".to_string(),
            };
        }
    } else {
        // Target là Hostname (NetBIOS / DNS)
        use std::net::ToSocketAddrs;
        if let Ok(mut addrs) = format!("{}:445", clean_target).to_socket_addrs() {
            if let Some(sock_addr) = addrs.next() {
                if std::net::TcpStream::connect_timeout(&sock_addr, std::time::Duration::from_millis(1500)).is_ok() {
                    return TargetTestResult {
                        success: true,
                        message: "SMB Port (TCP 445) open - Server ready for printing!".to_string(),
                    };
                }
            }
        }
    }

    // 2. Thử kết nối TCP Port 135 (RPC)
    use std::net::ToSocketAddrs;
    if let Ok(mut addrs) = format!("{}:135", clean_target).to_socket_addrs() {
        if let Some(sock_addr) = addrs.next() {
            if std::net::TcpStream::connect_timeout(&sock_addr, std::time::Duration::from_millis(1500)).is_ok() {
                return TargetTestResult {
                    success: true,
                    message: "RPC Port (TCP 135) open - LAN connection reachable!".to_string(),
                };
            }
        }
    }

    // 3. Fallback Ping ICMP nhanh
    let mut ping_cmd = Command::new("cmd");
    ping_cmd.args(["/C", &format!("ping -n 1 -w 1000 {}", clean_target)]);
    #[cfg(windows)]
    ping_cmd.creation_flags(CREATE_NO_WINDOW);

    match ping_cmd.status() {
        Ok(s) if s.success() => TargetTestResult {
            success: true,
            message: "Host replied to ICMP Ping (Ports 445/135 may be closed or blocked by firewall).".to_string(),
        },
        _ => TargetTestResult {
            success: false,
            message: "Cannot reach host (Offline, IP changed, or invalid hostname).".to_string(),
        },
    }
}

#[tauri::command]
fn open_browser_url(url: String) -> Result<(), String> {
    let mut cmd = Command::new("cmd");
    cmd.args(["/C", "start", "", &url]);
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd.spawn().map_err(|e| format!("Không thể mở trình duyệt: {}", e))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            execute_command,
            apply_709_server_option,
            check_is_admin,
            get_system_status,
            get_system_printers,
            get_stored_credentials,
            delete_stored_credential,
            test_network_target,
            open_printer_gui,
            open_browser_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

