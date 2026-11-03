ROADMAP BACKEND

Nền tảng kết nối Học viên – Gia sư | Node.js + Express + MongoDB

## 1. Tổng quan phạm vi Backend

Backend quản lý nghiệp vụ, dữ liệu, xác thực/phân quyền, tính khả dụng của khung giờ, vòng đời booking, thuật toán gợi ý theo tag và tích hợp Google Calendar. Backend là nguồn dữ liệu có thẩm quyền cho trạng thái slot và booking.

### Nguyên tắc nghiệp vụ cốt lõi

Gia sư tạo các khoảng thời gian có thể dạy. Học viên gửi yêu cầu booking dựa trên slot khả dụng.

Booking cần gia sư xác nhận. Chỉ booking ở trạng thái chiếm chỗ theo quy tắc đã thống nhất mới làm slot không còn khả dụng.

Không xây dựng bộ lập lịch tự động/thuật toán tối ưu lịch. Chỉ kiểm tra trùng giờ, trạng thái và CRUD dữ liệu.

Gợi ý dùng Content-based Filtering: chuẩn hóa nhu cầu và hồ sơ gia sư thành tag/thuộc tính, tính điểm tương đồng có trọng số.

Google Calendar đồng bộ sự kiện sau khi booking xác nhận; cần xử lý OAuth, token, retry và đồng bộ hai người dùng.

## 2. Kiến trúc Backend đề xuất

Node.js + Express cung cấp REST API; MongoDB lưu dữ liệu qua Mongoose.

Tổ chức theo module: auth, users, tutors, subjects/tags, availability, bookings, recommendations, calendar, reviews, admin.

Luồng xử lý khuyến nghị: Route → Middleware → Controller → Service → Model/Repository.

Middleware dùng chung: xác thực JWT, phân quyền role, validate request, xử lý lỗi, rate limit và logging.

Tách Google Calendar integration thành service riêng; không để logic OAuth/API Google nằm trực tiếp trong controller booking.

## 3. Thiết kế dữ liệu MongoDB đề xuất

| Collection | Trường chính đề xuất | Ghi chú nghiệp vụ |

| --- | --- | --- |

| users | _id, name, email, passwordHash, role, status, createdAt | Tài khoản và vai trò learner/tutor/admin. |

| tutorProfiles | userId, bio, subjects[], tags[], levels[], teachingModes[], languages[], hourlyRate, ratingSummary, approvalStatus | Hồ sơ gia sư; tag nên chuẩn hóa theo danh mục. |

| subjects/tags | name, slug, category, active | Danh mục môn học, kỹ năng, cấp độ và tag dùng chung. |

| availabilitySlots | tutorId, startAt, endAt, timezone, status, createdAt | Khung giờ gia sư khai báo; lưu thời gian theo UTC và giữ timezone gốc nếu cần. |

| bookings | learnerId, tutorId, slotId, startAt, endAt, status, note, rejectionReason, timestamps | Lưu trạng thái và snapshot thời gian để lịch sử không bị thay đổi khi slot chỉnh sửa. |

| reviews | bookingId, learnerId, tutorId, rating, comment, createdAt | Chỉ cho phép đánh giá theo điều kiện booking hoàn thành. |

| calendarConnections | userId, provider, googleAccountId, encryptedTokens, scopes, expiryDate | Token phải được mã hóa và bảo vệ; không trả token về client. |

| calendarEvents | bookingId, userId, googleEventId, syncStatus, lastSyncedAt, errorCode | Theo dõi sự kiện đồng bộ cho từng người dùng. |

Thiết kế trên là mô hình khởi đầu. Có thể gộp/tách collection tùy quy mô; cần tạo index cho email, tutorId + startAt, booking status, tag và các trường truy vấn thường xuyên.

## Giai đoạn 1 – Khởi tạo Backend và nền tảng kỹ thuật

Mục tiêu: Tạo server có cấu trúc module, kết nối MongoDB và quy chuẩn xử lý request.

