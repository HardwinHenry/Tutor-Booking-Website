ROADMAP FRONTEND – TUTOR BOOKING WEBSITE
Phiên bản tài liệu: 2.0 – Bản cập nhật đề xuất
Phạm vi: Frontend React, onboarding 28 câu hỏi, hồ sơ Learner/Tutor, tìm kiếm và gợi ý gia sư, Availability, Booking, Google Calendar, Review, Notification và Admin.
Lưu ý về phạm vi: Tài liệu này được cập nhật từ Roadmap Frontend gốc và đồng bộ với ROADMAP_BACKEND_TUTOR_BOOKING_REVISED.md phiên bản 2.0. Các endpoint và response là hợp đồng tích hợp đề xuất; cần đối chiếu với API thực tế trước khi triển khai. Frontend không tự giả định một API đã tồn tại chỉ vì endpoint được liệt kê trong roadmap.

Mục lục
1. Tổng quan phạm vi Frontend
2. Vai trò và cấu trúc màn hình
3. Kiến trúc và quy ước Frontend
4. Giai đoạn 1 – Khởi tạo dự án và nền tảng giao diện
5. Giai đoạn 2 – Auth, phân quyền và onboarding 28 câu hỏi
6. Giai đoạn 3 – Hồ sơ, Taxonomy, Admin duyệt và tìm kiếm gia sư
7. Giai đoạn 4 – Gợi ý gia sư Content-based Filtering
8. Giai đoạn 5 – Availability và lịch trống
9. Giai đoạn 6 – Booking và quản lý buổi học
10. Giai đoạn 7 – Google Calendar, Notification và Review
11. Giai đoạn 8 – Admin, kiểm thử và hoàn thiện
12. Luồng Frontend tổng thể
13. API Contract Frontend – Backend
14. Quy tắc trạng thái cần tuân thủ
15. Checklist nghiệm thu Frontend
16. Thứ tự ưu tiên và các quyết định cần chốt
17. Cấu trúc thư mục Frontend đề xuất
1. Tổng quan phạm vi Frontend
Frontend chịu trách nhiệm hiển thị giao diện, thu thập thao tác người dùng, kiểm tra dữ liệu đầu vào ở mức giao diện, gọi Backend API và trình bày dữ liệu trả về. Hệ thống có ba nhóm vai trò: learner, tutor và admin.
1.1. Mục tiêu theo vai trò
Vai trò	Trách nhiệm và chức năng chính
Learner	Đăng ký/đăng nhập; hoàn thành và cập nhật bộ câu hỏi 28 mục; tìm kiếm và nhận gợi ý gia sư; xem hồ sơ và lịch trống; gửi/theo dõi/hủy booking theo chính sách; kết nối Calendar; đánh giá sau buổi học hoàn thành.
Tutor	Đăng ký/đăng nhập; hoàn thành và cập nhật bộ câu hỏi 28 mục; quản lý hồ sơ năng lực; gửi hồ sơ chờ duyệt; quản lý khung giờ rảnh; xem và xử lý booking; kết nối Calendar; theo dõi đánh giá.
Admin	Quản lý tài khoản; duyệt/từ chối hồ sơ gia sư; quản lý Taxonomy/Tag; tra cứu booking, review và trạng thái tích hợp theo quyền được Backend cấp.


