# 🖨️ PrintLAN Fixer

<p align="center">
  <img src="public/printer.png" alt="PrintLAN Fixer Logo" width="80" height="80" />
</p>

<p align="center">
  <b>Phần mềm chẩn đoán, sửa lỗi và quản lý máy in chia sẻ qua mạng LAN trên Windows tốc độ cao, giao diện hiện đại.</b>
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

## 🌟 Tính năng nổi bật

- 🔍 **Chẩn đoán thời gian thực tình trạng hệ thống & Spooler**:
  - Tự động kiểm tra dịch vụ Print Spooler, trạng thái tường lửa Windows Defender Firewall và các cổng mạng quan trọng (TCP 135 RPC, TCP 445 SMB).

- 🛠️ **Sửa 1-Click hơn 20 mã lỗi máy in mạng kinh điển**:
  - **Nhóm kết nối & RPC / PrintNightmare**:
    - **`0x00000709` (`ERROR_INVALID_PRINTER_NAME`)**: Hỗ trợ 2 phương án (Thay thế 3 file DLL Spooler tương thích kèm tự động sao lưu, hoặc cấu hình Registry RPC over Named Pipes).
    - **`0x0000011b` (`RPC_C_AUTHN_LEVEL_PKT_PRIVACY`)**: Hạ cấp xác thực RPC xử lý triệt để lỗi do bản vá PrintNightmare trên mạng Workgroup.
    - **`0x00000bc4` (`ERROR_PRINTER_NOT_FOUND`)**: Khắc phục Windows 11 chặn dò tìm máy in chia sẻ qua RPC TCP.
    - **`0x000006ba`, `0x000006d9`, `0x000006be`**: Sửa lỗi máy chủ RPC không khả dụng, thiếu endpoint mapper do tường lửa hoặc Spooler crash giữa chừng.
  - **Nhóm quyền Driver & Point and Print**:
    - **`0x00000bcb` & `0x00000002`**: Gỡ bỏ giới hạn Point & Print, mở khóa quyền tải driver máy in chia sẻ cho người dùng thường.
    - **Nhóm Driver Package (`0x00000bc5` - `0x00000bce`)**: Xử lý `0x00000bc5` (Driver cảnh báo), `0x00000bc6` (Driver bị chặn), `0x00000bc7` (Package đang dùng), `0x00000bc8` (Thiếu core package), `0x00000bcd` (Manifest hỏng) và `0x00000bce` (Không hỗ trợ chia sẻ).
  - **Nhóm mạng, xác thực & Windows 11 24H2**:
    - **`0x80004005` & SMB Signing**: Tắt bắt buộc ký số SMB trên Windows 11 24H2 để tương thích máy chủ Windows đời cũ và NAS.
    - **`0x80070035` (`ERROR_BAD_NETPATH`)**: Mở đường dẫn Named Pipes, NetBIOS và kích hoạt Network Discovery.
    - **`0x00000005` & `0x0000052e`**: Xử lý lỗi Access Denied và lỗi sai thông tin xác thực / xung đột Windows Credential.
    - **`0x00000040` (`ERROR_NETNAME_DELETED`)**: Khôi phục phiên kết nối SMB bị gián đoạn giữa chừng.
  - **Nhóm hệ thống, cổng in & Spooler**:
    - **`0x0000007c`, `0x000003e3`, `0x0000007e`**: Sửa lỗi cấp độ tương thích Spooler, I/O Operation Aborted và thiếu module DLL / Print Processor.
    - **`0x00000057`, `0x00000704`, `0x00000bbb`**: Sửa lỗi sai tham số cấu hình, cổng in không xác định và lỗi không thể khởi tạo luồng in (`StartDoc`).

- ⚡ **7 Công cụ tiện ích hệ thống tích hợp sẵn**:
  1. **Khởi động lại Print Spooler**: Dừng an toàn các dịch vụ phụ thuộc và khởi động lại sạch sẽ.
  2. **Quản lý Windows Credential**: Xem, thêm hoặc xóa tài khoản đăng nhập máy chủ chia sẻ trực tiếp, tránh xung đột thông tin lưu trữ.
  3. **Mở Devices and Printers**: Mở trực tiếp cửa sổ Control Panel gốc trên Windows 10/11, không bị chuyển hướng sang ứng dụng Settings (`explorer shell:::{A8A91A66-3A7D-4424-8D24-04E180695C7A}`).
  4. **Mở Print Management**: Bật nhanh trình quản lý máy in nâng cao (`printmanagement.msc`).
  5. **Bật chia sẻ qua tường lửa**: Kích hoạt 1-click nhóm quy tắc File and Printer Sharing.
  6. **Bật/Tắt Windows Protected Print (WPP)**: Vô hiệu hóa chế độ chặn driver bên thứ ba trên Windows 11 24H2.
  7. **Fix lỗi giao tiếp Canon LBP 2900/3300**: Công cụ chuyên trị cho các dòng máy in Canon dùng cổng USB/LAN chia sẻ.