### Công việc thực hiện

Khởi tạo Node.js project, Express, Mongoose và các package cần thiết.

Thiết lập biến môi trường: PORT, MONGODB_URI, JWT_SECRET, CLIENT_URL, Google OAuth credentials.

Tổ chức routes/controllers/services/models/middlewares/validators/config.

Tạo health-check endpoint, CORS, JSON parser, centralized error handler và request logging.

Thiết lập lint/format, script dev/test/start và cấu hình môi trường development/staging/production.

### Đầu ra

Server chạy ổn định và kết nối MongoDB.

Cấu trúc module thống nhất.

Health check và xử lý lỗi chung hoạt động.

Tiêu chí hoàn thành: Có thể khởi động server, kiểm tra kết nối DB và trả lỗi API theo định dạng thống nhất.

## Giai đoạn 2 – Xác thực và phân quyền

Mục tiêu: Đảm bảo tài khoản được xác thực và chỉ truy cập đúng chức năng theo vai trò.

### Công việc thực hiện

Xây dựng User model và API đăng ký, đăng nhập, đăng xuất, lấy hồ sơ hiện tại.

Hash mật khẩu bằng bcrypt; không lưu mật khẩu dạng rõ.

Phát hành access token và thiết kế refresh token an toàn nếu hệ thống cần phiên dài hạn.

Viết middleware authenticate và authorize theo role learner/tutor/admin.

Validate dữ liệu, chuẩn hóa email, xử lý email trùng, tài khoản bị khóa và token không hợp lệ.

Thiết lập rate limit cho endpoint đăng nhập/đăng ký và không ghi token/mật khẩu vào log.

### Đầu ra

Auth API.

Middleware xác thực và phân quyền.

Quy tắc bảo mật cơ bản.

Tiêu chí hoàn thành: Các endpoint riêng tư không thể truy cập khi thiếu token hoặc sai role.

## Giai đoạn 3 – Hồ sơ gia sư, danh mục và tag

Mục tiêu: Quản lý thông tin được sử dụng cho tìm kiếm và gợi ý.

### Công việc thực hiện

Thiết kế TutorProfile liên kết một-một hoặc một-nhiều với User theo quyết định kiến trúc.

API tạo/cập nhật/xem hồ sơ gia sư; giới hạn trường được phép cập nhật theo role.

Quản lý môn học, lĩnh vực, cấp độ, ngôn ngữ, hình thức dạy và tag bằng danh mục chuẩn.

Xây dựng API tìm kiếm gia sư với filter, sort, pagination và trạng thái hồ sơ được phép hiển thị.

Tính hoặc cập nhật ratingSummary từ các review hợp lệ; không cho client tự gửi điểm trung bình.

### Đầu ra

User/TutorProfile/Tag models.

API CRUD hồ sơ và danh mục.

API tìm kiếm gia sư.

Tiêu chí hoàn thành: Hồ sơ được kiểm tra dữ liệu; kết quả tìm kiếm chỉ trả thông tin công khai và hồ sơ đủ điều kiện.

## Giai đoạn 4 – CRUD khung giờ và kiểm tra khả dụng

Mục tiêu: Lưu khung giờ rảnh và xác định slot nào còn có thể được đặt.

### Công việc thực hiện

Thiết kế AvailabilitySlot với tutorId, startAt, endAt, timezone và trạng thái.

API gia sư tạo, xem, sửa, xóa slot; kiểm tra startAt < endAt và không nằm trong quá khứ.

Kiểm tra các slot của cùng gia sư không bị chồng lấn theo quy tắc nghiệp vụ.

API học viên lấy slot khả dụng theo gia sư/khoảng ngày; loại slot đã bị booking chiếm dụng.

Quy định rõ trạng thái nào chiếm chỗ: ví dụ pending có thể giữ chỗ trong thời hạn; confirmed luôn chiếm chỗ; rejected/cancelled giải phóng slot.

Dùng transaction hoặc thao tác atomic/unique constraint phù hợp để tránh hai học viên đặt cùng slot đồng thời.

