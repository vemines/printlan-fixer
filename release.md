# 🖨️ PrintLAN Fixer v1.0.0 — Official Release

> **PrintLAN Fixer** là công cụ portable siêu nhẹ (~5.8 MB), chạy ngay không cần cài đặt, chuyên trị toàn bộ các lỗi kết nối, chia sẻ và in ấn qua mạng LAN trên Windows (Windows 10, Windows 11 và Windows Server).
> 
> *A modern, ultra-lightweight portable utility (~5.8 MB) designed to diagnose, fix, and manage Windows LAN printer sharing and connectivity errors.*

---

## 🚀 Điểm Nổi Bật Trong Bản Phát Hành v1.0.0 / Highlights

- 🛠️ **Sửa Lỗi 1-Click Hơn 20 Mã Lỗi Mạng Phổ Biến (1-Click Fix for 20+ Network Print Errors)**:
  - **Nhóm kết nối & RPC / PrintNightmare**:
    - **`0x00000709` (`ERROR_INVALID_PRINTER_NAME`)**: Tích hợp 2 phương án (Thay thế 3 file DLL Spooler có tự động sao lưu an toàn, hoặc cấu hình Registry RPC over Named Pipes).
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

- ⚡ **7 Tiện Ích Quản Trị Hệ Thống Tích Hợp (7 Built-in System Utilities)**:
  1. Khởi động lại dịch vụ Print Spooler an toàn.
  2. Quản lý tài khoản mạng trong Windows Credential Manager.
  3. Mở nhanh cửa sổ Control Panel Devices and Printers gốc (bỏ qua trang Settings Win 11).
  4. Mở trình quản lý in ấn chuyên nghiệp Print Management (`printmanagement.msc`).
  5. Bật mở quyền chia sẻ tệp và máy in qua Windows Defender Firewall.
  6. Bật/Tắt tính năng Windows Protected Print (WPP) trên Windows 11 24H2.
  7. Fix lỗi giao tiếp máy in Canon LBP 2900/3300.

- 🖨️ **Quản Lý Máy In & Hàng Đợi In Trực Quan (Printer & Queue Management)**:
  - Tự động quét và hiển thị trạng thái tất cả máy in đang kết nối.
  - In trang thử nghiệm (Test Page), xem danh sách lệnh in và hủy lệnh in kẹt tức thì.
  - Hỗ trợ thêm nhanh máy in LAN qua IP và tên chia sẻ.

- 🛡️ **Bảo Mật & Tiện Lợi (Security & Usability)**:
  - File `.exe` độc lập duy nhất, nhúng sẵn UAC Administrator Manifest.
  - Hỗ trợ giao diện song ngữ mượt mà: **Tiếng Việt** và **Tiếng Anh**.
  - **Console Log Trực Quan**: Drawer hiển thị chi tiết toàn bộ lệnh thực thi và output của tiến trình hệ thống theo thời gian thực, có nút sao chép nhanh phục vụ debug.
  - **Cửa Sổ Thông Tin (About)**: Cung cấp tuyên bố miễn trừ trách nhiệm, hướng dẫn gửi góp ý tại GitHub Issues và mã QR ủng hộ tác giả.

---

## 📥 Tải Về & Sử Dụng / Download & Usage

1. Tải file `printlan-fixer.exe` đính kèm bên dưới.
2. Nhấp đúp vào file để khởi chạy (chấp nhận hộp thoại UAC yêu cầu quyền Administrator).
3. Sử dụng ngay mọi tính năng mà không cần cài đặt thêm bất kỳ phần mềm phụ trợ nào.

---

### 📋 Thông Tin Tệp Binary / Binary Information
- **Tên tệp / File name:** `printlan-fixer.exe`
- **Dung lượng / File size:** ~5.8 MB
- **Kiến trúc / Architecture:** Windows x86_64
- **Công nghệ cốt lõi / Core stack:** Tauri v2, Rust 2021, React 19, Tailwind CSS