1.2. Nguyên tắc nghiệp vụ bắt buộc
1. Backend là nguồn dữ liệu có thẩm quyền: Frontend không tự quyết định trạng thái tài khoản, duyệt hồ sơ, trạng thái slot, booking, rating hoặc điểm recommendation.
2. Tách tài khoản và hồ sơ: Thông tin đăng nhập thuộc User; câu trả lời Learner lưu trong LearnerPreference; câu trả lời và năng lực Tutor lưu trong TutorProfile.
3. Onboarding dùng chung taxonomy: Các lựa chọn lĩnh vực, môn học, chuyên môn, cấp độ, phương pháp, phong cách và hỗ trợ phải dùng ID do Backend trả về; không hard-code tên hiển thị để đối chiếu dữ liệu.
4. Lưu nháp và tiếp tục: Form 28 câu phải hỗ trợ tiến độ, tải dữ liệu đã lưu và cập nhật câu trả lời. Frontend cần giữ nguyên questionnaireVersion Backend trả về.
5. Phân biệt thời gian mong muốn và lịch thực tế: Câu hỏi về ngày/giờ học chỉ là preference. Khung giờ được đặt phải lấy từ AvailabilitySlot.
6. Booking cần gia sư xác nhận: Học viên gửi yêu cầu không đồng nghĩa booking đã xác nhận.
7. Không tự xếp lịch: Frontend chỉ hiển thị, chọn và gửi yêu cầu đối với slot Backend cung cấp; không tự tối ưu hoặc tự tạo lịch.
8. Recommendation chỉ hiển thị kết quả Backend: Frontend không tự tính MatchScore, không tự thay đổi thứ tự gia sư và không triển khai Machine Learning.
9. Calendar là tích hợp phụ trợ: Không coi booking thất bại chỉ vì Google Calendar đồng bộ lỗi.
10. Xử lý đầy đủ trạng thái giao diện: Mọi màn hình gọi API cần có loading, error, empty, success và trạng thái không có quyền phù hợp.
2. Vai trò và cấu trúc màn hình
2.1. Khu vực dùng chung
- Đăng ký, đăng nhập và đăng xuất.
- Quên mật khẩu/đặt lại mật khẩu nếu Backend cung cấp API tương ứng.
- Hồ sơ cá nhân và cập nhật thông tin tài khoản.
- Onboarding theo vai trò.
- Notification center.
- Trạng thái kết nối Google Calendar.
- Trang lỗi, không tìm thấy dữ liệu, không có quyền và trang bảo trì nếu cần.
2.2. Khu vực Learner
- Trang chủ và dashboard học viên.
- Onboarding/bộ câu hỏi nhu cầu học tập 28 câu.
- Trang cập nhật nhu cầu học tập.
- Tìm kiếm gia sư, bộ lọc và sắp xếp.
- Danh sách gia sư được gợi ý.
- Chi tiết hồ sơ gia sư và đánh giá.
- Xem lịch trống theo ngày/tuần.
- Xác nhận và gửi yêu cầu booking.
- Danh sách, chi tiết và lịch sử booking.
- Đánh giá sau buổi học hoàn thành.
- Kết nối/ngắt kết nối Google Calendar và xem trạng thái đồng bộ.
2.3. Khu vực Tutor
- Dashboard gia sư.
- Onboarding/bộ câu hỏi năng lực giảng dạy 28 câu.
- Quản lý hồ sơ, môn học, chuyên môn, phương pháp và hỗ trợ.
- Quản lý bằng cấp/chứng chỉ và trạng thái xác minh nếu Backend cung cấp.
- Gửi hồ sơ để Admin duyệt; theo dõi draft, pending, approved, rejected.
- Quản lý học phí và điều kiện dạy.
- CRUD khung giờ rảnh.
- Danh sách và chi tiết yêu cầu booking.
- Xác nhận/từ chối/hủy booking theo chính sách.
- Lịch dạy và lịch sử buổi học.
- Xem đánh giá nhận được.
- Kết nối/ngắt kết nối Google Calendar.
2.4. Khu vực Admin
- Dashboard quản trị.
- Quản lý tài khoản và trạng thái tài khoản.
- Danh sách hồ sơ Tutor chờ duyệt.
- Xem chi tiết hồ sơ và thông tin chứng chỉ được phép truy cập.
- Duyệt/từ chối hồ sơ Tutor và ghi nhận lý do.
- Quản lý Taxonomy/Tag.
- Tra cứu và lọc booking.
- Tra cứu review và trạng thái Calendar sync nếu Backend cung cấp API.
- Báo cáo cơ bản chỉ triển khai khi Backend có API thống kê tương ứng; không tự tổng hợp dữ liệu vượt quyền ở Frontend.
3. Kiến trúc và quy ước Frontend
3.1. Công nghệ
- React + Vite.
- React Router để điều hướng.
- Axios hoặc Fetch API để gọi Backend; chọn một cách thống nhất.
- Context API hoặc Zustand để quản lý state dùng chung; tránh sử dụng đồng thời nhiều giải pháp không cần thiết.
- CSS framework/UI library theo quyết định của nhóm.
- Thư viện form/validation nếu cần; schema Frontend phải bám quy tắc Backend.
3.2. Cấu trúc theo feature
Các feature chính:
- auth
- questionnaire / onboarding
- learner
- tutor
- taxonomy
- recommendation
- availability
- booking
- calendar
- notification
- review
- admin
3.3. API Client
Tạo một API client dùng chung với các quy ước:
- Base URL lấy từ VITE_API_BASE_URL.
- Tập trung cấu hình header, JSON serialization, timeout và xử lý lỗi.
- Gắn access token theo cơ chế Backend thống nhất.
- Xử lý 401 theo quy trình refresh token đã thống nhất; tránh gọi refresh lặp vô hạn.
- Xử lý 403 bằng trang/thông báo không có quyền phù hợp.
- Xử lý 404, 409, 422, 429 và lỗi 5xx theo mã lỗi Backend trả về.
- Không ghi access token, refresh token, thông tin xác thực hoặc dữ liệu nhạy cảm vào console/log.
- Không để từng component tự khai báo URL và logic xác thực riêng.
Lưu ý bảo mật token: Frontend không tự quyết định nơi lưu refresh token. Nếu Backend dùng cookie HttpOnly, API client cần cấu hình gửi credentials theo hợp đồng; không đọc refresh token từ JavaScript. Cơ chế cuối cùng phải thống nhất với Backend.
3.4. Route guard và quyền truy cập
- Có route guard cho learner, tutor, admin.
- Điều hướng sau đăng nhập theo role và trạng thái onboarding.
- Tutor đang pending hoặc rejected chỉ được truy cập các màn hình phù hợp để theo dõi/cập nhật hồ sơ; không hiển thị như Tutor đã được duyệt.
- Frontend route guard chỉ nhằm cải thiện trải nghiệm. Backend vẫn phải kiểm tra role và quyền sở hữu ở từng API.
3.5. Quy chuẩn giao diện dùng chung
Tạo các component tái sử dụng:
- Button, Input, Textarea, Select, Checkbox, RadioGroup.
- FormField, FormSection, Stepper/ProgressIndicator.
- Modal, Dialog xác nhận, Toast.
- Table, Pagination, SearchBar, FilterPanel.
- TutorCard, Rating, ReviewCard.
- Calendar, DatePicker, TimeSlot.
- StatusBadge cho từng nhóm trạng thái riêng.
- LoadingState, ErrorState, EmptyState, PermissionState.
Không dùng chung một badge/status mapping cho AvailabilitySlot, Booking, TutorProfile và CalendarSync vì đây là các đối tượng có vòng đời khác nhau.
4. Giai đoạn 1 – Khởi tạo dự án và nền tảng giao diện
Mục tiêu: Tạo ứng dụng React có cấu trúc rõ ràng, có thể phát triển đồng thời các feature và tích hợp API theo một quy ước chung.
Công việc thực hiện
1. Khởi tạo React + Vite và thiết lập script chạy local/build.
2. Cài đặt React Router, Axios hoặc Fetch API,thiết lập thông báo bằng toast, thư viện state nếu cần và bộ UI/icon của luside.
3. Thiết lập cấu trúc thư mục theo feature, components, layouts, hooks, services, utils, assets và routes.
4. Tạo layout chung: Header, Sidebar/Dashboard layout, Footer, Toast, Modal và trang lỗi.
5. Thiết lập VITE_API_BASE_URL và API client dùng chung.
6. Xây dựng design system cơ bản: màu sắc, typography, spacing, button, input, form, bảng, card và trạng thái.(tailwind)
7. Tạo component trạng thái loading/error/empty/success và component xác nhận hành động.
8. Thiết lập responsive cơ bản cho desktop, tablet và mobile.
Đầu ra
- Ứng dụng chạy được trên môi trường local.
- Layout và component nền tảng có thể tái sử dụng.
- Có quy ước đặt tên, format code, quản lý biến môi trường và gọi API.
Tiêu chí hoàn thành: Điều hướng được giữa các trang mẫu; API client dùng chung; giao diện hiển thị nhất quán trên các kích thước màn hình cơ bản.
5. Giai đoạn 2 – Auth, phân quyền và onboarding 28 câu hỏi
Mục tiêu: Cho phép người dùng xác thực đúng vai trò và hoàn thành bộ câu hỏi tương ứng trước khi sử dụng đầy đủ các chức năng chính.
5.1. Xác thực và phân quyền
Công việc thực hiện
- Xây dựng form đăng ký, đăng nhập và đăng xuất.
- Xây dựng quên mật khẩu/đặt lại mật khẩu khi Backend cung cấp endpoint và quy trình xác thực tương ứng.
- Tích hợp các API Auth: register, login, refresh, logout và me.
- Lấy role từ dữ liệu phiên đăng nhập do Backend xác nhận; không tin role do người dùng tự sửa ở Frontend.
- Tạo route guard cho Learner, Tutor và Admin.
- Điều hướng người dùng sau đăng nhập dựa trên role, trạng thái profile và trạng thái onboarding.
- Xử lý access token hết hạn, refresh thất bại, tài khoản bị khóa/vô hiệu hóa và quyền truy cập không hợp lệ.
Đầu ra
- Các trang xác thực hoạt động với Backend.
- Người dùng được chuyển đến đúng khu vực theo role.
- Phiên đăng nhập và đăng xuất được xử lý thống nhất.
5.2. Onboarding Learner – 28 câu hỏi
Công việc thực hiện
- Gọi GET /api/questionnaires/learner để lấy bộ câu hỏi, version, loại input, lựa chọn và điều kiện hiển thị do Backend cung cấp.
- Gọi GET /api/taxonomies hoặc API lấy danh mục con khi cần hiển thị lĩnh vực, môn học và chuyên môn.
- Hiển thị câu hỏi theo các nhóm trong tài liệu nguồn:
  - Q1–Q8: Lĩnh vực, môn học, chuyên môn, mục tiêu và trình độ.
  - Q9–Q14: Phương pháp và phong cách học.
  - Q15–Q18: Thời gian học.
  - Q19–Q24: Hình thức, địa điểm, ngân sách, ưu tiên và yêu cầu Tutor.
  - Q25–Q28: Khó khăn, hỗ trợ, theo dõi tiến độ và mô tả thêm.