### Đầu ra

Availability model và CRUD API.

API danh sách slot khả dụng.

Quy tắc chống trùng giờ và đặt trùng.

Tiêu chí hoàn thành: Không thể tạo slot chồng lấn trái quy tắc; không thể có hai booking hợp lệ cùng chiếm một slot.

## Giai đoạn 5 – Booking và vòng đời yêu cầu

Mục tiêu: Xây dựng quy trình học viên gửi yêu cầu và gia sư xác nhận/từ chối.

### Công việc thực hiện

API tạo booking: xác thực học viên, kiểm tra slot tồn tại, thuộc gia sư, còn khả dụng và nằm trong thời gian hợp lệ.

Lưu snapshot startAt/endAt vào booking để lịch sử không phụ thuộc thay đổi slot sau này.

API xem danh sách/chi tiết booking theo quyền của learner, tutor và admin.

API gia sư xác nhận hoặc từ chối; kiểm tra chuyển trạng thái hợp lệ theo state machine.

API hủy booking theo chính sách; ghi nhận người hủy, thời điểm và lý do nếu cần.

Đảm bảo thao tác cập nhật trạng thái và chiếm/giải phóng slot có tính nhất quán, chống race condition.

Phát sự kiện nội bộ sau confirmed/cancelled để kích hoạt thông báo và Google Calendar sync.

### Đầu ra

Booking model và API.

State transition rules.

Kiểm soát đặt trùng và phân quyền.

Tiêu chí hoàn thành: Luồng pending → confirmed/rejected và các trường hợp hủy được kiểm thử; không thể cập nhật trạng thái trái phép.

## Giai đoạn 6 – Content-based Filtering

Mục tiêu: Đề xuất gia sư dựa trên độ tương đồng giữa nhu cầu học viên và hồ sơ gia sư, không dùng Machine Learning.

### Công việc thực hiện

Xác định bộ tiêu chí: môn học/lĩnh vực, cấp độ, ngân sách, ngôn ngữ, hình thức học, mục tiêu và rating.

Chuẩn hóa dữ liệu: ID tag thống nhất, khoảng giá dạng số, cấp độ và hình thức học dùng enum/danh mục.

Tạo API nhận learner preferences và truy vấn tập gia sư đủ điều kiện.

Tính điểm theo trọng số, ví dụ: môn học 35%, cấp độ 20%, ngân sách 20%, hình thức/ngôn ngữ 15%, rating 10%; trọng số cần được nhóm/giảng viên thống nhất.

Có thể dùng điểm nhị phân cho tiêu chí khớp/không khớp; riêng giá có thể tính điểm theo mức chênh lệch hoặc nằm trong ngân sách.

Sắp xếp giảm dần theo tổng điểm; áp dụng ngưỡng tối thiểu và tie-breaker như rating hoặc số review.

Trả về matchScore và matchedReasons để Frontend giải thích vì sao gia sư được đề xuất.

Ghi nhận phiên bản quy tắc/trọng số để dễ điều chỉnh và đánh giá chất lượng gợi ý.

### Đầu ra

Recommendation service.

POST /api/recommendations/tutors.

Bảng trọng số và cách tính điểm được tài liệu hóa.

Tiêu chí hoàn thành: Cùng đầu vào tạo kết quả nhất quán; điểm và lý do khớp có thể giải thích; không gọi mô hình ML.

## Giai đoạn 7 – Google Calendar API

Mục tiêu: Đồng bộ booking đã xác nhận vào lịch của cả học viên và gia sư.

### Công việc thực hiện

Thiết lập Google Cloud project, bật Google Calendar API và cấu hình OAuth consent screen/redirect URI.

Xây dựng OAuth authorization code flow; xin scope tối thiểu cần thiết để tạo/sửa/xóa sự kiện.

Lưu refresh/access token an toàn, mã hóa token khi lưu và xử lý refresh khi access token hết hạn.

