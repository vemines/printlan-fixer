# 🖨️ PrintLAN Fixer

<p align="center">
  <img src="public/printer.png" alt="PrintLAN Fixer Logo" width="80" height="80" />
</p>

<p align="center">
  <b>A modern, high-performance desktop utility to diagnose, fix, and manage Windows LAN printer errors.</b>
</p>

<p align="center">
  <a href="README.md"><b>English</b></a> •
  <a href="README.vi.md"><b>Tiếng Việt</b></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-v2-blue?logo=tauri" alt="Tauri v2" />
  <img src="https://img.shields.io/badge/Rust-2021-orange?logo=rust" alt="Rust" />
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-6-purple?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Platform-Windows-0078D6?logo=windows" alt="Windows" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" />
</p>

---

## 🌟 Key Features

- 🔍 **Real-Time System & Spooler Health Diagnostic**:
  - Live inspection of Windows Print Spooler service status, Windows Defender Firewall rule status, and network port availability (TCP 135 RPC, TCP 445 SMB).

- 🛠️ **1-Click Fix for 20+ Classic Windows Network Print Errors**:
  - **RPC & PrintNightmare Suite**:
    - **`0x00000709` (`ERROR_INVALID_PRINTER_NAME`)**: Dual-mode solution (Server Spooler DLL replacement with automatic backup, or Registry RPC over Named Pipes policy).
    - **`0x0000011b` (`RPC_C_AUTHN_LEVEL_PKT_PRIVACY`)**: Resolve Workgroup RPC authentication privacy mismatch introduced by PrintNightmare patches.
    - **`0x00000bc4` (`ERROR_PRINTER_NOT_FOUND`)**: Unblock Windows 11 printer discovery over RPC TCP.
    - **`0x000006ba`, `0x000006d9`, `0x000006be`**: Resolve RPC Server Unavailable, missing Endpoint Mapper, and RPC Call Failed due to firewall rules or Spooler crashes.
  - **Point and Print & Driver Package Suite**:
    - **`0x00000bcb` & `0x00000002`**: Bypass Point & Print restrictions, allowing standard non-admin users to download shared drivers.
    - **Driver Package Codes (`0x00000bc5` - `0x00000bce`)**: Fix `0x00000bc5` (Untrusted driver), `0x00000bc6` (Driver blocked), `0x00000bc7` (Package in use), `0x00000bc8` (Core package missing), `0x00000bcd` (Corrupt manifest), and `0x00000bce` (Not shareable).
  - **Network, Authentication & Windows 11 24H2**:
    - **`0x80004005` & SMB Signing**: Disable mandatory SMB Signing on Windows 11 24H2 for legacy server and NAS compatibility.
    - **`0x80070035` (`ERROR_BAD_NETPATH`)**: Enable Named Pipes, NetBIOS, and turn on Network Discovery.
    - **`0x00000005` & `0x0000052e`**: Fix Access Denied permission issues and Logon Failure / Credential Manager conflicts.
    - **`0x00000040` (`ERROR_NETNAME_DELETED`)**: Recover dropped SMB network sessions.
  - **System, Port & Spooler Operations**:
    - **`0x0000007c`, `0x000003e3`, `0x0000007e`**: Fix Spooler invalid level, I/O operation aborted, and missing module DLL / Print Processor errors.
    - **`0x00000057`, `0x00000704`, `0x00000bbb`**: Fix invalid parameters, unknown port mappings, and StartDoc spool failure (`Cannot start print job`).

- ⚡ **7 Essential Built-in System Utilities**:
  1. **Restart Print Spooler**: Safe stop, dependent services handling, and clean startup.
  2. **Windows Credential Manager**: List, add, or delete network credentials for shared printers without generic credential conflicts.
  3. **Devices and Printers**: Direct launch of classic Control Panel window bypassing Windows 11 modern Settings redirection (`explorer shell:::{A8A91A66-3A7D-4424-8D24-04E180695C7A}`).
  4. **Print Management GUI**: Instant launch of `printmanagement.msc` or Print Server Properties.
  5. **Enable Firewall File & Printer Sharing**: 1-click rule activation for LAN print protocols.
  6. **Toggle Windows Protected Print (WPP)**: Disable runtime driver blocking on Windows 11 24H2.
  7. **Fix Canon LBP 2900/3300 Comm Error**: Dedicated recovery tool for stubborn Canon USB/LAN queues.

- 🖨️ **Printer & Queue Management**:
  - Scan all local and shared LAN printers, check statuses, print test pages, view queue jobs, remove stuck jobs, or delete printer drivers.
  - Add LAN printers via manual IP and share name with live connectivity verification.

- 🚀 **Ultra-Lightweight Portable (~5.8 MB)**:
  - Zero installer required, embedded UAC manifest to run with highest administrator privileges out of the box.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [TailwindCSS v4](https://tailwindcss.com/) + Custom Design Tokens |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Bundler** | [Vite 6](https://vitejs.dev/) |
| **Desktop Core** | [Tauri v2](https://v2.tauri.app/) (Rust 2021) |
| **Windows APIs** | Win32 SCM (Service Control Manager), WinSpool, Credential Manager, Registry APIs |
| **Security** | Embedded UAC Manifest (`requireAdministrator`) |

---

## 📁 Project Structure

```text
PrintLan_fixer/
├── src/                          # Frontend source code (React 19 + TypeScript)
│   ├── components/               # UI components
│   │   ├── AddPrinterDialog.tsx  # LAN printer addition modal
│   │   ├── ErrorDetailModal.tsx  # Error diagnosis and 1-click execution modal
│   │   ├── ErrorList.tsx         # Searchable error library
│   │   ├── Header.tsx            # Navigation header & language switch
│   │   ├── PrinterList.tsx       # Printer cards & queue management
│   │   ├── SystemStatus.tsx      # System health & diagnostic indicators
│   │   └── UtilityList.tsx       # 7 core utility cards
│   ├── data/                     # Technical specifications & script commands
│   │   ├── printerErrors.ts      # 15+ error definitions, causes, and scripts
│   │   └── utilities.ts          # 7 utility actions & commands
│   ├── i18n/                     # Bilingual localization (vi, en)
│   └── types/                    # TypeScript interfaces
│
├── src-tauri/                    # Native Rust backend (Tauri v2)
│   ├── resources/                # Embedded Spooler binary backups
│   ├── src/
│   │   ├── lib.rs                # Tauri commands, Win32 execution & status checks
│   │   └── main.rs               # Windows entry point
│   ├── build.rs                  # Build script with UAC manifest & window icon
│   ├── Cargo.toml                # Rust dependencies & optimization flags
│   └── tauri.conf.json           # Tauri v2 configuration
│
├── release.md                    # GitHub Release template & notes
├── package.json                  # Frontend dependencies & scripts
├── README.vi.md                  # Project documentation (Tiếng Việt)
└── README.md                     # Project documentation (English)
```

---

## 💻 Getting Started & Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0+ recommended)
- [Rust & Cargo](https://www.rust-lang.org/tools/install) (1.77.2+)
- Visual Studio C++ Build Tools (Windows)

### Installation
```bash
git clone https://github.com/vemines/printlan-fixer.git
cd printlan-fixer
npm install
```

### Run in Development
```bash
npm run tauri dev
```

---

## 📦 Packaging (Build Standalone EXE)

To compile the single standalone portable `.exe` (without installer):

```bash
npm run tauri -- build --no-bundle
```

The compiled binary will be generated at:
```text
src-tauri/target/release/PrintLan-Fixer.exe (~5.8 MB)
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Crafted with passion 💖 by <a href="https://github.com/vemines">VeMines</a></sub>
</div>