- Xử lý câu hỏi phụ thuộc Q1 → Q2 → Q3; khi câu trả lời cha thay đổi, xóa hoặc xác nhận lại các câu trả lời con không còn hợp lệ.
- Hỗ trợ single-select, multi-select, lựa chọn tối đa, số, khoảng giá và câu trả lời tự do theo metadata/API.
- Lưu nháp và tiếp tục trả lời; hiển thị tiến độ.
- Tải lại các câu trả lời đã lưu từ LearnerPreference.
- Cho phép cập nhật nhu cầu sau khi hoàn thành onboarding.
- Chỉ đánh dấu hoàn thành khi Backend xác nhận completionStatus = completed.
Đầu ra
- Form onboarding 28 câu cho Learner.
- Tiến độ trả lời, lưu nháp và tiếp tục.
- Trang xem/cập nhật nhu cầu học tập.
5.3. Onboarding Tutor – 28 câu hỏi
Công việc thực hiện
- Gọi GET /api/questionnaires/tutor để lấy bộ câu hỏi và metadata.
- Hiển thị các nhóm tương ứng:
  - Q1–Q8: Lĩnh vực, môn/chuyên môn, mục tiêu và trình độ có thể giảng dạy.
  - Q9–Q14: Phương pháp và phong cách giảng dạy.
  - Q15–Q18: Thời gian và khả năng nhận lớp.
  - Q19–Q24: Hình thức, địa điểm, học phí, kinh nghiệm và bằng cấp.
  - Q25–Q28: Cách hỗ trợ, đánh giá tiến độ và giới thiệu thêm.
- Cho phép nhập tên bằng cấp/chứng chỉ cụ thể theo form được Backend hỗ trợ.
- Lưu nháp, tiếp tục trả lời và cập nhật hồ sơ.
- Gửi hồ sơ để duyệt bằng POST /api/tutors/profile/submit.
- Hiển thị trạng thái hồ sơ draft, pending, approved, rejected và lý do từ chối nếu Backend trả về.
Đầu ra
- Form onboarding 28 câu cho Tutor.
- Trang xem/cập nhật hồ sơ năng lực.
- Chức năng gửi hồ sơ và theo dõi trạng thái duyệt.
5.4. Quy tắc giao diện onboarding
- Không hard-code option ID hoặc tự tạo taxonomy ID ở Frontend.
- Dùng questionnaireVersion Backend trả về; không tự thay đổi version.
- Không tự suy luận câu trả lời từ Q28 hoặc biến nội dung tự do thành tag.
- Hiển thị rõ câu bắt buộc, giới hạn lựa chọn và thông báo validation.
- Với trường phụ thuộc, chỉ hiển thị câu con khi đáp án cha hợp lệ.
- Trường Offline chỉ hiển thị khi người dùng chọn hình thức có Offline.
- Không bắt buộc Learner khai báo khu vực nếu sản phẩm chưa thống nhất bổ sung câu hỏi khu vực; không hiển thị cam kết matching khoảng cách khi thiếu dữ liệu.
- Các câu hỏi và tùy chọn single/multi-select phải bám cấu hình Backend, không tự quyết định khác tài liệu questionnaire.
API chính
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- GET /api/auth/me
- GET /api/questionnaires/:role
- GET /api/taxonomies
- GET /api/taxonomies/:id/children
- GET /api/learners/preferences/me
- PUT hoặc PATCH /api/learners/preferences/me (chọn một phương thức canonical trong API contract; có thể dùng PATCH cho lưu từng phần)
- POST /api/learners/preferences/complete
- GET /api/tutors/profile/me
- PUT hoặc PATCH /api/tutors/profile/me (thống nhất cùng quy tắc cập nhật như Learner)
- POST /api/tutors/profile/submit
Tiêu chí hoàn thành: Learner và Tutor hoàn thành đúng form theo vai trò; lưu nháp không mất dữ liệu; dữ liệu gửi lên được Backend chấp nhận; không thể cập nhật profile của vai trò khác.
6. Giai đoạn 3 – Hồ sơ, Taxonomy, Admin duyệt và tìm kiếm gia sư
Mục tiêu: Hiển thị hồ sơ công khai của gia sư đã được duyệt, giúp Learner tìm kiếm và giúp Tutor quản lý thông tin giới thiệu.
Công việc thực hiện
Phía Tutor
- Xây dựng trang hồ sơ cá nhân và hồ sơ giảng dạy.
- Cho phép cập nhật ảnh/giới thiệu/môn học/chuyên môn/kinh nghiệm/cấp độ/hình thức/ngôn ngữ/học phí/khu vực theo các trường Backend hỗ trợ.
- Quản lý danh mục và tag bằng dữ liệu taxonomy được tải từ Backend.
- Hiển thị danh sách bằng cấp/chứng chỉ và trạng thái xác minh nếu Backend trả về.
- Hiển thị rõ trạng thái duyệt:
  - draft: hồ sơ nháp.
  - pending: đang chờ Admin duyệt.
  - approved: đã duyệt.
  - rejected: bị từ chối; hiển thị lý do và hướng dẫn cập nhật/gửi lại.
- Không hiển thị Tutor pending/rejected như gia sư đủ điều kiện nhận booking.
Phía Learner
- Xây dựng trang danh sách gia sư.
- Tìm kiếm theo từ khóa và lọc theo category, subject, topic, học phí, cấp độ, hình thức học, khu vực và rating khi Backend hỗ trợ.
- Hỗ trợ kết hợp filter, sort và pagination theo query parameters Backend định nghĩa.
- Xây dựng trang chi tiết Tutor: giới thiệu, chuyên môn, phương pháp, kinh nghiệm, bằng cấp đã xác minh, học phí, hình thức dạy và đánh giá.
- Chỉ hiển thị các trường public mà Backend cho phép; không hiển thị giấy tờ, thông tin liên hệ hoặc dữ liệu riêng tư ngoài quyền.
Phía Admin
- Xây dựng danh sách hồ sơ gia sư chờ duyệt.
- Xem chi tiết thông tin cần thiết để duyệt.
- Thực hiện duyệt/từ chối và nhập lý do.
- Quản lý Taxonomy/Tag theo quyền Admin.
- Không xóa cứng danh mục đã được tham chiếu nếu Backend chỉ cho phép chuyển sang inactive.
Đầu ra
- Trang danh sách và chi tiết gia sư.
- Form quản lý hồ sơ Tutor.
- Trang quản lý trạng thái duyệt Tutor.
- Bộ lọc, tìm kiếm và phân trang.
- Màn hình quản lý Taxonomy cơ bản cho Admin.
API chính
- GET /api/tutors
- GET /api/tutors/:id
- GET /api/tutors/profile/me
- PUT/PATCH /api/tutors/profile/me
- GET /api/taxonomies
- GET /api/taxonomies/:id/children
- GET /api/admin/tutors?approvalStatus=pending
- PATCH /api/admin/tutors/:id/approval
- POST /api/admin/taxonomies
- PATCH /api/admin/taxonomies/:id
Tiêu chí hoàn thành: Dữ liệu hiển thị khớp response API; chỉ Tutor đủ điều kiện được hiển thị công khai; tìm kiếm/filter/pagination xử lý được loading, lỗi và không có kết quả.
7. Giai đoạn 4 – Gợi ý gia sư Content-based Filtering
Mục tiêu: Trình bày danh sách Tutor phù hợp từ nhu cầu Learner và hồ sơ Tutor do Backend đánh giá.
7.1. Luồng giao diện
1. Learner đăng nhập.
2. Frontend kiểm tra Learner đã có LearnerPreference và đủ dữ liệu tối thiểu chưa.
3. Nếu chưa đủ, điều hướng tới phần onboarding/cập nhật nhu cầu.
4. Nếu đã đủ, Learner mở trang gợi ý.
5. Frontend gửi yêu cầu recommendation. Backend tự xác định Learner theo JWT và đọc preference tương ứng; Frontend không tự gửi learnerId thay cho danh tính phiên.
6. Backend lọc Tutor không đủ điều kiện, tính điểm, sắp xếp và trả kết quả.
7. Frontend hiển thị đúng thứ tự Backend trả về.
8. Learner có thể điều chỉnh các bộ lọc bổ sung nếu API hỗ trợ và tải lại kết quả.
7.2. Tiêu chí hiển thị
Backend 2.0 đề xuất công thức Content-based Filtering:

