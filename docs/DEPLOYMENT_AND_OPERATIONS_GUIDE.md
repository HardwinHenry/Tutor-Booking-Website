# Hướng dẫn Vận hành, Bảo mật & Triển khai Production (Phase 10)

Tài liệu này cung cấp toàn bộ hướng dẫn triển khai, quản lý cấu hình bí mật, cơ chế bảo mật nâng cao, giám sát hệ thống và quy trình sao lưu / phục hồi dữ liệu cho hệ thống Backend của **Tutor Connect Platform**.

---

## 1. Quản lý Cấu hình & Biến môi trường (Environment Variables)

### 1.1 Nguyên tắc Bảo mật
- **Tuyệt đối không commit tệp `.env` vào repository Git.** Tệp `.gitignore` đã được cấu hình để loại trừ `.env`, `.env.local` và thư mục `backups/`.
- Sử dụng Secret Manager (Google Secret Manager, AWS Secrets Manager hoặc Doppler/Vault) khi triển khai trên production.

### 1.2 Danh mục biến môi trường bắt buộc

| Biến | Ý nghĩa | Môi trường | Ghi chú |
|---|---|---|---|
| `NODE_ENV` | `production`, `development`, `test` | Tất cả | Ở production kích hoạt xác thực bí mật nghiêm ngặt |
| `PORT` | Cổng HTTP lắng nghe (mặc định 5000) | Tất cả | Cloud providers thường gán biến này tự động |
| `CLIENT_URL` | URL Frontend Client được phép CORS | Tất cả | Ví dụ: `https://tutorconnect.com` |
| `MONGODB_URI` | Connection string MongoDB Atlas | Production / Dev | Phải cấu hình user có quyền `readWrite` |
| `JWT_SECRET` | Secret key ký Access Token (HS256) | Tất cả | Chuỗi ngẫu nhiên tối thiểu 32 ký tự |
| `JWT_EXPIRES_IN` | Thời gian sống Access Token | Tất cả | Mặc định `15m` |
| `JWT_REFRESH_SECRET` | Secret key ký Refresh Token | Tất cả | Khác biệt hoàn toàn với `JWT_SECRET` |
| `JWT_REFRESH_EXPIRES_IN` | Thời gian sống Refresh Token | Tất cả | Mặc định `7d` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Tất cả | Phục vụ Google Calendar Sync |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Tất cả | Bảo mật cấp cao |
| `GOOGLE_REDIRECT_URI` | Google OAuth Redirect Callback | Tất cả | Khớp với URI khai báo trên Google Cloud Console |

---

## 2. Các tầng phòng thủ và bảo mật (Security Layers)

### 2.1 Chống tấn công NoSQL Injection
Hệ thống tích hợp middleware `noSqlSanitizer` (`backend/src/middlewares/sanitizer.js`) quét đệ quy toàn bộ `req.body`, `req.query`, và `req.params`. Bất kỳ yêu cầu nào chứa toán tử selector đặc thù của MongoDB (như `$gt`, `$ne`, `$where`, hoặc cú pháp `[$`) sẽ ngay lập tức bị từ chối với mã lỗi `400 Bad Request`.

### 2.2 Input Sanitization & Chống Stored / Reflected XSS
Middleware `xssSanitizer` tự động làm sạch và bóc tách các thẻ `<script>` nguy hại khỏi chuỗi ký tự đầu vào trước khi tiến hành xử lý nghiệp vụ hoặc lưu trữ vào cơ sở dữ liệu.

### 2.3 Phân tầng Giới hạn Tần suất (Rate Limiting)
Triển khai thông qua `express-rate-limit` với 3 bộ lọc độc lập:
1. **`authLimiter`**: Giới hạn 20 yêu cầu / 15 phút trên các endpoint đăng nhập, đăng ký (`/api/auth/*`) để ngăn chặn tấn công dò mật khẩu (Brute-force).
2. **`actionLimiter`**: Giới hạn 60 thao tác / 15 phút trên các tác vụ mutation nhạy cảm (tạo booking, gửi review, cập nhật profile).
3. **`apiLimiter`**: Giới hạn 300 yêu cầu / 15 phút trên toàn bộ endpoint `/api/*`.

