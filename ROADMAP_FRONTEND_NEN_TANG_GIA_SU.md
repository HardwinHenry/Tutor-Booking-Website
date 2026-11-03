ROADMAP FRONTEND

Nền tảng kết nối Học viên – Gia sư | React + MERN Stack

## 1. Tổng quan phạm vi Frontend

Frontend chịu trách nhiệm hiển thị giao diện, thu thập thao tác của người dùng, kiểm tra dữ liệu đầu vào ở mức giao diện, gọi Backend API và trình bày kết quả. Hệ thống có ba nhóm vai trò: Học viên, Gia sư và Admin.

### Nguyên tắc nghiệp vụ cần giữ đúng

Gia sư tự khai báo các khung giờ có thể nhận dạy; học viên chỉ nhìn thấy các khung giờ còn khả dụng.

Booking là quy trình gửi yêu cầu. Gia sư xác nhận hoặc từ chối; không tự động xác nhận chỉ vì học viên bấm đặt lịch.

Không xây dựng thuật toán xếp lịch tự động. Giao diện chỉ hiển thị, chọn, kiểm tra trạng thái và cập nhật dữ liệu khung giờ.

Gợi ý gia sư dùng Content-based Filtering theo các tiêu chí/tag như môn học, ngôn ngữ, cấp độ, ngân sách, hình thức học và đánh giá.

Google Calendar hỗ trợ đồng bộ sự kiện cho cả học viên và gia sư sau khi booking được xác nhận; quyền truy cập cần được người dùng cấp.

## 2. Cấu trúc màn hình đề xuất

| Khu vực | Màn hình / chức năng chính |

| --- | --- |

| Dùng chung | Đăng ký, đăng nhập, quên mật khẩu, hồ sơ cá nhân, thông báo, trang lỗi/không có dữ liệu. |

| Học viên | Trang chủ, tìm kiếm gia sư, bộ lọc, danh sách gợi ý, chi tiết gia sư, xem lịch trống, tạo booking, lịch học của tôi, đánh giá. |

| Gia sư | Dashboard, hồ sơ/chuyên môn, quản lý môn và tag, thiết lập giá, quản lý khung giờ rảnh, yêu cầu booking, lịch dạy, đánh giá. |

| Admin | Dashboard quản trị, quản lý tài khoản, duyệt/ẩn hồ sơ gia sư, quản lý danh mục/tag, quản lý booking và báo cáo cơ bản. |

## 3. Kiến trúc và quy ước Frontend

React + Vite; React Router để điều hướng; lựa chọn Context API hoặc Zustand để quản lý trạng thái dùng chung.

Axios hoặc Fetch API để gọi Backend; tập trung cấu hình base URL, interceptor gắn access token và xử lý lỗi 401/403.

Tổ chức theo feature: auth, tutor, learner, availability, booking, recommendation, calendar, admin.

Tách components dùng chung (Button, Input, Modal, Select, Rating, Calendar/TimeSlot, Pagination) khỏi trang nghiệp vụ.

Bảo vệ route theo vai trò ở Frontend để cải thiện trải nghiệm; Backend vẫn phải kiểm tra quyền ở mọi API.

Quản lý trạng thái tải, lỗi, rỗng, thành công; không chỉ xây dựng giao diện ở trạng thái dữ liệu lý tưởng.

## Giai đoạn 1 – Khởi tạo dự án và nền tảng giao diện

Mục tiêu: Tạo ứng dụng React có cấu trúc rõ ràng, có thể phát triển đồng thời nhiều module.

### Công việc thực hiện

Khởi tạo React + Vite, cài React Router, thư viện gọi API, thư viện quản lý state nếu cần và bộ UI/icon.

Thiết lập cấu trúc thư mục theo features, components, layouts, hooks, services, utils, assets và routes.

Tạo layout chung: Header, Sidebar/Dashboard layout, Footer, thông báo Toast và Modal.