MatchScore = 0.30S + 0.20L + 0.15B + 0.10M + 0.10T + 0.05A + 0.05E + 0.05R

Trong đó:
Nhóm	Ý nghĩa	Frontend hiển thị
S – Subject/Topic (30%)	Khớp lĩnh vực, môn học và chuyên môn	Khớp môn/chuyên môn
L – Level/Goal (20%)	Khớp trình độ hiện tại, trình độ mục tiêu và mục tiêu học	Phù hợp trình độ và mục tiêu
B – Budget (15%)	Khớp ngân sách và học phí	Trong ngân sách/phù hợp ngân sách
M – Mode/Location (10%)	Khớp Online/Offline và điều kiện địa điểm	Phù hợp hình thức/địa điểm
T – Teaching Fit (10%)	Khớp phương pháp, phong cách, tài liệu và hỗ trợ	Phù hợp cách giảng dạy
A – Availability Preference (5%)	Khớp ngày/khung giờ/thời lượng tổng quát	Phù hợp thời gian mong muốn
E – Experience/Qualification (5%)	Khớp kinh nghiệm và bằng cấp không bắt buộc	Kinh nghiệm/chứng chỉ phù hợp
R – Rating (5%)	Đánh giá từ Review hợp lệ	Điểm đánh giá và số review


Lưu ý: Trọng số trên là đề xuất trong Backend Roadmap 2.0, cần được nhóm thống nhất và kiểm thử trước khi chốt. Frontend chỉ nhận và trình bày kết quả; không tự tính lại điểm.
7.3. Nội dung thẻ gia sư được gợi ý
- Ảnh đại diện/ảnh hồ sơ nếu có.
- Tên và giới thiệu ngắn.
- Lĩnh vực, môn học, chuyên môn liên quan.
- Hình thức học và học phí.
- Rating và số lượt review nếu có dữ liệu.
- matchScore theo thang Backend quy định.
- Các lý do matchedReasons.
- Có thể hiển thị tiêu chí chưa phù hợp nếu Backend trả missingOrWeakMatches và sản phẩm quyết định công khai thông tin đó.
Không tự hiển thị “đánh giá tốt” khi Tutor chưa có review. Không tuyên bố “gần bạn” khi chưa có vị trí/khu vực Learner và dữ liệu vị trí Tutor đủ để so sánh.
7.4. Trạng thái giao diện
- Chưa hoàn thành preference: hướng dẫn hoàn thiện onboarding.
- Đang tải: skeleton/loading.
- Có kết quả: hiển thị danh sách theo thứ tự API.
- Không có ứng viên phù hợp: giải thích và cho phép điều chỉnh tiêu chí mềm.
- Lỗi API: thông báo và cho phép thử lại.
- Profile thiếu dữ liệu tùy chọn: hiển thị dựa trên dữ liệu Backend trả về; không tự gán điểm 0 hoặc điểm tối đa.
API chính
- POST /api/recommendations/tutors
- Có thể truyền filter bổ sung như mode, dateRange, page, limit nếu Backend hỗ trợ.
Response dự kiến cần có:
- algorithmVersion
- items[]
- tutorId và thông tin Tutor public
- matchScore
- scoreBreakdown gồm subject, levelGoal, budget, modeLocation, teachingFit, availability, experienceQualification, rating
- matchedReasons[]
- Có thể có missingOrWeakMatches[]
Tiêu chí hoàn thành: Kết quả hiển thị đúng thứ tự Backend; điểm và lý do khớp đúng response; Frontend không triển khai công thức riêng hoặc Machine Learning.
8. Giai đoạn 5 – Availability và lịch trống
Mục tiêu: Cho phép Tutor khai báo slot dạy cụ thể và Learner xem các slot Backend xác nhận còn khả dụng.
8.1. Phía Tutor – Quản lý AvailabilitySlot
Công việc thực hiện
- Tạo slot bằng ngày, giờ bắt đầu, giờ kết thúc và timezone.
- Xem danh sách slot theo ngày/tuần/tháng hoặc chế độ danh sách.
- Chỉnh sửa/đóng/xóa slot theo quyền và quy tắc Backend.
- Hiển thị lỗi khi thời gian bắt đầu không nhỏ hơn thời gian kết thúc, slot ở quá khứ hoặc bị trùng.
- Không cho thao tác sửa/xóa slot đã có booking confirmed nếu Backend từ chối.
- Tải lại dữ liệu sau khi tạo, sửa, đóng hoặc xóa slot.
8.2. Phía Learner – Xem lịch trống
Công việc thực hiện
- Từ trang chi tiết Tutor, gọi API lấy slot theo from và to.
- Hiển thị lịch theo ngày/tuần và danh sách slot có thể chọn.
- Chỉ cho chọn slot có trạng thái available và còn hợp lệ tại thời điểm thao tác.
- Hiển thị timezone phù hợp; chuyển đổi giờ UTC theo timezone được Backend trả về hoặc quy tắc sản phẩm.
- Kiểm tra duration mong muốn có phù hợp slot trước khi gửi yêu cầu; Backend vẫn là nơi xác thực cuối cùng.
- Nếu slot vừa bị người khác xác nhận, hiển thị thông báo xung đột và tải lại lịch.
8.3. Tách trạng thái Slot và Booking
AvailabilitySlot có trạng thái:
Trạng thái	Hiển thị
available	Có thể đặt yêu cầu
booked	Đã được booking xác nhận chiếm
closed	Gia sư đã đóng slot
reserved	Chỉ hiển thị nếu Backend triển khai cơ chế pending hold có timeout; không thuộc MVP mặc định


Booking có trạng thái riêng pending, confirmed, rejected, cancelled, completed. Không dùng pending như trạng thái của Slot.