Khi booking confirmed, tạo event trên calendar của từng người dùng đã kết nối; lưu googleEventId theo user và booking.

Khi booking bị hủy hoặc thay đổi, cập nhật/xóa sự kiện tương ứng theo chính sách.

Xử lý trường hợp chỉ một bên kết nối Calendar, lỗi API Google, quota, token bị thu hồi và retry có kiểm soát.

Thiết kế idempotency để retry không tạo nhiều event trùng; lưu syncStatus và error detail.

### Đầu ra

OAuth và Calendar service.

Collection lưu kết nối/sự kiện.

Luồng đồng bộ, retry và log.

Tiêu chí hoàn thành: Booking vẫn hợp lệ khi Calendar lỗi; trạng thái đồng bộ được lưu riêng và có thể thử lại an toàn.

## Giai đoạn 8 – Review, Admin, bảo mật và vận hành

Mục tiêu: Hoàn thiện chức năng phụ trợ, bảo vệ dữ liệu và chuẩn bị triển khai.

### Công việc thực hiện

API review: chỉ học viên có booking completed hợp lệ mới được đánh giá; giới hạn một review theo quy tắc.

API Admin quản lý người dùng, duyệt hồ sơ gia sư, danh mục/tag và tra cứu booking.

Validate toàn bộ input; giới hạn field update để tránh mass assignment; sanitize dữ liệu đầu vào.

Thiết lập index, pagination, giới hạn kích thước request, bảo vệ endpoint và kiểm tra quyền sở hữu tài nguyên.

Viết unit/integration tests cho auth, availability, booking, recommendation và calendar service.

Thiết lập logging, monitoring cơ bản, backup MongoDB và quy trình deploy.

### Đầu ra

API review/admin.

Bộ kiểm thử Backend.

Tài liệu API và hướng dẫn deploy.

Tiêu chí hoàn thành: Các API cốt lõi có kiểm thử; không có lỗ hổng phân quyền cơ bản; có tài liệu để Frontend tích hợp.

## 4. Quy tắc trạng thái đề xuất

| Đối tượng | Trạng thái | Ý nghĩa |

| --- | --- | --- |

| Availability slot | available | Gia sư mở slot, chưa bị booking chiếm. |

| Availability slot | reserved / unavailable | Slot đang được giữ hoặc đã bị chiếm theo quy tắc hệ thống. |

| Availability slot | closed | Gia sư đóng slot hoặc slot không còn được cung cấp. |

| Booking | pending | Học viên gửi yêu cầu, chờ gia sư xử lý. |

| Booking | confirmed | Gia sư xác nhận; slot không còn khả dụng. |

| Booking | rejected | Gia sư từ chối; slot được giải phóng. |

| Booking | cancelled | Booking bị hủy theo chính sách; xử lý slot tùy thời điểm/quy tắc. |

| Booking | completed | Buổi học đã hoàn thành; có thể đủ điều kiện đánh giá. |

Lưu ý: Nếu pending cần giữ slot, phải có thời hạn giữ chỗ (holdExpiresAt) và cơ chế giải phóng khi hết hạn. Nếu không muốn triển khai TTL/job ở MVP, có thể chỉ chiếm slot khi confirmed, nhưng phải chấp nhận rủi ro nhiều yêu cầu pending cho cùng một slot và xử lý khi gia sư xác nhận.

## 5. Công thức gợi ý minh họa

Một phương án đơn giản, dễ giải thích và không dùng Machine Learning:

MatchScore = 0.35 × Subject + 0.20 × Level + 0.20 × Budget + 0.15 × Mode/Language + 0.10 × Rating

Subject: 1 nếu khớp môn/tag chính, 0 nếu không khớp.

Level: 1 nếu gia sư dạy đúng cấp độ yêu cầu, có thể dùng điểm một phần nếu gần tương đương.

Budget: 1 nếu giá nằm trong ngân sách; có thể giảm tuyến tính khi vượt nhẹ hoặc lệch khỏi khoảng mong muốn.