Thiết lập biến môi trường VITE_API_BASE_URL; tạo API client dùng chung.

Xây dựng design system cơ bản: màu sắc, typography, khoảng cách, nút, input, form, bảng và thẻ.

### Đầu ra

Ứng dụng chạy được trên môi trường local.

Các layout và component nền tảng dùng lại được.

Có quy ước đặt tên, format code và quản lý biến môi trường.

Tiêu chí hoàn thành: Có thể điều hướng giữa các trang mẫu và render giao diện nhất quán trên desktop/mobile.

## Giai đoạn 2 – Đăng ký, đăng nhập và phân quyền giao diện

Mục tiêu: Cho phép người dùng truy cập hệ thống theo đúng vai trò.

### Công việc thực hiện

Xây dựng form đăng ký, đăng nhập, quên mật khẩu và cập nhật hồ sơ.

Tích hợp API xác thực; lưu/đọc trạng thái đăng nhập theo cơ chế token do Backend quy định.

Tạo route guard cho learner, tutor và admin; điều hướng sau đăng nhập theo vai trò.

Xử lý trạng thái hết hạn phiên, đăng xuất, lỗi thông tin và quyền truy cập.

Tạo màn hình onboarding hoặc hoàn thiện hồ sơ ban đầu nếu Backend cung cấp luồng này.

### Đầu ra

Các trang xác thực hoạt động với API.

Người dùng được chuyển đến đúng khu vực theo role.

Trang không có quyền truy cập được xử lý rõ ràng.

Tiêu chí hoàn thành: Kiểm thử được các trường hợp đăng nhập đúng/sai, token hết hạn và truy cập nhầm role.

## Giai đoạn 3 – Hồ sơ gia sư và tìm kiếm

Mục tiêu: Giúp học viên khám phá gia sư và giúp gia sư quản lý thông tin giới thiệu.

### Công việc thực hiện

Gia sư cập nhật ảnh, giới thiệu, môn/lĩnh vực dạy, kinh nghiệm, cấp độ, hình thức học và ngôn ngữ.

Xây dựng giao diện quản lý tag/chuyên môn, mức giá theo giờ và khu vực/hình thức dạy nếu có.

Học viên tìm kiếm theo từ khóa và lọc theo môn học, mức giá, cấp độ, hình thức học, đánh giá.

Xây dựng trang danh sách, phân trang, sắp xếp và trang chi tiết gia sư.

Hiển thị trạng thái hồ sơ: đang chờ duyệt, đã duyệt, bị ẩn hoặc cần bổ sung (nếu áp dụng).

### Đầu ra

Trang danh sách và chi tiết gia sư.

Form quản lý hồ sơ dành cho gia sư.

Bộ lọc và tìm kiếm kết nối API.

Tiêu chí hoàn thành: Dữ liệu hiển thị khớp API; bộ lọc có thể kết hợp nhiều điều kiện và xử lý khi không có kết quả.

## Giai đoạn 4 – Quản lý khung giờ rảnh và lịch trống

Mục tiêu: Cho phép gia sư khai báo giờ có thể dạy và học viên chọn giờ chưa bị đặt.

### Công việc thực hiện

Gia sư tạo, xem, sửa, xóa khung giờ rảnh; chọn ngày, giờ bắt đầu, giờ kết thúc và múi giờ.

Hiển thị lịch theo ngày/tuần hoặc danh sách slot; có bộ lọc theo ngày.

Ở phía học viên, gọi API lấy các slot khả dụng của gia sư và chỉ hiển thị slot còn có thể đặt.

Ẩn hoặc vô hiệu hóa slot đã được booking hợp lệ chiếm dụng theo trạng thái Backend trả về.

Hiển thị thông báo khi slot vừa bị người khác đặt hoặc dữ liệu đã thay đổi; yêu cầu tải lại danh sách.

### Đầu ra

Giao diện CRUD khung giờ cho gia sư.

Giao diện xem lịch trống cho học viên.