Quy tắc MVP trong Backend 2.0: pending chưa giữ slot; chỉ khi Tutor xác nhận thì Backend mới chuyển slot available → booked. Vì vậy, một slot có thể có hơn một booking pending. Frontend không được tự đổi slot thành reserved chỉ vì có yêu cầu pending.
API chính
- POST /api/availability
- GET /api/availability/mine
- PATCH /api/availability/:id
- DELETE /api/availability/:id
- GET /api/tutors/:id/availability?from=&to=
Tiêu chí hoàn thành: Tutor CRUD được slot hợp lệ; Learner chỉ chọn slot Backend trả về là available; xung đột được xử lý bằng response API và tải lại dữ liệu.
9. Giai đoạn 6 – Booking và quản lý buổi học
Mục tiêu: Hoàn thiện hành trình Learner gửi yêu cầu và Tutor xác nhận/từ chối, đồng thời hiển thị trạng thái nhất quán ở cả hai vai trò.
9.1. Tạo booking – Learner
Công việc thực hiện
- Từ hồ sơ Tutor, Learner chọn slot có trạng thái available.
- Nhập ghi chú/mục tiêu buổi học nếu form và Backend hỗ trợ.
- Hiển thị màn hình xác nhận trước khi gửi: Tutor, ngày giờ, timezone, thời lượng, giá và ghi chú.
- Gửi POST /api/bookings.
- Chỉ hiển thị gửi yêu cầu thành công khi Backend xác nhận và trả booking.
- Khi response báo slot không còn khả dụng/xung đột (409 nếu API contract chọn mã này), hiển thị thông báo và tải lại lịch.
9.2. Xử lý booking – Tutor
Công việc thực hiện
- Hiển thị danh sách booking pending của Tutor.
- Xem chi tiết Learner, thời gian, thời lượng, ghi chú và giá snapshot theo dữ liệu Backend cho phép.
- Có nút xác nhận/từ chối khi booking ở trạng thái cho phép hành động.
- Khi từ chối, nhập lý do nếu Backend yêu cầu.
- Không cho Tutor xử lý booking không thuộc mình; Backend kiểm tra quyền sở hữu.
- Nếu hai Tutor action hoặc hai thao tác xác nhận cạnh tranh gây xung đột, hiển thị kết quả Backend và tải lại booking/lịch.
9.3. Lịch sử và trạng thái booking
Các trạng thái cần hỗ trợ:
Status	Ý nghĩa giao diện
pending	Đang chờ Tutor xử lý
confirmed	Đã xác nhận
rejected	Gia sư từ chối
cancelled	Booking đã hủy
completed	Buổi học hoàn thành


Frontend cần:
- Tách tab/danh sách theo trạng thái nếu hữu ích.
- Hiển thị lý do từ chối/hủy khi Backend trả về.
- Hiển thị thời điểm tạo, xác nhận, hủy và hoàn thành nếu có.
- Chỉ hiển thị nút hủy cho người dùng/booking đủ điều kiện theo policy Backend.
- Chỉ hiển thị thao tác hoàn tất nếu Backend quy định rõ actor và endpoint cho phép.
- Cập nhật danh sách slot sau confirm/cancel/reject và sau mọi thay đổi booking có ảnh hưởng khả dụng.
- Không tự chuyển trạng thái theo đồng hồ Frontend.
9.4. Quy tắc quan trọng khi pending chưa chiếm slot
Trong MVP theo Backend 2.0:
1. Learner gửi booking → booking pending.
2. Slot vẫn có thể ở trạng thái available cho tới khi có booking được xác nhận.
3. Tutor xác nhận booking → Backend thực hiện atomic/transaction cập nhật booking confirmed và slot booked.
4. Nếu một booking khác đã chiếm slot trước, thao tác xác nhận thất bại; Frontend cần hiển thị thông báo xung đột và tải lại dữ liệu.
5. Nếu Backend tự chuyển các yêu cầu pending còn lại sang cancelled với lý do slot_already_booked, Frontend hiển thị đúng trạng thái và lý do đó.
Không giả định rằng tạo booking pending đã khóa slot. Nếu nhóm thay đổi sang cơ chế pending hold, phải cập nhật cả Backend và Frontend, gồm reserved, thời hạn giữ chỗ và trạng thái hết hạn.
API chính
- POST /api/bookings
- GET /api/bookings/me
- GET /api/bookings/:id
- PATCH /api/bookings/:id/confirm
- PATCH /api/bookings/:id/reject
- PATCH /api/bookings/:id/cancel
- PATCH /api/bookings/:id/complete (chỉ hiển thị khi Backend xác định quyền thực hiện)
Không sử dụng endpoint tổng quát PATCH /api/bookings/:id/status để Frontend tự gửi bất kỳ status nào.

Tiêu chí hoàn thành: Một booking có trạng thái nhất quán ở cả hai phía; UI không báo thành công trước API; không thể thao tác sai role hoặc chuyển trạng thái ngoài state machine.
10. Giai đoạn 7 – Google Calendar, Notification và Review
Mục tiêu: Giúp hai bên theo dõi buổi học đã xác nhận, nhận thông báo thay đổi và đánh giá sau khi buổi học hoàn thành.
10.1. Google Calendar
Công việc thực hiện
- Xây dựng khu vực kết nối/ngắt kết nối Google Calendar.
- Khi người dùng nhấn Kết nối, điều hướng tới luồng OAuth do Backend khởi tạo qua GET /api/calendar/oauth.
- Backend có thể redirect thẳng tới Google hoặc trả authorization URL; Frontend phải triển khai theo response/API contract thực tế.
- Google redirect về callback Backend (GET /api/calendar/oauth/callback). Đây là callback phía Backend, không phải endpoint mà component UI gọi để tự đổi code lấy token.
- Sau callback, Backend chuyển người dùng về Frontend với trạng thái thành công/thất bại an toàn; Frontend hiển thị kết quả và gọi lại API status.
- Hiển thị trạng thái kết nối lấy từ GET /api/calendar/status.
- Cho phép ngắt kết nối bằng POST /api/calendar/disconnect.
- Hiển thị trạng thái đồng bộ theo từng booking/user nếu API cung cấp.
- Cho phép thử lại đồng bộ qua POST /api/calendar/sync/retry nếu Backend bật chức năng này.
- Không yêu cầu Frontend lưu hoặc đọc Google access token/refresh token.
Trạng thái CalendarSync
Trạng thái	Hiển thị
not_connected	Chưa kết nối Google Calendar
pending	Đang chờ đồng bộ
synced	Đã đồng bộ
failed	Đồng bộ thất bại; có thể thử lại nếu Backend cho phép
cancelled	Event đã được hủy/xóa theo booking