Mode/Language: chia trọng số con cho hình thức học và ngôn ngữ.

Rating: chuẩn hóa rating về thang 0–1; cân nhắc số lượng review để tránh ưu tiên quá mức hồ sơ chỉ có một đánh giá.

Các trọng số trên chỉ là ví dụ khởi điểm. Cần kiểm thử với dữ liệu mẫu, thống nhất với nhóm và mô tả rõ trong báo cáo dự án. Nên trả về cả điểm thành phần và lý do khớp để kết quả minh bạch.

## 6. Danh sách API đề xuất

| Module | Endpoint mẫu | Quyền chính |

| --- | --- | --- |

| Auth | POST /api/auth/register \| POST /api/auth/login \| GET /api/auth/me | Public / người dùng đăng nhập |

| Tutor | GET /api/tutors \| GET /api/tutors/:id \| PATCH /api/tutors/me | Public / Tutor |

| Tags | GET /api/tags \| POST /api/admin/tags \| PATCH /api/admin/tags/:id | Public đọc / Admin ghi |

| Availability | POST /api/availability \| GET /api/availability/mine \| GET /api/tutors/:id/availability | Tutor tạo/sửa; Learner xem |

| Booking | POST /api/bookings \| GET /api/bookings/me \| PATCH /api/bookings/:id/status | Learner tạo; Tutor xử lý; Admin quản lý |

| Recommendation | POST /api/recommendations/tutors | Learner |

| Calendar | GET /api/calendar/status \| GET /api/calendar/oauth \| POST /api/calendar/disconnect | Người dùng sở hữu kết nối |

| Reviews | POST /api/reviews \| GET /api/tutors/:id/reviews | Learner đủ điều kiện / Public đọc |

| Admin | GET /api/admin/users \| PATCH /api/admin/tutors/:id/approval | Admin |

## 7. Kiểm thử nghiệp vụ bắt buộc

Hai học viên gửi booking gần như đồng thời cho cùng một slot: chỉ một yêu cầu được xử lý theo quy tắc chiếm chỗ.

Gia sư sửa/xóa slot đã có booking confirmed: Backend từ chối hoặc xử lý theo chính sách, không làm sai lịch sử booking.

Người dùng không thể xem/sửa booking hoặc hồ sơ riêng tư không thuộc quyền sở hữu.

Gia sư không thể xác nhận booking của gia sư khác.

Booking rejected/cancelled giải phóng slot đúng quy tắc; booking confirmed giữ slot.

Recommendation xử lý được trường hợp thiếu tiêu chí, không có gia sư phù hợp và nhiều gia sư có cùng điểm.

Google Calendar lỗi hoặc người dùng chưa kết nối không làm rollback booking đã xác nhận; retry không tạo event trùng.

## 8. Thứ tự ưu tiên triển khai

| Ưu tiên | Phạm vi | Lý do |

| --- | --- | --- |

| MVP bắt buộc | Auth/role, hồ sơ gia sư, availability CRUD, booking, tìm kiếm cơ bản | Tạo được hành trình kết nối và đặt lịch cốt lõi. |

| MVP theo yêu cầu đề tài | Content-based Filtering theo tag và tiêu chí | Đáp ứng chức năng gợi ý mà không cần ML. |

| Tích hợp | Google Calendar cho cả học viên và gia sư | Đồng bộ lịch sau khi booking xác nhận. |

| Mở rộng | Review, dashboard Admin nâng cao, analytics, notification nâng cao | Cải thiện vận hành sau khi luồng chính ổn định. |

Lưu ý triển khai: Chốt trước API contract, quy tắc slot bị chiếm ở trạng thái pending/confirmed, timezone và state machine booking. Đây là các điểm dễ gây lệch giữa Frontend và Backend nhất.


├── server/                         # Node.js + Express
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middlewares/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── integrations/
│   │   │   └── google-calendar/
│   │   ├── constants/
│   │   ├── app.js
│   │   └── server.js
│   └── tests/