Trạng thái slot rõ ràng: trống, đang chờ xử lý, đã xác nhận, đã đóng.

Tiêu chí hoàn thành: Không hiển thị slot không còn khả dụng; giao diện không tự quyết định tính hợp lệ cuối cùng mà dựa vào Backend.

## Giai đoạn 5 – Booking và quản lý buổi học

Mục tiêu: Hoàn thiện hành trình học viên gửi yêu cầu và gia sư xử lý yêu cầu.

### Công việc thực hiện

Học viên chọn gia sư, slot trống, nhập mục tiêu/nội dung buổi học và gửi yêu cầu booking.

Tạo màn hình xác nhận thông tin trước khi gửi; ngăn gửi form thiếu dữ liệu.

Gia sư xem danh sách booking chờ xử lý, xem chi tiết và xác nhận hoặc từ chối.

Hai bên xem lịch sử và trạng thái booking: pending, confirmed, rejected, cancelled, completed (thống nhất enum với Backend).

Cho phép hủy hoặc yêu cầu hủy theo quy tắc nghiệp vụ; hiển thị lý do và cập nhật trạng thái sau phản hồi API.

Cập nhật lại danh sách slot sau mọi thay đổi booking.

### Đầu ra

Luồng tạo booking cho học viên.

Màn hình xử lý booking cho gia sư.

Trang lịch sử và chi tiết booking cho hai vai trò.

Tiêu chí hoàn thành: Một booking có trạng thái nhất quán ở cả hai phía; UI không báo thành công trước khi API xác nhận.

## Giai đoạn 6 – Gợi ý gia sư Content-based Filtering

Mục tiêu: Trình bày danh sách gia sư phù hợp dựa trên nhu cầu khai báo của học viên.

### Công việc thực hiện

Tạo form nhu cầu học: môn/lĩnh vực, cấp độ, ngân sách, hình thức học, ngôn ngữ, mục tiêu và lịch mong muốn nếu có.

Gửi tiêu chí lên API recommendation; Backend thực hiện tính điểm so khớp tag và trả danh sách.

Hiển thị thẻ gia sư, điểm phù hợp hoặc nhãn giải thích như 'Khớp môn học', 'Trong ngân sách', 'Đánh giá tốt'.

Cho phép điều chỉnh tiêu chí và tải lại gợi ý; có trạng thái chưa đủ dữ liệu và không tìm thấy kết quả.

Không triển khai Machine Learning ở Frontend; không tự tính điểm khác với quy tắc Backend.

### Đầu ra

Form nhu cầu học.

Trang danh sách gia sư được gợi ý.

Giải thích ngắn các tiêu chí khớp.

Tiêu chí hoàn thành: Kết quả hiển thị đúng thứ tự API trả về và giải thích phù hợp với tiêu chí được sử dụng.

## Giai đoạn 7 – Google Calendar và thông báo

Mục tiêu: Giúp hai bên theo dõi buổi học đã xác nhận trong lịch cá nhân.

### Công việc thực hiện

Xây dựng giao diện kết nối/ngắt kết nối Google Calendar và trạng thái quyền truy cập.

Sau khi booking được xác nhận, hiển thị trạng thái đồng bộ và liên kết sự kiện nếu Backend trả về.

Hiển thị lỗi đồng bộ, nút thử lại hoặc hướng dẫn kết nối lại khi token hết hạn.

Tạo khu vực thông báo trong ứng dụng cho booking mới, được xác nhận, bị từ chối hoặc bị hủy.

Không yêu cầu Frontend tự giữ Google refresh token; xử lý OAuth/token theo thiết kế Backend.

### Đầu ra

Giao diện kết nối Google Calendar.

Trạng thái đồng bộ sự kiện.

Trung tâm thông báo cơ bản.

Tiêu chí hoàn thành: Người dùng hiểu được lịch đã đồng bộ hay chưa; lỗi đồng bộ không làm mất trạng thái booking.