- 🖨️ **Quản lý máy in & hàng đợi in chuyên sâu**:
  - Quét danh sách máy in cục bộ và máy in mạng, in trang thử (Test Page), xem và xóa lệnh in bị kẹt, gỡ bỏ driver máy in.
  - Hỗ trợ thêm máy in qua IP và tên chia sẻ với bước kiểm tra kết nối tự động.

- 🚀 **Portable siêu nhẹ (~5.8 MB)**:
  - Không cần cài đặt, nhúng sẵn UAC manifest để chạy với quyền quản trị viên cao nhất.

---

## 🛠️ Công nghệ sử dụng

| Tầng | Công nghệ |
|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Giao diện** | [TailwindCSS v4](https://tailwindcss.com/) + Custom Design Tokens |
| **Icon** | [Lucide React](https://lucide.dev/) |
| **Bundler** | [Vite 6](https://vitejs.dev/) |
| **Core Desktop** | [Tauri v2](https://v2.tauri.app/) (Rust 2021) |
| **Windows API** | Win32 SCM (Service Control Manager), WinSpool, Credential Manager, Registry APIs |
| **Bảo mật** | Embedded UAC Manifest (`requireAdministrator`) |

---

## 📁 Cấu trúc thư mục

```text
PrintLan_fixer/
├── src/                          # Mã nguồn giao diện (React 19 + TypeScript)
│   ├── components/               # Các thành phần giao diện
│   │   ├── AddPrinterDialog.tsx  # Hộp thoại thêm máy in LAN
│   │   ├── ErrorDetailModal.tsx  # Hộp thoại chẩn đoán và sửa lỗi 1-click
│   │   ├── ErrorList.tsx         # Danh mục tra cứu lỗi
│   │   ├── Header.tsx            # Thanh điều hướng và đổi ngôn ngữ
│   │   ├── PrinterList.tsx       # Thẻ máy in và quản lý hàng đợi
│   │   ├── SystemStatus.tsx      # Chỉ số trạng thái hệ thống & Spooler
│   │   └── UtilityList.tsx       # 7 tiện ích hệ thống
│   ├── data/                     # Dữ liệu mã lỗi & lệnh sửa
│   │   ├── printerErrors.ts      # Định nghĩa 15+ lỗi, nguyên nhân và scripts
│   │   └── utilities.ts          # 7 tiện ích và lệnh thực thi
│   ├── i18n/                     # Đa ngôn ngữ (Tiếng Việt, Tiếng Anh)
│   └── types/                    # Khai báo kiểu TypeScript
│
├── src-tauri/                    # Mã nguồn backend native (Tauri v2 - Rust)
│   ├── resources/                # File nhúng Spooler64 phục vụ fix 709
│   ├── src/
│   │   ├── lib.rs                # Các lệnh Tauri IPC, gọi Win32 và kiểm tra trạng thái
│   │   └── main.rs               # Điểm khởi chạy ứng dụng Windows
│   ├── build.rs                  # Script build nhúng UAC manifest & window icon
│   ├── Cargo.toml                # Cấu hình dependency và tối ưu build Rust
│   └── tauri.conf.json           # Cấu hình ứng dụng Tauri v2
│
├── release.md                    # Mẫu mô tả phát hành GitHub Release
├── package.json                  # Cấu hình dự án và dependencies
├── README.vi.md                  # Tài liệu giới thiệu dự án (Tiếng Việt)
└── README.md                     # Tài liệu giới thiệu dự án (Tiếng Anh)
```

---

## 💻 Hướng dẫn cài đặt & Chạy mã nguồn

### Yêu cầu môi trường
- [Node.js](https://nodejs.org/) (khuyến nghị 18.0+)
- [Rust & Cargo](https://www.rust-lang.org/tools/install) (1.77.2+)
- Visual Studio C++ Build Tools (cho môi trường Windows)

### Cài đặt dependencies
```bash
git clone https://github.com/vemines/printlan-fixer.git
cd printlan-fixer
npm install
```

### Chạy chế độ phát triển (Development)
```bash
npm run tauri dev
```

---

## 📦 Hướng dẫn đóng gói (Build EXE Độc Lập)

Để biên dịch ra duy nhất 1 file `.exe` portable (không cần bộ cài đặt installer):

```bash
npm run tauri -- build --no-bundle
```

File sau khi biên dịch nằm tại:
```text
src-tauri/target/release/printlan-fixer.exe (~5.8 MB)
```

---

## 📄 Giấy phép

Dự án được phân phối theo giấy phép [MIT](LICENSE).

---

<div align="center">
  <sub>Phát triển với nhiệt huyết 💖 bởi <a href="https://github.com/vemines">VeMines</a></sub>
</div>