Lỗi Google Calendar không được làm Frontend thông báo booking bị hủy hoặc không được xác nhận nếu Backend đã xác nhận booking thành công.
10.2. Notification
Công việc thực hiện
- Tạo notification center và badge số thông báo chưa đọc.
- Hiển thị thông báo booking mới, xác nhận, từ chối, hủy và thay đổi trạng thái liên quan.
- Hiển thị thời điểm tạo và trạng thái đã đọc/chưa đọc.
- Cho phép đánh dấu một thông báo đã đọc hoặc đánh dấu tất cả đã đọc nếu API hỗ trợ.
- Nhấn notification có thể điều hướng đến booking/profile phù hợp theo resourceType và resourceId Backend trả về.
- Không tự tạo thông báo nghiệp vụ khi chưa có event/response đáng tin cậy từ Backend.
API đề xuất cần thống nhất bổ sung trong Backend:
- GET /api/notifications
- PATCH /api/notifications/:id/read
- PATCH /api/notifications/read-all
Cơ chế cập nhật có thể dùng REST polling ở phiên bản đầu; chỉ tích hợp Socket.IO/WebSocket khi Backend có event contract và yêu cầu realtime rõ ràng. Không tự giả định notification realtime đã có.
10.3. Review
Công việc thực hiện
- Hiển thị rating trung bình và số review hợp lệ trên hồ sơ Tutor nếu Backend trả về.
- Hiển thị danh sách Review từ GET /api/tutors/:id/reviews.
- Chỉ hiển thị form tạo Review cho Learner có booking completed và được Backend xác nhận đủ điều kiện.
- Gửi review qua POST /api/reviews.
- Hiển thị validation, trạng thái gửi thành công và lỗi trùng review.
- Không cho Frontend tự tính hoặc cập nhật ratingSummary.
API chính
- GET /api/calendar/status
- GET /api/calendar/oauth
- GET /api/calendar/oauth/callback (Google redirect tới Backend; không phải thao tác fetch thông thường của UI)
- POST /api/calendar/disconnect
- POST /api/calendar/sync/retry (nếu triển khai retry thủ công)
- GET /api/notifications (đề xuất bổ sung)
- PATCH /api/notifications/:id/read (đề xuất bổ sung)
- PATCH /api/notifications/read-all (đề xuất bổ sung)
- POST /api/reviews
- GET /api/tutors/:id/reviews
Tiêu chí hoàn thành: Người dùng phân biệt được trạng thái kết nối và đồng bộ; lỗi Calendar không làm sai booking; chỉ review đúng điều kiện mới được gửi; Notification hiển thị theo dữ liệu Backend.
11. Giai đoạn 8 – Admin, kiểm thử và hoàn thiện
Mục tiêu: Hoàn thiện màn hình quản trị, kiểm thử tích hợp và chuẩn bị Frontend cho môi trường staging/deploy.
11.1. Admin
Công việc thực hiện
- Dashboard tổng quan dựa trên API thống kê Backend cung cấp.
- Quản lý người dùng: tìm kiếm, lọc, phân trang và thay đổi trạng thái theo quyền.
- Quản lý hồ sơ Tutor: xem hồ sơ pending, duyệt/từ chối, xem lý do và lịch sử trạng thái nếu có.
- Quản lý Taxonomy/Tag: tạo, cập nhật, bật/tắt active; không hiển thị thao tác xóa cứng nếu Backend không hỗ trợ.
- Tra cứu booking theo status, Tutor, Learner và khoảng thời gian.
- Xem Review và trạng thái Calendar sync nếu Backend có API tương ứng.
- Xác nhận thao tác nhạy cảm bằng dialog; hiển thị kết quả theo response API.
- Không cho Admin UI truy cập dữ liệu/endpoint vượt quyền mà Backend quy định.
API Admin chính
- GET /api/admin/users
- PATCH /api/admin/users/:id/status
- GET /api/admin/tutors?approvalStatus=pending
- PATCH /api/admin/tutors/:id/approval
- POST /api/admin/taxonomies
- PATCH /api/admin/taxonomies/:id
- GET /api/admin/bookings
- GET /api/admin/reviews (chỉ khi Backend triển khai)
- GET /api/admin/calendar-sync (chỉ khi Backend triển khai)
11.2. Kiểm thử Frontend
- Kiểm thử responsive và accessibility cơ bản.
- Kiểm thử validation form, câu hỏi phụ thuộc và lưu nháp onboarding.
- Kiểm thử route guard cho ba vai trò.
- Kiểm thử trạng thái token hết hạn, refresh thất bại và đăng xuất.
- Kiểm thử danh sách loading/error/empty/success.
- Kiểm thử filter kết hợp, sort và pagination.
- Kiểm thử thứ tự recommendation không bị Frontend tự sắp xếp lại ngoài quy tắc sản phẩm.
- Kiểm thử slot vừa bị xác nhận bởi người khác và response xung đột.
- Kiểm thử booking pending không bị hiển thị nhầm thành slot reserved.
- Kiểm thử API trả 403, 404, 409, 422, 429 và 5xx.
- Kiểm thử OAuth callback thành công/thất bại và trạng thái Calendar.
- Kiểm thử Review chỉ hiển thị khi đủ điều kiện.
- Kiểm thử các thao tác Admin và xác nhận hành động nhạy cảm.
11.3. Tối ưu và triển khai
- Lazy load route/page theo feature.
- Debounce ô tìm kiếm và tránh gọi API lặp.
- Cache dữ liệu taxonomy phù hợp; làm mới khi Admin cập nhật danh mục theo chiến lược cache.
- Tối ưu ảnh và kích thước asset.
- Kiểm tra biến môi trường VITE_API_BASE_URL cho local/staging/production.
- Không commit secret hoặc token vào repository.
- Kiểm tra CORS/cookie credentials theo cấu hình Backend nếu dùng cookie.
- Chuẩn bị bản build và kiểm thử xuyên suốt trên staging.
Đầu ra
- Các màn hình Admin thiết yếu.
- Các luồng chính hoạt động với API Backend.
- Bộ kiểm thử tích hợp và danh sách lỗi đã xử lý.
- Bản Frontend có thể build/deploy theo môi trường.
Tiêu chí hoàn thành: Các luồng cốt lõi chạy xuyên suốt trên staging với dữ liệu thật từ Backend; trạng thái giao diện khớp trạng thái nghiệp vụ; không còn lỗi phân quyền cơ bản.
12. Luồng Frontend tổng thể
12.1. Learner
Đăng ký → Đăng nhập → Onboarding Learner 28 câu → Lưu nhu cầu → Xem gợi ý/tìm kiếm gia sư → Xem hồ sơ → Xem AvailabilitySlot → Chọn slot → Gửi Booking pending → Theo dõi kết quả Tutor xác nhận/từ chối → Khi confirmed, theo dõi Calendar sync → Sau buổi học completed, gửi Review.
12.2. Tutor
Đăng ký → Đăng nhập → Onboarding Tutor 28 câu → Hoàn thiện TutorProfile → Gửi hồ sơ duyệt → Theo dõi pending/approved/rejected → Khi approved, khai báo AvailabilitySlot → Nhận Booking pending → Confirm/reject/cancel theo policy → Theo dõi lịch dạy và Calendar sync → Nhận Review.
12.3. Admin
Đăng nhập → Quản lý tài khoản → Duyệt TutorProfile → Quản lý Taxonomy → Tra cứu Booking/Review/Calendar sync theo API và quyền được cấp.
13. API Contract Frontend – Backend
Bảng dưới đây là danh sách endpoint đề xuất đồng bộ với Backend Roadmap 2.0. Tên endpoint, method, request/response và quyền cụ thể cần được chốt trong API contract trước khi tích hợp.
Module	Method	Endpoint	Quyền chính	Mục đích
Auth	POST	/api/auth/register	Public	Đăng ký
Auth	POST	/api/auth/login	Public	Đăng nhập
Auth	POST	/api/auth/refresh	Theo cơ chế refresh	Làm mới phiên
Auth	POST	/api/auth/logout	Người dùng có phiên	Đăng xuất/revoke phiên
Auth	GET	/api/auth/me	Đăng nhập	Lấy tài khoản hiện tại
Questionnaire	GET	/api/questionnaires/:role	Theo cấu hình	Lấy bộ câu hỏi và version
Taxonomy	GET	/api/taxonomies	Public đọc active	Lấy danh mục
Taxonomy	GET	/api/taxonomies/:id/children	Public đọc active	Lấy danh mục con
Learner	GET	/api/learners/preferences/me	Learner	Lấy nhu cầu của mình
Learner	PUT/PATCH	/api/learners/preferences/me	Learner	Lưu/cập nhật nhu cầu
Learner	POST	/api/learners/preferences/complete	Learner	Hoàn thành onboarding
Tutor	GET	/api/tutors/profile/me	Tutor	Lấy hồ sơ của mình
Tutor	PUT/PATCH	/api/tutors/profile/me	Tutor	Lưu/cập nhật hồ sơ
Tutor	POST	/api/tutors/profile/submit	Tutor	Gửi hồ sơ duyệt
Tutor Search	GET	/api/tutors	Public, dữ liệu giới hạn	Tìm kiếm gia sư
Tutor Detail	GET	/api/tutors/:id	Public, dữ liệu giới hạn	Xem chi tiết gia sư
Admin Tutor	GET	/api/admin/tutors?approvalStatus=pending	Admin	Danh sách chờ duyệt
Admin Tutor	PATCH	/api/admin/tutors/:id/approval	Admin	Duyệt/từ chối
Recommendation	POST	/api/recommendations/tutors	Learner	Lấy gợi ý gia sư
Availability	POST	/api/availability	Tutor	Tạo slot
Availability	GET	/api/availability/mine	Tutor	Lấy slot của mình
Availability	PATCH	/api/availability/:id	Tutor sở hữu slot	Sửa/đóng slot
Availability	DELETE	/api/availability/:id	Tutor sở hữu slot	Xóa slot theo policy
Availability	GET	/api/tutors/:id/availability?from=&to=	Public/Learner theo policy	Xem slot khả dụng
Booking	POST	/api/bookings	Learner	Tạo yêu cầu booking
Booking	GET	/api/bookings/me	Người dùng	Danh sách booking của mình
Booking	GET	/api/bookings/:id	Chủ thể liên quan/Admin	Chi tiết booking
Booking	PATCH	/api/bookings/:id/confirm	Tutor sở hữu booking	Xác nhận
Booking	PATCH	/api/bookings/:id/reject	Tutor sở hữu booking	Từ chối
Booking	PATCH	/api/bookings/:id/cancel	Theo policy	Hủy
Booking	PATCH	/api/bookings/:id/complete	Theo policy	Hoàn tất
Calendar	GET	/api/calendar/status	Người dùng sở hữu kết nối	Trạng thái kết nối/sync
Calendar	GET	/api/calendar/oauth	Người dùng	Bắt đầu OAuth
Calendar	GET	/api/calendar/oauth/callback	Google OAuth callback	Backend nhận redirect từ Google
Calendar	POST	/api/calendar/disconnect	Chủ thể kết nối	Ngắt kết nối
Calendar	POST	/api/calendar/sync/retry	Chủ thể liên quan/theo policy	Thử đồng bộ lại
Review	POST	/api/reviews	Learner đủ điều kiện	Tạo Review
Review	GET	/api/tutors/:id/reviews	Public đọc	Xem Review Tutor
Notification*	GET	/api/notifications	Người dùng	Lấy thông báo
Notification*	PATCH	/api/notifications/:id/read	Chủ thông báo	Đánh dấu đã đọc
Notification*	PATCH	/api/notifications/read-all	Người dùng	Đánh dấu tất cả đã đọc
Admin	GET	/api/admin/users	Admin	Quản lý tài khoản
Admin	PATCH	/api/admin/users/:id/status	Admin	Thay đổi trạng thái tài khoản
Admin	GET	/api/admin/bookings	Admin	Tra cứu booking
Admin*	GET	/api/admin/reviews	Admin	Tra cứu Review nếu triển khai
Admin*	GET	/api/admin/calendar-sync	Admin	Theo dõi đồng bộ nếu triển khai