## Giai đoạn 8 – Admin, kiểm thử và hoàn thiện

Mục tiêu: Hoàn thiện các chức năng quản trị và đảm bảo giao diện ổn định.

### Công việc thực hiện

Xây dựng dashboard Admin, quản lý người dùng, hồ sơ gia sư, danh mục môn học/tag và booking.

Bổ sung tìm kiếm, lọc, phân trang, xác nhận thao tác nhạy cảm và thông báo kết quả.

Kiểm thử responsive, accessibility cơ bản, validation, loading/error/empty state.

Kiểm thử tích hợp theo vai trò và các tình huống tranh chấp slot (API trả về slot đã bị đặt).

Tối ưu hiệu năng: lazy loading route, hạn chế gọi API lặp, debounce ô tìm kiếm và xử lý ảnh.

### Đầu ra

Các màn hình Admin thiết yếu.

Bộ kiểm thử luồng chính và danh sách lỗi đã xử lý.

Bản Frontend sẵn sàng tích hợp/deploy.

Tiêu chí hoàn thành: Các luồng cốt lõi chạy xuyên suốt trên môi trường staging với dữ liệu thật từ Backend.

## 4. Luồng Frontend tổng thể

Học viên đăng nhập → nhập nhu cầu → xem gia sư gợi ý/tìm kiếm → xem hồ sơ → xem slot trống → gửi booking.

Gia sư đăng nhập → hoàn thiện hồ sơ → khai báo slot rảnh → nhận yêu cầu → xác nhận/từ chối booking.

Sau khi xác nhận → Backend đồng bộ Google Calendar cho hai bên → Frontend hiển thị lịch và thông báo.

Admin đăng nhập → quản lý tài khoản, hồ sơ gia sư, danh mục và theo dõi booking.

## 5. API Frontend cần phối hợp với Backend

| Nhóm | Ví dụ endpoint (đề xuất) | Mục đích |

| --- | --- | --- |

| Auth | POST /api/auth/register, POST /api/auth/login, GET /api/auth/me | Đăng ký, đăng nhập, lấy người dùng hiện tại. |

| Tutor | GET /api/tutors, GET /api/tutors/:id, PATCH /api/tutors/me | Tìm kiếm, xem và cập nhật hồ sơ gia sư. |

| Availability | GET/POST /api/availability, PATCH/DELETE /api/availability/:id | CRUD khung giờ rảnh và lấy slot khả dụng. |

| Booking | POST /api/bookings, GET /api/bookings/me, PATCH /api/bookings/:id/status | Tạo và xử lý booking. |

| Recommendation | POST /api/recommendations/tutors | Lấy danh sách gia sư phù hợp theo tiêu chí. |

| Calendar | GET /api/calendar/status, POST /api/calendar/connect, POST /api/calendar/sync | Kết nối và theo dõi đồng bộ lịch; endpoint thực tế tùy OAuth flow. |

| Admin | GET/PATCH /api/admin/users, GET/PATCH /api/admin/tutors | Quản trị tài khoản và hồ sơ. |

## 6. Checklist nghiệm thu Frontend

Phân biệt đúng ba vai trò Học viên, Gia sư, Admin.

Học viên chỉ nhìn thấy slot được Backend xác nhận là khả dụng.

Booking thể hiện đúng vòng đời trạng thái; không tự chuyển sang confirmed ở giao diện.

Gia sư CRUD được khung giờ rảnh và xử lý booking.

Gợi ý hiển thị theo dữ liệu Content-based Filtering từ Backend.

Google Calendar có trạng thái kết nối/đồng bộ và thông báo lỗi phù hợp.

Các trang có loading, error, empty state và responsive cơ bản.

Lưu ý tích hợp: Tên endpoint trong tài liệu là gợi ý để thống nhất hợp đồng API, không phải yêu cầu cố định. Frontend và Backend cần chốt request/response, enum trạng thái và quy tắc phân quyền trước khi tích hợp.