### 2.4 Kiểm soát quyền hạn (RBAC) & Chống Mass Assignment
- Toàn bộ controller và validator áp dụng cơ chế Whitelist fields nghiêm ngặt: người dùng không thể tự ý chèn các trường đặc quyền như `role: 'admin'`, `approvalStatus: 'approved'`, hay `ratingSummary`.
- Quản trị viên không thể tự khóa hoặc vô hiệu hóa tài khoản của chính mình.
- Khi người dùng bị khóa (`status: 'locked'`), toàn bộ phiên làm việc (Refresh Token) ngay lập tức bị thu hồi.

---

## 3. Giám sát Hệ thống (System Health & Monitoring)

### Endpoint Probe
- **`GET /health`** (Root alias cho cloud orchestrator như Kubernetes / AWS ECS / Google Cloud Run)
- **`GET /api/health`**

### Payload phản hồi mẫu:
```json
{
  "success": true,
  "message": "Health check passed",
  "data": {
    "service": "Tutor Connect Backend API",
    "status": "healthy",
    "timestamp": "2026-11-23T15:15:00.000Z",
    "uptimeSeconds": 1420,
    "uptime": 1420,
    "environment": "production",
    "system": {
      "nodeVersion": "v22.x",
      "pid": 12844,
      "memory": {
        "rssMb": 85.32,
        "heapTotalMb": 45.12,
        "heapUsedMb": 38.65
      }
    },
    "database": {
      "status": "connected",
      "connected": true,
      "host": "ac-biewtsf-shard-00-02.juhqeqq.mongodb.net",
      "name": "tutor_booking"
    },
    "version": "1.0.0"
  }
}
```

---

## 4. Tự động hóa Sao lưu & Khôi phục Cơ sở dữ liệu (MongoDB Backup / Restore)

### 4.1 Quy trình Sao lưu (Backup)
Hệ thống cung cấp script sao lưu tự động tạo snapshot định dạng JSON kèm tệp `manifest.json` ghi nhận số lượng bản ghi:

```bash
# Thực hiện sao lưu mặc định vào thư mục backend/backups/backup-<timestamp>/
npm run db:backup

# Hoặc tùy biến thư mục đích:
node scripts/backup-db.js /path/to/custom-backup-dir
```

### 4.2 Quy trình Khôi phục (Restore)
Để khôi phục dữ liệu từ một bản sao lưu cụ thể:

```bash
# Khôi phục dữ liệu bổ sung (không xóa dữ liệu cũ)
npm run db:restore /path/to/backup-dir

# Khôi phục sạch (xóa toàn bộ dữ liệu trong collection trước khi import bản sao lưu)
npm run db:restore /path/to/backup-dir --clean
```

### 4.3 Khuyến nghị Thiết lập Cron Job định kỳ trên Server
Có thể lên lịch sao lưu hàng ngày lúc 02:00 AM qua crontab trên máy chủ:
```cron
0 2 * * * cd /var/www/tutor-connect/backend && npm run db:backup >> /var/log/tutor-connect-backup.log 2>&1
```

---

## 5. Danh sách API Hoàn thiện của Giai đoạn 10

### Review & Rating System
- `POST /api/reviews`: Học viên gửi đánh giá cho buổi học `completed` (tự động tính lại điểm trung bình của gia sư).
- `GET /api/tutors/:id/reviews`: Đọc công khai đánh giá của gia sư kèm phân tích số lượng theo từng số sao (1 đến 5 sao).
- `GET /api/reviews/mine`: Học viên xem danh sách các đánh giá đã gửi.
- `GET /api/reviews/booking/:bookingId`: Xem đánh giá của một đơn đặt lịch.
- `POST /api/reviews/:id/response`: Gia sư gửi phản hồi cho đánh giá của học viên.

### Admin Dashboard & Management
- `GET /api/admin/users`: Quản trị viên phân trang, tìm kiếm và lọc danh sách người dùng theo vai trò, trạng thái.
- `GET /api/admin/users/:id`: Xem chi tiết thông tin hồ sơ và thống kê booking của một người dùng.
- `PATCH /api/admin/users/:id/status`: Khóa, mở khóa, hoặc vô hiệu hóa tài khoản người dùng kèm lý do.
- `GET /api/admin/reviews`: Kiểm duyệt toàn bộ đánh giá trên hệ thống.
- `PATCH /api/admin/reviews/:id/visibility`: Ẩn/hiện đánh giá vi phạm và tự động tính toán lại điểm số gia sư.
- `GET /api/admin/calendar-sync`: Giám sát toàn bộ lịch sử đồng bộ Google Calendar của hệ thống.