* Notification và một số API báo cáo/giám sát là phần cần Backend bổ sung hoặc xác nhận trước khi Frontend tích hợp. Không được xem chúng là endpoint đã tồn tại nếu chưa triển khai.
14. Quy tắc trạng thái cần tuân thủ
14.1. TutorProfile approval
Backend status	Giao diện
draft	Hồ sơ nháp/chưa gửi
pending	Đang chờ duyệt
approved	Đã duyệt
rejected	Bị từ chối; hiển thị lý do nếu có


Chỉ approved mới được xem là gia sư đủ điều kiện xuất hiện trong tìm kiếm/gợi ý công khai theo Backend.
14.2. AvailabilitySlot
Backend status	Giao diện
available	Có thể gửi yêu cầu đặt
booked	Đã được booking xác nhận chiếm
closed	Đã đóng
reserved	Chỉ dùng nếu triển khai pending hold có timeout


14.3. Booking
Backend status	Giao diện
pending	Chờ gia sư xử lý
confirmed	Đã xác nhận
rejected	Bị từ chối
cancelled	Đã hủy
completed	Đã hoàn thành


14.4. CalendarSync
Backend status	Giao diện
not_connected	Chưa kết nối
pending	Đang đồng bộ/chờ đồng bộ
synced	Đã đồng bộ
failed	Đồng bộ thất bại
cancelled	Event đã hủy/xóa theo booking


14.5. User
Backend status	Giao diện
active	Tài khoản hoạt động
locked	Tài khoản tạm khóa
disabled	Tài khoản vô hiệu hóa


Frontend chỉ trình bày và phản ứng theo trạng thái Backend trả về; không tự đặt trạng thái mới hoặc suy luận chuyển trạng thái.
15. Checklist nghiệm thu Frontend
Auth và onboarding
- [ ] Phân biệt đúng ba vai trò Learner, Tutor và Admin.
- [ ] Đăng ký/đăng nhập/đăng xuất hoạt động với API.
- [ ] Xử lý access token hết hạn và refresh theo contract.
- [ ] Learner tải và trả lời đúng questionnaire 28 câu.
- [ ] Tutor tải và trả lời đúng questionnaire 28 câu.
- [ ] Q1 → Q2 → Q3 hiển thị đúng theo dependency Backend.
- [ ] Giới hạn single/multi-select đúng metadata.
- [ ] Lưu nháp, tải lại và tiếp tục không mất dữ liệu.
- [ ] Hiển thị đúng questionnaireVersion và completionStatus.
- [ ] Không cho role này chỉnh profile của role khác.
Hồ sơ và tìm kiếm
- [ ] Tutor xem/cập nhật được hồ sơ của mình.
- [ ] Tutor gửi hồ sơ và theo dõi approval status.
- [ ] Admin duyệt/từ chối được hồ sơ theo API.
- [ ] Learner tìm kiếm, lọc, sort và phân trang gia sư.
- [ ] Chỉ dữ liệu public được hiển thị.
- [ ] Không hiển thị Tutor chưa được duyệt như gia sư công khai đủ điều kiện.
Recommendation
- [ ] Gọi đúng POST /api/recommendations/tutors.
- [ ] Không gửi learnerId để giả định danh tính người dùng.
- [ ] Hiển thị đúng thứ tự Backend trả về.
- [ ] Hiển thị matchScore, scoreBreakdown, matchedReasons và algorithmVersion nếu có.
- [ ] Không tự tính điểm hoặc tự sắp xếp lại kết quả.
- [ ] Có trạng thái chưa đủ dữ liệu/không có kết quả/lỗi API.
Availability và Booking
- [ ] Tutor CRUD được AvailabilitySlot.
- [ ] Learner chỉ chọn slot available.
- [ ] Không nhầm pending Booking với reserved Slot.
- [ ] Booking chỉ chuyển trạng thái theo response Backend.
- [ ] Dùng API confirm/reject/cancel riêng, không gửi status tùy ý.
- [ ] Xử lý xung đột khi slot vừa được người khác xác nhận.
- [ ] Hiển thị đúng các trạng thái pending/confirmed/rejected/cancelled/completed.
- [ ] Cập nhật lại lịch trống sau các hành động có ảnh hưởng slot.
Calendar, Notification và Review
- [ ] Bắt đầu OAuth qua Backend; Frontend không giữ Google token.
- [ ] Phân biệt trạng thái kết nối Calendar và trạng thái sync.
- [ ] Lỗi Calendar không làm thay đổi booking đã xác nhận.
- [ ] Notification lấy từ Backend; endpoint bổ sung đã được chốt nếu sử dụng.
- [ ] Chỉ Learner đủ điều kiện mới thấy form Review.
- [ ] Rating summary lấy từ Backend.
Admin và chất lượng
- [ ] Admin quản lý user, Tutor approval, Taxonomy và booking theo quyền.
- [ ] Có loading/error/empty/success state.
- [ ] Có responsive cơ bản và accessibility cơ bản.
- [ ] Có kiểm thử tích hợp các vai trò và tình huống xung đột slot.
- [ ] API client xử lý các lỗi HTTP và không log secret/token.
- [ ] Build thành công với biến môi trường theo môi trường triển khai.
16. Thứ tự ưu tiên và các quyết định cần chốt
16.1. Thứ tự triển khai đồng bộ với Backend 2.0
Ưu tiên	Frontend	Backend tương ứng
P0 – Nền tảng	React app, layout, API client, Auth, route guard	Express, MongoDB, Auth, middleware, error handling
P1 – Dữ liệu gốc	Questionnaire UI, onboarding 28 câu, profile forms	Taxonomy, Questionnaire version, LearnerPreference, TutorProfile
P2 – Tutor discovery	Danh sách/chi tiết gia sư, filter, trạng thái duyệt	Admin approval, Tutor Search
P2 – Recommendation	Form nhu cầu/bộ lọc bổ sung, trang kết quả gợi ý	Content-based Filtering, score breakdown, matched reasons
P3 – Booking core	Calendar/TimeSlot, tạo và theo dõi booking	Availability CRUD, Booking state machine, chống đặt trùng
P4 – Tích hợp	Calendar, Notification, Review	Google Calendar service, notification events/API, Review
P5 – Vận hành	Admin dashboard, test, responsive, tối ưu	Admin API, logging, monitoring, backup, deploy


Có thể phát triển Availability song song với Recommendation sau khi TutorProfile và Taxonomy ổn định. Booking chỉ nên tích hợp sau khi hai nhóm thống nhất state machine và quy tắc chiếm slot.
16.2. Các quyết định nhóm cần chốt trước khi tích hợp
1. Auth token: Access token được lưu và gửi theo cách nào? Refresh token dùng cookie HttpOnly hay cơ chế khác? Quy tắc refresh/logout cụ thể ra sao?
2. Profile update: Chọn PUT hay PATCH làm phương thức chuẩn cho cập nhật từng phần LearnerPreference/TutorProfile?
3. Questionnaire metadata: API questionnaire trả đầy đủ loại input, required, maxSelections, dependency và option ID hay Frontend cần giữ một phần cấu hình tĩnh?
4. Taxonomy: Các câu Q1/Q2/Q3 và các nhóm teaching style/material/support dùng chung ID và phân cấp như thế nào?
5. Ngôn ngữ giảng dạy: Có bổ sung câu hỏi riêng về ngôn ngữ Tutor dùng để hướng dẫn Learner không?
6. Offline location: Learner có khai báo khu vực không? Nếu chưa, Frontend không hiển thị tính năng matching khoảng cách.
7. Giá và thời lượng: Ngân sách và học phí tính theo buổi hay theo 60 phút? Giá được hiển thị và snapshot khi booking theo quy tắc nào?
8. Chứng chỉ: Có yêu cầu upload minh chứng và hiển thị trạng thái verified không? Frontend cần API upload nào?
9. Pending booking: MVP chọn pending chưa chiếm slot; nếu đổi sang pending hold thì cả hai roadmap phải cập nhật reserved và holdExpiresAt.
10. Booking complete: Ai có quyền chuyển booking sang completed, Tutor, Learner hay hệ thống? Chỉ hiển thị action khi Backend chốt.
11. Google OAuth: GET /api/calendar/oauth redirect trực tiếp hay trả authorization URL? Callback Backend chuyển về Frontend URL nào và kèm trạng thái gì?
12. Notification: Có triển khai REST polling trước hay Socket.IO? Chốt payload, unread count và resource link.
13. Review: Một booking tạo tối đa một review hay cho phép chỉnh sửa/phản hồi? Chốt các trường form.
14. Admin dashboard: Những chỉ số nào được Backend cung cấp qua API? Không tự tính báo cáo từ dữ liệu không được phép truy cập.
15. API response/error: Chốt envelope response, pagination metadata, error code và cách biểu diễn lỗi validation/conflict.
16. Recommendation: Thống nhất công thức trọng số 30/20/15/10/10/5/5/5, cách hiển thị điểm và version thuật toán trước khi nghiệm thu.
17. Cấu trúc thư mục Frontend đề xuất
Cấu trúc sau giữ định hướng features trong roadmap gốc và bổ sung các feature cần thiết cho onboarding, taxonomy, notification và review. Có thể điều chỉnh theo repository hiện tại; không tạo folder/module trùng nếu đã tồn tại.
client/
├── public/
└── src/
    ├── assets/
    ├── components/
    │   ├── common/
    │   ├── forms/
    │   ├── feedback/
    │   └── layout/
    ├── features/
    │   ├── auth/
    │   ├── questionnaire/
    │   ├── learner/
    │   ├── tutor/
    │   ├── taxonomy/
    │   ├── recommendation/
    │   ├── availability/
    │   ├── booking/
    │   ├── calendar/
    │   ├── notification/
    │   ├── review/
    │   └── admin/
    ├── layouts/
    ├── hooks/
    ├── services/
    │   ├── apiClient.js
    │   └── ...
    ├── contexts/              # hoặc store/ nếu dùng Zustand
    ├── routes/
    ├── utils/
    ├── constants/
    ├── App.jsx
    └── main.jsx
Kết luận
Roadmap Frontend phiên bản 2.0 được sắp xếp lại để đồng bộ với Backend Roadmap 2.0. Các thay đổi trọng tâm gồm:
- Đưa onboarding 28 câu hỏi của Learner và Tutor thành phần triển khai chính thức, có lưu nháp, version và tiến độ.
- Dùng LearnerPreference, TutorProfile và Taxonomy chung theo API Backend.
- Bổ sung quy trình Tutor gửi hồ sơ và theo dõi Admin approval.
- Đưa Recommendation lên trước Availability/Booking trong thứ tự ưu tiên, phù hợp với thứ tự dữ liệu gốc → Tutor discovery → gợi ý của Backend.
- Đồng bộ công thức Recommendation 8 nhóm tiêu chí ở mức hiển thị; Frontend không tự tính điểm.
- Tách rõ trạng thái AvailabilitySlot và Booking; MVP pending chưa chiếm slot.
- Dùng endpoint confirm/reject/cancel/complete riêng thay cho endpoint cập nhật status tổng quát.
- Điều chỉnh OAuth Calendar theo luồng Backend; Frontend không lưu Google refresh token.
- Bổ sung Review, Notification và Admin API; đánh dấu rõ những API cần Backend xác nhận/bổ sung.
Thứ tự triển khai đề xuất: Nền tảng/Auth → Questionnaire/Taxonomy/Onboarding → Tutor Profile/Approval/Search → Recommendation → Availability → Booking → Calendar/Notification/Review → Admin/Testing/Deployment.
Trước khi bắt đầu tích hợp, hai nhóm cần chốt API contract gồm method, URL, request body, response body, error code, enum trạng thái, pagination và quyền truy cập. Đây là điều kiện để Frontend và Backend phát triển độc lập mà không lệch dữ liệu hoặc nghiệp vụ.