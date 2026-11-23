---
title: "ROADMAP BACKEND – TUTOR BOOKING WEBSITE"
subtitle: "Nền tảng kết nối Học viên – Gia sư | Node.js + Express + MongoDB"
author: "Bản chỉnh sửa đề xuất"
date: "20/11/2026"
lang: vi-VN
---

**Phiên bản tài liệu:** 2.0 – Bản chỉnh sửa đề xuất  
**Phạm vi:** Backend, dữ liệu onboarding 28 câu hỏi, tìm kiếm/gợi ý gia sư, lịch rảnh, booking và tích hợp Google Calendar.

> **Lưu ý về phạm vi:** Đây là roadmap và thiết kế kỹ thuật đề xuất dựa trên roadmap backend ban đầu cùng hai bộ câu hỏi 28 câu dành cho Learner và Tutor. Các schema, endpoint, trọng số và quy tắc được mô tả là mục tiêu triển khai; không mặc định rằng tất cả chức năng đã tồn tại trong mã nguồn.

**Cấu trúc tài liệu:** Tổng quan → luồng nghiệp vụ → mapping 28 câu hỏi → kiến trúc Backend → thiết kế MongoDB → các giai đoạn triển khai → trạng thái nghiệp vụ → API → kiểm thử → thứ tự ưu tiên → quyết định cần chốt.

# Tổng quan phạm vi Backend

## Mục tiêu

Backend chịu trách nhiệm quản lý nghiệp vụ và dữ liệu của nền tảng, bao gồm:

- Quản lý tài khoản, xác thực JWT và phân quyền theo vai trò `learner`, `tutor`, `admin`.
- Quản lý onboarding và lưu câu trả lời của hai bộ câu hỏi 28 câu.
- Quản lý danh mục lĩnh vực, môn học, chuyên môn, trình độ và các tag dùng chung.
- Quản lý hồ sơ nhu cầu học tập của Learner và hồ sơ năng lực giảng dạy của Tutor.
- Tìm kiếm, lọc và gợi ý gia sư bằng Content-based Filtering.
- Quản lý khung giờ có thể dạy, kiểm tra khả dụng và chống đặt trùng.
- Quản lý vòng đời booking giữa Learner và Tutor.
- Quản lý đánh giá sau buổi học hoàn thành.
- Tích hợp Google Calendar để đồng bộ các booking đã xác nhận.
- Cung cấp chức năng Admin, logging, kiểm thử và vận hành.

\newpage

## Vai trò người dùng

| Vai trò | Quyền và trách nhiệm chính |
|---|---|
| `learner` | Tạo/cập nhật nhu cầu học tập; tìm kiếm và nhận gợi ý gia sư; xem lịch rảnh; tạo, theo dõi và hủy booking theo chính sách; đánh giá sau buổi học hoàn thành. |
| `tutor` | Tạo/cập nhật hồ sơ năng lực; khai báo môn và nội dung có thể dạy; quản lý lịch rảnh; xác nhận/từ chối/hủy booking theo chính sách; kết nối Google Calendar. |
| `admin` | Quản lý người dùng; duyệt/từ chối hồ sơ gia sư; quản lý taxonomy/tag; tra cứu booking, review và trạng thái tích hợp. |

Một tài khoản có một vai trò chính trong phiên bản đầu. Nếu sau này cho phép một người vừa học vừa dạy, cần thiết kế nhiều profile theo vai trò thay vì thay đổi role tùy tiện trên cùng một hồ sơ.

## Nguyên tắc nghiệp vụ cốt lõi

1. **Backend là nguồn dữ liệu có thẩm quyền:** Frontend không tự quyết định trạng thái slot, booking, trạng thái duyệt hồ sơ hoặc điểm đánh giá.
2. **Tách nhu cầu và lịch thực tế:** Câu trả lời về thời gian mong muốn của Learner và khả năng nhận lớp chung của Tutor chỉ là `schedulePreferences`. Lịch có thể đặt phải lấy từ `AvailabilitySlot`.
3. **Tách tài khoản và hồ sơ:** Không lưu toàn bộ 28 câu hỏi trong `User`. Dữ liệu onboarding phải nằm trong `LearnerPreference` hoặc `TutorProfile`.
4. **Dùng danh mục chuẩn:** Những dữ liệu cần đối chiếu như lĩnh vực, môn, chuyên môn, cấp độ, phương pháp và hình thức dạy phải dùng ID/enum thống nhất, không so khớp văn bản tự do.
5. **Không xây dựng bộ lập lịch tối ưu:** Hệ thống chỉ kiểm tra trùng giờ, trạng thái slot, điều kiện booking và khả năng tương thích thời gian; không tự động xếp lịch tối ưu.
6. **Gợi ý không dùng Machine Learning:** Phiên bản đầu dùng Content-based Filtering, công thức có trọng số và quy tắc có thể giải thích.
7. **Google Calendar là tích hợp phụ trợ:** Lỗi đồng bộ lịch không được làm rollback một booking đã xác nhận hợp lệ.
8. **Bảo vệ dữ liệu cá nhân:** Không trả mật khẩu hash, refresh token, access token Google hoặc dữ liệu riêng tư không cần thiết về Frontend.

# Luồng nghiệp vụ tổng thể

## Đăng ký và onboarding

1. Người dùng đăng ký tài khoản và chọn vai trò `learner` hoặc `tutor`.
2. Backend xác thực dữ liệu, chuẩn hóa email, hash mật khẩu và tạo `User`.
3. Người dùng đăng nhập và nhận phiên xác thực.
4. Frontend tải bộ câu hỏi tương ứng với vai trò và phiên bản questionnaire hiện hành.
5. Người dùng trả lời câu hỏi; có thể lưu tiến độ nếu chưa hoàn thành.
6. Backend kiểm tra câu bắt buộc, kiểu dữ liệu, số lượng lựa chọn và quan hệ câu hỏi phụ thuộc.
7. Backend chuẩn hóa câu trả lời thành cấu trúc dữ liệu có kiểu và lưu vào profile tương ứng.
8. Learner có thể sử dụng tìm kiếm/gợi ý khi hoàn thành các trường tối thiểu cần thiết.
9. Tutor gửi hồ sơ để Admin duyệt; chỉ hồ sơ `approved` mới xuất hiện trong tập gia sư được tìm kiếm/gợi ý.

## Luồng gia sư tạo hồ sơ và lịch dạy

1. Tutor hoàn thành bộ câu hỏi và thông tin hồ sơ.
2. Backend lưu dữ liệu vào `TutorProfile`, đặt `approvalStatus = pending` nếu cần Admin duyệt.
3. Admin kiểm tra thông tin và chứng chỉ; cập nhật `approved` hoặc `rejected` kèm lý do.
4. Tutor đã được duyệt khai báo từng `AvailabilitySlot` cụ thể.
5. Backend kiểm tra thời gian bắt đầu/kết thúc, thời điểm quá khứ, timezone và trùng slot.
6. Slot hợp lệ được hiển thị cho Learner.

## Luồng gợi ý gia sư

1. Learner đăng nhập.
2. Backend lấy `LearnerPreference` của chính người dùng từ access token; không tin `learnerId` do client tự gửi.
3. Backend kiểm tra profile đã đủ dữ liệu tối thiểu.
4. Recommendation Service lọc tập Tutor hợp lệ: tài khoản active, hồ sơ approved và đáp ứng các điều kiện bắt buộc.
5. Service tính điểm tương đồng theo các nhóm tiêu chí đã định nghĩa.
6. Backend sắp xếp kết quả, áp dụng tie-breaker và tạo `matchedReasons`.
7. API trả danh sách gia sư cùng `matchScore`, điểm thành phần và lý do gợi ý.
8. Khi Learner xem lịch, Backend truy vấn `AvailabilitySlot` thực tế; không coi schedule preference là lịch có thể đặt.

## Luồng booking

1. Learner chọn Tutor và một slot đang khả dụng.
2. Frontend gửi yêu cầu tạo booking.
3. Backend kiểm tra quyền, slot, Tutor, thời gian, thời lượng, khả dụng và quy tắc đặt lịch.
4. Booking được tạo ở trạng thái `pending`.
5. Tutor xác nhận hoặc từ chối.
6. Khi Tutor xác nhận, Backend thực hiện thao tác atomic/transaction để chuyển slot từ `available` sang `booked` và booking từ `pending` sang `confirmed`.
7. Nếu slot đã được booking khác xác nhận trước đó, thao tác xác nhận phải thất bại an toàn; yêu cầu còn lại được xử lý thành `cancelled` với lý do hệ thống `slot_already_booked` hoặc trạng thái tương đương đã thống nhất.
8. Sau sự kiện `confirmed`, hệ thống phát tác vụ thông báo và Google Calendar sync.
9. Sau buổi học, booking chuyển `completed`; Learner đủ điều kiện mới được tạo Review.

## Luồng Google Calendar

1. Người dùng chủ động kết nối Google Calendar bằng OAuth Authorization Code Flow.
2. Backend lưu token đã mã hóa; không gửi token về client.
3. Khi booking được xác nhận, Calendar Service tạo event cho từng bên đã kết nối.
4. Mỗi event được ghi nhận theo `bookingId + userId` để chống tạo trùng.
5. Khi booking đổi hoặc bị hủy, hệ thống cập nhật/xóa event theo chính sách.
6. Nếu Google API lỗi, booking vẫn giữ trạng thái hợp lệ; lưu trạng thái đồng bộ và cho phép retry.

# Thiết kế bộ câu hỏi Learner/Tutor và dữ liệu chuẩn hóa

## Nguyên tắc thiết kế

Hai bộ câu hỏi đều có 28 câu nhưng không phải câu nào cũng là tiêu chí chấm điểm trực tiếp. Backend cần phân loại mỗi trường theo một trong các nhóm:

- **Hard filter:** điều kiện bắt buộc để một Tutor được xem là ứng viên, ví dụ hồ sơ đã duyệt, đúng lĩnh vực/môn bắt buộc hoặc chứng chỉ bắt buộc.
- **Scoring feature:** tiêu chí được dùng để tính điểm tương đồng.
- **Preference/tie-breaker:** sở thích hoặc ưu tiên để giải thích, cá nhân hóa hoặc sắp xếp khi điểm gần bằng nhau.
- **Operational data:** dữ liệu phục vụ onboarding, lịch, booking hoặc vận hành chứ không phải nội dung chấm điểm.
- **Free text:** lưu và hiển thị; không tự động suy diễn trong phiên bản đầu.

## Mapping 28 câu hỏi

| Nhóm/câu | Learner – Tutor | Trường Backend đề xuất | Vai trò trong hệ thống |
|---|---|---|---|
| Lĩnh vực (Q1–Q1) | Learner: lĩnh vực muốn học. Tutor: lĩnh vực muốn dạy. | `categoryId` | Lọc ứng viên theo lĩnh vực chính; cho phép mở rộng nhiều lĩnh vực nếu sản phẩm thay đổi. |
| Môn học (Q2–Q2) | Learner: nội dung/môn muốn học. Tutor: môn/ngôn ngữ có thể dạy. | `subjectIds[]` | Scoring và lọc theo môn. |
| Chuyên môn (Q3–Q3) | Learner: nội dung chuyên sâu muốn học. Tutor: chuyên môn có thể dạy. | `topicIds[]` | Scoring theo mức khớp tag/chuyên môn. |
| Mục tiêu (Q4–Q4) | Learner: mục đích học. Tutor: mục tiêu có thể hỗ trợ. | `learningPurposes[]` / `supportedPurposes[]` | Scoring theo mục tiêu. |
| Trình độ hiện tại (Q5–Q5) | Learner: trình độ hiện tại. Tutor: trình độ Tutor có thể dạy. | `currentLevel` / `teachableLevels[]` | Điều kiện tương thích đầu vào và scoring. |
| Trình độ mục tiêu (Q6–Q6) | Learner: trình độ muốn đạt. Tutor: trình độ có thể giúp đạt. | `targetLevel` / `supportedTargetLevels[]` | Scoring theo đích học tập. |
| Mục tiêu cụ thể (Q7–Q7) | Learner: mục tiêu tự mô tả/chọn gợi ý. Tutor: nhóm mục tiêu có thể hỗ trợ. | `goalText`, `goalTags[]`, `supportedGoalTags[]` | Lưu mục tiêu; dùng tag chuẩn nếu có. Không NLP trong bản đầu. |
| Thời gian đạt mục tiêu (Q8–Q8) | Learner: thời gian mong muốn. Tutor: thời gian ước lượng. | `targetDuration` / `estimatedDurationRanges[]` | Scoring tham khảo, không cam kết kết quả học. |
| Phương pháp (Q9–Q9) | Learner: phương pháp yêu thích. Tutor: phương pháp giảng dạy. | `preferredMethods[]` / `teachingMethods[]` | Teaching-fit scoring. |
| Tốc độ (Q10–Q10) | Learner: tốc độ mong muốn. Tutor: cách điều chỉnh tốc độ. | `preferredPace` / `teachingPace` | Teaching-fit scoring. |
| Hình thức lớp (Q11–Q11) | Learner: 1–1/nhóm. Tutor: quy mô lớp có thể dạy. | `preferredClassFormat` / `classFormats[]` | Teaching-fit scoring. |
| Phong cách (Q12–Q12) | Cả hai chọn tối đa 3 phong cách/đặc điểm. | `preferredTutorStyles[]` / `teachingStyles[]` | Teaching-fit scoring. |
| Tài liệu (Q13–Q13) | Learner: tài liệu yêu thích. Tutor: tài liệu/công cụ sử dụng. | `preferredMaterials[]` / `teachingMaterials[]` | Teaching-fit scoring. |
| Tương tác (Q14–Q14) | Learner: mức tương tác mong muốn. Tutor: mức tương tác thường tạo ra. | `preferredInteractionLevel` / `interactionLevel` | Teaching-fit scoring. |
| Khung thời gian (Q15–Q15) | Thời gian Learner muốn học và Tutor có thể dạy. | `preferredTimeBands[]` / `availableTimeBands[]` | Sàng lọc tổng quát; không thay AvailabilitySlot. |
| Ngày trong tuần (Q16–Q16) | Ngày Learner muốn học và Tutor có thể nhận lớp. | `preferredWeekdays[]` / `availableWeekdays[]` | Sàng lọc tổng quát; kiểm tra slot thực tế khi booking. |
| Số buổi/tuần (Q17–Q17) | Số buổi Learner cần và sức chứa Tutor. | `desiredSessionsPerWeek` / `maxSessionsPerWeek` | Kiểm tra khả năng đáp ứng và giới hạn tải dạy. |
| Thời lượng (Q18–Q18) | Thời lượng buổi học mong muốn/có thể dạy. | `preferredDurationMinutes[]` / `sessionDurationsMinutes[]` | Chuẩn hóa về phút; kiểm tra slot và thời lượng booking. |
| Hình thức học (Q19–Q19) | Học viên muốn học và Tutor có thể dạy Online/Offline/Kết hợp. | `preferredModes[]` / `teachingModes[]` | Hard filter nếu bắt buộc; nếu không thì scoring. |
| Địa điểm (Q20–Q20) | Loại địa điểm Learner muốn và Tutor có thể dạy. | `preferredOfflineLocations[]` / `offlineLocations[]` | So khớp điều kiện địa điểm; chỉ áp dụng khi Offline. |
| Khu vực (Q20 bổ sung–Q21) | Learner hiện chưa có khu vực; Tutor khai báo khu vực và bán kính nhận dạy. | `learnerArea`, `serviceAreas[]`, `travelRadiusKm` | Cần bổ sung khu vực của Learner nếu muốn tính khoảng cách. |
| Ngân sách/học phí (Q21–Q22) | Ngân sách Learner và học phí Tutor theo buổi. | `budgetMin`, `budgetMax` / `priceMin`, `priceMax`, `isNegotiable` | Scoring; hard filter chỉ khi Learner chọn ngân sách nghiêm ngặt. |
| Ưu tiên (Q22–không có câu đối xứng) | Learner chọn tối đa 3 yếu tố ưu tiên; Tutor không có câu tương ứng. | `selectionPriorities[]` | Tie-breaker/giải thích; không tự đổi trọng số toàn hệ thống ở MVP. |
| Kinh nghiệm (Q23–Q23) | Kinh nghiệm Learner mong muốn và số năm Tutor có. | `requiredExperienceRange` / `experienceYears` | Hard filter nếu bắt buộc; nếu không thì scoring. |
| Chứng chỉ (Q24–Q24) | Mức yêu cầu của Learner và loại bằng cấp/chứng chỉ Tutor có. | `certificateRequirement` / `qualifications[]` | Hard filter khi bắt buộc; cần xác minh chứng chỉ. |
| Khó khăn (Q25–Q25) | Khó khăn của Learner và cách Tutor xử lý. | `learningDifficulties[]` / `supportApproaches[]` | Dùng để cá nhân hóa mức phù hợp. |
| Hỗ trợ (Q26–Q26) | Hỗ trợ Learner cần và hoạt động Tutor có thể thực hiện. | `desiredSupport[]` / `availableSupport[]` | Scoring theo tập tag giao nhau. |
| Theo dõi tiến độ (Q27–Q27) | Tần suất Learner mong muốn và cách Tutor đánh giá. | `progressTrackingPreference` / `assessmentMethods[]` | Scoring/hiển thị cách phối hợp học tập. |
| Mô tả tự do (Q28–Q28) | Learner chia sẻ mong muốn; Tutor giới thiệu kinh nghiệm/thế mạnh. | `additionalNote` / `introduction` | Lưu và hiển thị; không tự suy diễn điểm trong phiên bản đầu. |

## Các điểm cần chuẩn hóa trước khi code

1. **Danh mục phân cấp:** Q1 là lĩnh vực, Q2 là môn/nội dung, Q3 là chuyên môn chi tiết. Nên dùng taxonomy phân cấp với ID ổn định; không so sánh tên hiển thị.
2. **Lựa chọn đơn/nhiều:** Tài liệu hiện ghi rõ Q1 của Learner chọn một lĩnh vực, Q12 chọn tối đa ba, Q22 chọn tối đa ba. Các câu khác cần chốt cụ thể single-select hay multi-select trước khi viết validator.
3. **Ngôn ngữ học và ngôn ngữ giảng dạy:** Q2 của Learner và Q2 của Tutor mô tả môn/ngôn ngữ được học/dạy, không xác định chắc chắn ngôn ngữ Tutor dùng để giải thích. Nếu cần tiêu chí “language of instruction”, nên bổ sung câu riêng cho Learner và Tutor; không được tự suy ra từ môn học.
4. **Địa điểm Offline:** Q20 của Learner chỉ hỏi loại địa điểm, chưa lấy tỉnh/thành hoặc khu vực cụ thể. Q21 của Tutor có khu vực và bán kính. Muốn matching khoảng cách phải bổ sung khu vực mong muốn của Learner, chỉ thu thập mức cần thiết.
5. **Ngân sách:** Cần chốt biên các khoảng giá, đặc biệt lựa chọn “300k” của Learner nên đổi thành “Trên 300.000đ” nếu đó là ý định. Giá của Tutor và ngân sách của Learner phải cùng đơn vị, cùng cách tính (theo buổi hoặc theo 60 phút).
6. **Thời lượng buổi học:** Chuẩn hóa toàn bộ lựa chọn thành số phút. “Linh hoạt” phải là giá trị riêng, không lưu dưới dạng số.
7. **Chứng chỉ:** Q24 của Learner mới hỏi mức yêu cầu, chưa hỏi loại chứng chỉ cụ thể. Nếu yêu cầu bắt buộc một chứng chỉ cụ thể, cần thêm trường/chọn loại chứng chỉ.
8. **Nhiều lĩnh vực:** Q1 đang chọn một lĩnh vực. Nếu Tutor có thể dạy ở nhiều lĩnh vực, cần cho phép thêm lĩnh vực phụ trong hồ sơ hoặc thay đổi rõ quy tắc câu hỏi; không tự lưu nhiều giá trị khi form chỉ cho chọn một.
9. **Số buổi mỗi tuần:** Q17 là nhu cầu và sức chứa tổng quát. Backend phải đếm booking thực tế theo tuần để không vượt giới hạn; không dùng câu trả lời này thay lịch slot.
10. **Q28:** Lưu văn bản tự do, giới hạn độ dài và lọc nội dung đầu vào. Không đưa vào thuật toán NLP/AI trong phiên bản này.

## Lưu phiên bản questionnaire và tiến độ

Mỗi profile nên lưu:

- `questionnaireVersion`: phiên bản bộ câu hỏi.
- `completionStatus`: `not_started`, `in_progress`, `completed`.
- `answeredQuestionIds[]`: danh sách câu đã trả lời nếu cần theo dõi tiến độ.
- `completedAt`, `updatedAt`.
- Dữ liệu đã chuẩn hóa theo schema hiện hành.

Khi thay đổi bộ câu hỏi, tăng version và viết migration hoặc quy tắc đọc tương thích. Không đổi ý nghĩa của một field cũ mà không tăng phiên bản.

# Kiến trúc Backend

## Kiến trúc kỹ thuật

- Runtime: Node.js.
- Web framework: Express.
- Database: MongoDB Atlas.
- ODM: Mongoose.
- Authentication: JWT access token và refresh token theo cơ chế an toàn.
- Validation: thư viện schema validation thống nhất (ví dụ Joi/Zod/express-validator; nhóm chọn một).
- Password hashing: bcrypt hoặc bcryptjs.
- Calendar: Google Calendar API qua OAuth 2.0.
- Testing: unit test và integration test cho service/API quan trọng.

## Cấu trúc module đề xuất

```text
backend/
└── src/
    ├── config/
    │   ├── env.js
    │   └── database.js
    ├── models/
    │   ├── User.js
    │   ├── LearnerPreference.js
    │   ├── TutorProfile.js
    │   ├── Taxonomy.js
    │   ├── AvailabilitySlot.js
    │   ├── Booking.js
    │   ├── Review.js
    │   ├── CalendarConnection.js
    │   ├── CalendarEvent.js
    │   └── RecommendationLog.js
    ├── routes/
    ├── controllers/
    ├── services/
    │   ├── auth/
    │   ├── onboarding/
    │   ├── learner/
    │   ├── tutor/
    │   ├── taxonomy/
    │   ├── recommendation/
    │   ├── availability/
    │   ├── booking/
    │   ├── review/
    │   └── admin/
    ├── middlewares/
    ├── validators/
    ├── integrations/
    │   └── google-calendar/
    ├── jobs/
    ├── events/
    ├── utils/
    ├── constants/
    ├── app.js
    └── server.js
└── tests/
```

Cấu trúc thực tế có thể điều chỉnh theo repository hiện hành. Không tạo thêm module trùng chức năng nếu dự án đã có file tương ứng.

## Luồng xử lý request

`Route → Authentication/Authorization Middleware → Validator → Controller → Service → Model/Repository → Response`.

- Route chỉ khai báo endpoint và middleware.
- Middleware xác thực, phân quyền và kiểm tra quyền sở hữu.
- Validator kiểm tra dữ liệu request.
- Controller nhận request, gọi service và chuẩn hóa response.
- Service chứa nghiệp vụ; không đặt thuật toán gợi ý hoặc logic booking trực tiếp trong controller.
- Model định nghĩa schema, index và quan hệ dữ liệu.
- Integration service xử lý API bên thứ ba, đặc biệt Google Calendar.

## Quy ước API

- Prefix thống nhất: `/api`.
- Dùng JSON và HTTP status code đúng ý nghĩa.
- Endpoint riêng tư phải xác thực JWT.
- Kiểm tra role và quyền sở hữu tài nguyên ở Backend.
- Phân trang dùng `page`, `limit`; sắp xếp dùng `sortBy`, `sortOrder` có whitelist.
- Không trả stack trace hoặc secret trong response production.
- Response lỗi thống nhất, ví dụ `{ success: false, code, message, details }`.

# Thiết kế dữ liệu MongoDB

## Các collection chính

| Collection | Nội dung | Quan hệ/chú ý |
|---|---|---|
| `users` | Tài khoản, email, passwordHash, role, status | Một User có tối đa một LearnerPreference hoặc TutorProfile theo role trong phiên bản đầu. |
| `learnerPreferences` | Câu trả lời và nhu cầu học tập đã chuẩn hóa | `userId` unique; lưu questionnaireVersion và completionStatus. |
| `tutorProfiles` | Năng lực, môn dạy, phương pháp, mức giá, kinh nghiệm, chứng chỉ, trạng thái duyệt | `userId` unique; chỉ profile approved được public/recommend. |
| `taxonomies` | Category, subject, topic và danh mục chuẩn | ID dùng chung giữa Learner và Tutor; có parentId/type/slug/active. |
| `availabilitySlots` | Khung giờ gia sư thực sự mở | Lưu UTC và timezone gốc; có index theo tutorId/startAt/status. |
| `bookings` | Yêu cầu và lịch sử đặt buổi học | Lưu snapshot thời gian, giá và trạng thái; kiểm soát quyền theo learnerId/tutorId. |
| `reviews` | Đánh giá sau buổi học | Chỉ review booking completed hợp lệ; unique theo bookingId nếu chỉ cho một review. |
| `calendarConnections` | OAuth connection và token đã mã hóa | Không trả token về client. |
| `calendarEvents` | Theo dõi event Google theo booking và user | Idempotency theo bookingId + userId. |
| `recommendationLogs` | Lưu phiên bản công thức và kết quả nếu cần phân tích | Có thể bật sau MVP; không bắt buộc cho luồng gợi ý tối thiểu. |

## User

Các trường chính:

```json
{
  "_id": "ObjectId",
  "name": "Nguyen Van A",
  "email": "user@example.com",
  "passwordHash": "<bcrypt-hash>",
  "role": "learner",
  "status": "active",
  "refreshTokenHash": "<hash-or-session-reference>",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

Không đưa câu trả lời 28 câu vào User. Không lưu refresh token dạng rõ nếu không cần; ưu tiên hash hoặc cơ chế session an toàn.

## LearnerPreference

Schema logic đề xuất:

```json
{
  "userId": "ObjectId",
  "questionnaireVersion": 1,
  "completionStatus": "completed",
  "learning": {
    "categoryId": "ObjectId",
    "subjectIds": ["ObjectId"],
    "topicIds": ["ObjectId"],
    "purposes": ["certificate"],
    "currentLevel": "basic",
    "targetLevel": "advanced",
    "goalText": "IELTS 6.5",
    "goalTags": ["ielts_target"],
    "targetDuration": "6_12_months"
  },
  "learningStyle": {
    "methods": ["theory_practice"],
    "pace": "slow_detailed",
    "classFormat": "one_to_one",
    "preferredTutorStyles": ["patient", "friendly"],
    "materials": ["video", "exercises"],
    "interactionLevel": "frequent"
  },
  "schedulePreferences": {
    "timeBands": ["evening"],
    "weekdays": [1, 3, 5],
    "sessionsPerWeek": 3,
    "durationMinutes": 90
  },
  "constraints": {
    "modes": ["online"],
    "offlineLocations": [],
    "budgetMin": 100000,
    "budgetMax": 200000,
    "currency": "VND",
    "area": null
  },
  "tutorRequirements": {
    "selectionPriorities": ["expertise", "experience", "teaching_style"],
    "experienceRange": "3_5_years",
    "certificateRequirement": "preferred"
  },
  "supportNeeds": {
    "difficulties": ["low_focus"],
    "desiredSupport": ["exam_practice", "correct_exercises"],
    "progressTracking": "weekly"
  },
  "additionalNote": "",
  "completedAt": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

Đây là schema minh họa. Enum và taxonomy ID phải được thống nhất thành một danh mục chính thức trước khi triển khai.

## TutorProfile

Schema logic đề xuất:

```json
{
  "userId": "ObjectId",
  "questionnaireVersion": 1,
  "completionStatus": "completed",
  "expertise": {
    "categoryId": "ObjectId",
    "subjectIds": ["ObjectId"],
    "topicIds": ["ObjectId"]
  },
  "teachingCapabilities": {
    "supportedPurposes": ["certificate"],
    "teachableLevels": ["beginner", "basic", "intermediate"],
    "supportedTargetLevels": ["advanced"],
    "supportedGoalTags": ["ielts_target"],
    "estimatedDurationRanges": ["3_6_months", "6_12_months"],
    "methods": ["theory_practice"],
    "pace": "flexible",
    "classFormats": ["one_to_one"],
    "styles": ["patient", "friendly"],
    "materials": ["video", "exercises"],
    "interactionLevel": "frequent"
  },
  "schedulePreferences": {
    "timeBands": ["evening"],
    "weekdays": [1, 3, 5],
    "maxSessionsPerWeek": 5,
    "sessionDurationsMinutes": [60, 90]
  },
  "teachingConditions": {
    "modes": ["online"],
    "offlineLocations": [],
    "serviceAreas": [],
    "travelRadiusKm": null,
    "priceMin": 150000,
    "priceMax": 150000,
    "currency": "VND",
    "isNegotiable": false
  },
  "experienceYears": 4,
  "qualifications": [],
  "supportApproaches": ["explain_simply", "give_examples"],
  "availableSupport": ["exam_practice", "correct_exercises"],
  "assessmentMethods": ["weekly_test"],
  "introduction": "",
  "approvalStatus": "pending",
  "rejectionReason": null,
  "ratingSummary": {
    "averageRating": null,
    "reviewCount": 0
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

`qualifications[]` nên lưu tên chứng chỉ, đơn vị cấp, điểm/xếp loại nếu có, ngày cấp/hết hạn nếu phù hợp, tài liệu minh chứng và trạng thái xác minh. Không cho client tự đặt `verified = true`.

## Taxonomy và Tag

Mỗi danh mục có thể gồm:

- `type`: `category`, `subject`, `topic`, `level`, `teaching_method`, `teaching_style`, `support`, `material`, `mode`, ...
- `name`, `slug`, `parentId`, `active`, `sortOrder`.
- Có thể bổ sung `aliases[]` chỉ phục vụ nhập liệu/tìm kiếm, không dùng alias thay ID chuẩn.

Category → Subject → Topic là cấu trúc phân cấp chính. Các nhóm phương pháp, phong cách, tài liệu và hỗ trợ có thể là taxonomy độc lập.

Admin quản lý danh mục; dữ liệu danh mục đã được sử dụng không nên xóa cứng. Ưu tiên `active = false` để giữ lịch sử.

## AvailabilitySlot

```json
{
  "tutorId": "ObjectId",
  "startAt": "UTC Date",
  "endAt": "UTC Date",
  "timezone": "Asia/Ho_Chi_Minh",
  "status": "available",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

Quy tắc:

- `startAt < endAt`.
- Không tạo slot trong quá khứ.
- Slot cùng Tutor không được chồng lấn theo quy tắc đã chốt.
- Frontend hiển thị giờ theo timezone phù hợp; Backend lưu thời gian chuẩn UTC và timezone gốc.
- Không cho sửa/xóa slot đã có booking confirmed nếu làm sai lịch sử; phải có chính sách hủy/đổi lịch riêng.

## Booking

```json
{
  "learnerId": "ObjectId",
  "tutorId": "ObjectId",
  "slotId": "ObjectId",
  "startAt": "UTC Date",
  "endAt": "UTC Date",
  "timezone": "Asia/Ho_Chi_Minh",
  "durationMinutes": 90,
  "priceAmount": 200000,
  "currency": "VND",
  "status": "pending",
  "note": "",
  "rejectionReason": null,
  "cancelledBy": null,
  "cancelReason": null,
  "confirmedAt": null,
  "completedAt": null,
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

Lưu snapshot thời gian và giá tại thời điểm tạo/xác nhận booking để lịch sử không thay đổi khi Tutor cập nhật profile hoặc slot.

# Giai đoạn triển khai Backend

## Bảng tổng hợp tiến độ triển khai (Progress Dashboard)

| Giai đoạn | Mô tả phạm vi | Trạng thái | Kiểm thử tự động (Test Suites) |
|---|---|---|---|
| **Phase 1** | Khởi tạo Backend và nền tảng kỹ thuật | **Đã hoàn thành** (100%) | `health.test.js`, `errorHandling.test.js` (5 tests PASS) |
| **Phase 2** | Xác thực và phân quyền (Auth & RBAC) | **Đã hoàn thành** (100%) | `auth.test.js` (24 tests PASS) |
| **Phase 3** | Taxonomy và cấu hình bộ câu hỏi | **Đã hoàn thành** (100%) | `taxonomy.test.js` (19 tests PASS) |
| **Phase 4** | Onboarding, LearnerPreference & TutorProfile | **Đã hoàn thành** (100%) | `learnerPreference.test.js`, `tutorProfile.test.js` (21 tests PASS) |
| **Phase 5** | Admin duyệt Tutor & Tìm kiếm gia sư | **Đã hoàn thành** (100%) | `tutorSearchAndApproval.test.js` (28 tests PASS) |
| **Phase 6** | Recommendation Service: Content-based Filtering | **Đã hoàn thành** (100%) | `recommendation.test.js` (18 tests PASS) |
| **Phase 7** | Availability CRUD & Kiểm tra khả dụng | **Đã hoàn thành** (100%) | `availability.test.js` (23 tests PASS) |
| **Phase 8** | Booking & Vòng đời yêu cầu | **Đã hoàn thành** (100%) | `booking.test.js` (33 tests PASS) |
| **Phase 9** | Google Calendar API OAuth & Sync | **Chưa triển khai** (Kế hoạch tiếp theo) | Kế hoạch tích hợp Phase 9 |
| **Phase 10** | Review, Admin, bảo mật & vận hành | **Chưa triển khai** (Pending) | Kế hoạch hoàn thiện Phase 10 |

**Tổng tiến độ Backend:** Đã hoàn thành 8/10 giai đoạn (80%) | Toàn bộ 10/10 test suites, 197/197 tests PASS (100%).

## Giai đoạn 1 – Khởi tạo Backend và nền tảng kỹ thuật

**Mục tiêu:** Tạo server ổn định, kết nối MongoDB và thiết lập quy chuẩn chung.

**Công việc:**

- Kiểm tra cấu trúc repository và sử dụng lại module đã có; tránh tạo file/module trùng.
- Thiết lập Node.js, Express, Mongoose và các package cần thiết.
- Thiết lập cấu hình môi trường: `PORT`, `NODE_ENV`, `MONGODB_URI`, `CLIENT_URL`, JWT secrets và Google OAuth credentials.
- Tạo `env.js` có kiểm tra biến bắt buộc; production không được khởi động khi thiếu secret.
- Tạo kết nối MongoDB, health check, CORS, JSON parser, request logging và centralized error handler.
- Chuẩn hóa response, error code, logging và cấu hình development/staging/production.
- Tạo `.env.example` chỉ chứa placeholder; `.env` phải nằm trong `.gitignore`.

**Đầu ra:** Server chạy, kết nối DB, health check và xử lý lỗi thống nhất.  
**Tiêu chí hoàn thành:** Có thể khởi động server từ hướng dẫn; thiếu biến bắt buộc sẽ báo lỗi rõ ràng; không log secret.

**Trạng thái triển khai:** Đã hoàn thành (Phase 1 Completed)
- [x] Cấu hình môi trường an toàn (`backend/src/config/env.js`): Quản lý và kiểm tra các biến bắt buộc (`PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`,...), chặn server khởi động khi thiếu biến môi trường, bảo mật không để lộ secret trong logs.
- [x] Kết nối MongoDB Atlas (`backend/src/config/db.js`): Mongoose connection pooling, xử lý các sự kiện `connected`, `error`, `disconnected`, `reconnected`, hỗ trợ ngắt kết nối an toàn (`disconnectDB`).
- [x] Chuẩn hóa định dạng Response & Error (`backend/src/utils/apiResponse.js`, `backend/src/utils/apiError.js`, `backend/src/utils/asyncHandler.js`).
- [x] Centralized Error Handling & Middlewares (`backend/src/middlewares/errorHandler.js`, `backend/src/middlewares/notFound.js`, `backend/src/middlewares/requestLogger.js`, `backend/src/middlewares/rateLimiter.js`).
- [x] Health Check & Root APIs (`backend/src/routes/health.routes.js`, `backend/src/controllers/health.controller.js`): `GET /api/health`, `GET /health`, `GET /api`.
- [x] Kiểm thử tự động (`backend/tests/health.test.js`, `backend/tests/errorHandling.test.js`): 5/5 test cases vượt qua 100%.

## Giai đoạn 2 – Xác thực và phân quyền

**Mục tiêu:** Bảo vệ tài khoản và endpoint theo role.

**Công việc:**

- Hoàn thiện `User` model và API register/login/logout/me/refresh.
- Hash mật khẩu bằng bcrypt/bcryptjs.
- Access token thời hạn ngắn; refresh token có cơ chế rotate/revoke phù hợp.
- Middleware `authenticate` và `authorize('learner' | 'tutor' | 'admin')`.
- Kiểm tra tài khoản active/locked, email trùng, dữ liệu đầu vào và token hết hạn.
- Rate limit cho đăng ký/đăng nhập/refresh; không ghi password/token vào log.
- Kiểm tra quyền sở hữu ở service, không chỉ dựa vào role.

**API chính:**

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

**Đầu ra:** Auth API, JWT middleware và quy tắc bảo mật.  
**Tiêu chí hoàn thành:** Endpoint riêng tư không truy cập được khi thiếu token, sai role hoặc tài khoản bị khóa.

**Trạng thái triển khai:** Đã hoàn thành (Phase 2 Completed)
- [x] Model `User` (`backend/src/models/user.model.js`): Quản lý các trường `email`, `password` (bcrypt hash), `fullName`, `phone`, `role` (`learner`, `tutor`, `admin`), `status` (`active`, `locked`, `disabled`), `avatar`, timestamps.
- [x] Quản lý Token bảo mật (`backend/src/utils/token.util.js`): Cấp phát Access Token ngắn hạn và Refresh Token dài hạn, hỗ trợ xoay vòng và thu hồi token.
- [x] Middleware xác thực & phân quyền (`backend/src/middlewares/auth.js`): `authenticate` (xác thực token, chặn tài khoản `locked`/`disabled`), `authorize('learner' | 'tutor' | 'admin')` kiểm tra quyền theo vai trò.
- [x] Rate Limiting bảo vệ Auth (`backend/src/middlewares/rateLimiter.js`): Ngăn chặn brute force đối với các endpoint nhạy cảm.
- [x] 5 Endpoints API Auth hoàn thiện:
  - `POST /api/auth/register`: Đăng ký tài khoản (mặc định vai trò `learner` hoặc `tutor`, chặn đăng ký `admin`), mã hóa mật khẩu, kiểm tra trùng email.
  - `POST /api/auth/login`: Đăng nhập, chuẩn hóa email, kiểm tra trạng thái khóa tài khoản, cấp access & refresh tokens.
  - `POST /api/auth/refresh`: Cấp mới access token từ refresh token hợp lệ (hỗ trợ alias `/api/auth/refresh-token`).
  - `POST /api/auth/logout`: Đăng xuất an toàn, thu hồi refresh token.
  - `GET /api/auth/me`: Lấy thông tin tài khoản hiện tại (loại bỏ trường mật khẩu hash).
- [x] Kiểm thử tự động toàn diện (`backend/tests/auth.test.js`): 24/24 test cases vượt qua 100%.

## Giai đoạn 3 – Taxonomy và cấu hình bộ câu hỏi

**Mục tiêu:** Tạo một nguồn danh mục chuẩn dùng chung cho hai bộ câu hỏi.

**Công việc:**

- Thiết kế `Taxonomy` cho category, subject, topic, level, teaching method/style, material, support và các lựa chọn khác.
- Xây dựng quan hệ Category → Subject → Topic.
- Chốt enum cho câu hỏi single-select, multi-select, số, khoảng giá, thời lượng và lựa chọn linh hoạt.
- Khai báo questionnaire version và metadata câu hỏi: questionId, type, required, maxSelections, dependency và option IDs.
- API lấy bộ câu hỏi theo role và version; API lấy danh mục con theo lựa chọn trước.
- Admin tạo/sửa/ẩn taxonomy; không xóa cứng danh mục đã được tham chiếu.

**API chính:**

- `GET /api/questionnaires/:role`
- `GET /api/taxonomies`
- `GET /api/taxonomies/:id/children`
- `GET /api/tags` (nếu giữ tên route tương thích hiện tại)
- `POST /api/admin/taxonomies`
- `PATCH /api/admin/taxonomies/:id`

**Đầu ra:** Taxonomy và bộ câu hỏi có phiên bản.  
**Tiêu chí hoàn thành:** Hai vai trò dùng chung ID danh mục; Q2/Q3 thay đổi theo câu trả lời trước; backend từ chối option ID không hợp lệ hoặc đã inactive.

**Trạng thái triển khai:** Đã hoàn thành (Phase 3 Completed)
- [x] Model `Taxonomy` (`backend/src/models/taxonomy.model.js`): Thiết kế mô hình danh mục phân cấp Category → Subject → Topic và các nhóm tag dùng chung (teaching methods, styles, materials, support,...), quản lý quan hệ `parentId`, `ancestors`, `slug`, `sortOrder`, trạng thái `active`.
- [x] Cấu hình Metadata Questionnaire (`backend/src/constants/questionnaire.config.js`): Định nghĩa chi tiết cấu trúc 28 câu hỏi cho Learner và Tutor, phiên bản questionnaire (`v1.0.0`), loại câu hỏi (single/multi-select, number, range, flexible), validation dependencies (Q1→Q2→Q3) và giới hạn lựa chọn.
- [x] Seed data taxonomy mẫu (`backend/src/seeds/taxonomy.seed.js`): Khởi tạo danh mục tiêu chuẩn cho hệ thống (CNTT, Ngoại ngữ, Kỹ năng mềm, Toán học,...).
- [x] Taxonomy Service Helper (`backend/src/services/taxonomy.service.js`): Cung cấp `validateTaxonomyIds` kiểm tra nhanh tính hợp lệ và trạng thái active của danh sách ID taxonomy.
- [x] 6 Endpoints API hoàn thiện:
  - `GET /api/questionnaires/:role`: Tải bộ câu hỏi và metadata theo vai trò (`learner`/`tutor`).
  - `GET /api/taxonomies`: Lấy toàn bộ cây danh mục active (hỗ trợ lọc theo `type`).
  - `GET /api/taxonomies/:id/children`: Lấy danh mục con trực tiếp theo ID cha.
  - `GET /api/tags`: Lấy danh sách tag dùng chung theo nhóm tag.
  - `POST /api/admin/taxonomies`: Admin tạo mới category/subject/topic, tự động sinh slug, kiểm tra trùng lặp và xác thực parent.
  - `PATCH /api/admin/taxonomies/:id`: Admin cập nhật tên, thứ tự và soft-deactivate (chuyển `active: false`, không xóa cứng dữ liệu đang được tham chiếu).
- [x] Kiểm thử tự động toàn diện (`backend/tests/taxonomy.test.js`): 19/19 test cases vượt qua 100%.

## Giai đoạn 4 – Onboarding, LearnerPreference và TutorProfile

**Mục tiêu:** Lưu đầy đủ câu trả lời 28 câu theo cấu trúc phù hợp cho tìm kiếm/gợi ý.

**Công việc:**

- Tạo `LearnerPreference` và `TutorProfile`, liên kết một-một với User theo role trong MVP.
- Tạo API lưu nháp, cập nhật từng phần và hoàn tất onboarding.
- Validate số lượng lựa chọn, kiểu dữ liệu, trường bắt buộc, dependency Q1→Q2→Q3 và các câu có điều kiện như Offline.
- Chuẩn hóa giá thành số VND, thời lượng thành phút, ngày trong tuần thành số/enum ổn định và cấp độ thành enum.
- Lưu `questionnaireVersion`, `completionStatus`, `completedAt` và `updatedAt`.
- Với Tutor, thêm trạng thái duyệt `pending/approved/rejected` và lý do từ chối.
- Chỉ trả trường public của TutorProfile cho Learner; thông tin liên hệ/giấy tờ riêng tư chỉ trả theo quyền.

**API chính:**

- `GET /api/learners/preferences/me`
- `PUT /api/learners/preferences/me` hoặc `PATCH /api/learners/preferences/me`
- `POST /api/learners/preferences/complete`
- `GET /api/tutors/profile/me`
- `PUT /api/tutors/profile/me` hoặc `PATCH /api/tutors/profile/me`
- `POST /api/tutors/profile/submit`

**Đầu ra:** Hai profile chuẩn hóa, hỗ trợ lưu tiến độ.  
**Tiêu chí hoàn thành:** Learner không thể cập nhật hồ sơ Tutor và ngược lại; dữ liệu sai enum/ID bị từ chối; profile hoàn chỉnh có thể dùng cho recommendation.

**Trạng thái triển khai:** Đã hoàn thành (Phase 4 Completed)
- [x] Model `LearnerPreference` (`backend/src/models/learnerPreference.model.js`): Lưu trữ cấu trúc hóa toàn bộ 28 câu hỏi của Learner (lĩnh vực, môn học, chuyên môn, cấp độ hiện tại & mục tiêu, ngân sách, khung giờ, ngày học, thời lượng, hình thức online/offline, phong cách gia sư mong muốn, hỗ trợ cần thiết,...), theo dõi `completionStatus` (`draft`, `in_progress`, `completed`).
- [x] Model `TutorProfile` (`backend/src/models/tutorProfile.model.js`): Lưu trữ hồ sơ năng lực 28 câu hỏi của Tutor (môn có thể dạy, cấp độ tiếp nhận, học phí, khu vực và bán kính nhận dạy, kinh nghiệm, danh sách bằng cấp/chứng chỉ qualifications, trạng thái duyệt `approvalStatus`: `draft`, `pending`, `approved`, `rejected`).
- [x] Validators & Logic nghiệp vụ chặt chẽ (`learnerPreference.validator.js`, `tutorProfile.validator.js`):
  - Kiểm tra tính phụ thuộc danh mục Q1 → Q2 → Q3 (Subject phải thuộc Category).
  - Kiểm tra điều kiện có điều kiện: Bắt buộc chọn `offlineLocations` khi chọn hình thức Offline.
  - Giới hạn số lượng lựa chọn: Không quá 3 lựa chọn cho phong cách (Q12) và ưu tiên (Q22).
  - Chống giả mạo dữ liệu (Anti-tampering): Chặn client tự ý đặt trạng thái `approved` hoặc tự xác minh chứng chỉ `isVerified`.
- [x] 6 Endpoints API Onboarding hoàn thiện:
  - `GET /api/learners/preferences/me`: Xem hồ sơ nhu cầu học của Learner.
  - `PUT/PATCH /api/learners/preferences/me`: Lưu nháp/cập nhật từng phần câu trả lời.
  - `POST /api/learners/preferences/complete`: Hoàn tất onboarding học viên với kiểm tra toàn diện.
  - `GET /api/tutors/profile/me`: Xem hồ sơ năng lực của Tutor.
  - `PUT/PATCH /api/tutors/profile/me`: Lưu nháp hồ sơ gia sư.
  - `POST /api/tutors/profile/submit`: Nộp hồ sơ xét duyệt với trạng thái `pending`.
- [x] Kiểm thử tự động toàn diện (`backend/tests/learnerPreference.test.js`, `backend/tests/tutorProfile.test.js`): 21/21 test cases vượt qua 100%.

## Giai đoạn 5 – Admin duyệt Tutor và tìm kiếm gia sư

**Mục tiêu:** Chỉ hiển thị gia sư đủ điều kiện và cung cấp tìm kiếm cơ bản.

**Công việc:**

- Admin xem danh sách Tutor chờ duyệt, chi tiết profile và thông tin chứng chỉ.
- Admin duyệt/từ chối profile; ghi người duyệt, thời gian và lý do.
- API tìm kiếm Tutor theo category, subject, topic, mode, giá, cấp độ, khu vực và trạng thái duyệt.
- Hỗ trợ pagination, sort và filter có whitelist.
- Không trả profile pending/rejected trong kết quả public.
- Tạo `ratingSummary` từ review hợp lệ; không cho client gửi averageRating/reviewCount.

**API chính:**

- `GET /api/tutors`
- `GET /api/tutors/:id`
- `GET /api/admin/tutors?approvalStatus=pending`
- `PATCH /api/admin/tutors/:id/approval`

**Đầu ra:** Admin approval và Tutor search API.  
**Tiêu chí hoàn thành:** Tài khoản/profile không đủ điều kiện không xuất hiện trong kết quả public; filter và pagination hoạt động ổn định.

**Trạng thái triển khai:** Đã hoàn thành (Phase 5 Completed)
- [x] Quy trình Admin xét duyệt hồ sơ gia sư: Xem hàng đợi hồ sơ `pending`, xem chi tiết bằng cấp/chứng chỉ chưa che mặt nạ, duyệt (`approved`) kèm xác minh chứng chỉ (`verifiedQualificationIds`), hoặc từ chối (`rejected`) bắt buộc kèm lý do `rejectionReason`.
- [x] Tìm kiếm gia sư công khai đa tiêu chí (`GET /api/tutors`): Lọc theo lĩnh vực (`categoryId`), môn học (`subjectIds`), hình thức học (`mode`), khoảng học phí (`priceMin`, `priceMax`), khu vực (`area`), và tìm kiếm từ khóa (`q` / `search`) theo tên hoặc lời giới thiệu.
- [x] Bảo vệ dữ liệu cá nhân & An toàn hiển thị: Chỉ hiển thị gia sư đã được duyệt (`approved`), hoàn tất hồ sơ (`completed`) và tài khoản đang hoạt động (`active`). Tự động che giấu số điện thoại, lý do từ chối và thông tin người duyệt khi trả về cho public/learner.
- [x] Phân trang (Pagination) và Sắp xếp (Sorting) chặt chẽ với whitelist tham số hợp lệ, kiểm tra định dạng ObjectId và khoảng giá hợp lệ (`priceMin <= priceMax`).
- [x] 5 Endpoints API hoàn thiện:
  - `GET /api/tutors`: Tìm kiếm gia sư công khai với bộ lọc và phân trang.
  - `GET /api/tutors/:id`: Xem hồ sơ chi tiết gia sư đã duyệt và active.
  - `GET /api/admin/tutors`: Admin tra cứu danh sách toàn bộ gia sư (hỗ trợ lọc `approvalStatus=pending/rejected/approved` và tìm kiếm tên/SĐT).
  - `GET /api/admin/tutors/:id`: Admin xem chi tiết toàn diện hồ sơ gia sư và chứng chỉ.
  - `PATCH /api/admin/tutors/:id/approval`: Admin phê duyệt hoặc từ chối hồ sơ gia sư.
- [x] Kiểm thử tự động toàn diện (`backend/tests/tutorSearchAndApproval.test.js`): 28/28 test cases vượt qua 100%.

## Giai đoạn 6 – Recommendation Service: Content-based Filtering

**Mục tiêu:** Gợi ý gia sư từ nhu cầu Learner và năng lực Tutor bằng quy tắc có thể giải thích, không dùng Machine Learning.

### Đầu vào

- LearnerPreference đã hoàn thành.
- TutorProfile có `approvalStatus = approved`, tài khoản active và profile đủ trường bắt buộc.
- Taxonomy ID thống nhất.
- RatingSummary từ Review hợp lệ nếu đã có dữ liệu.

### Hai tầng xử lý

**Tầng A – Lọc ứng viên (eligibility filter):**

- Loại Tutor không active hoặc chưa approved.
- Kiểm tra lĩnh vực/môn học bắt buộc.
- Kiểm tra trình độ hiện tại có thuộc phạm vi Tutor nhận dạy.
- Nếu Learner đặt chứng chỉ là `required`, Tutor phải có chứng chỉ phù hợp đã xác minh.
- Kiểm tra hình thức học; Offline chỉ đưa vào kết quả khi điều kiện địa điểm có thể đối chiếu.
- Có thể áp dụng ngân sách như hard filter khi Learner chọn rõ đây là giới hạn bắt buộc; nếu không, dùng scoring.

**Tầng B – Tính điểm và xếp hạng:**

Bản đề xuất cập nhật công thức để khai thác bộ câu hỏi 28 mục đầy đủ hơn:

`MatchScore = 0.30S + 0.20L + 0.15B + 0.10M + 0.10T + 0.05A + 0.05E + 0.05R`

- **S – Mức phù hợp môn học/chuyên môn: 30%.** Nguồn: Learner Q1–3; Tutor Q1–3.
- **L – Trình độ và mục tiêu: 20%.** Nguồn: Learner Q4–8; Tutor Q4–8.
- **B – Ngân sách và học phí: 15%.** Nguồn: Learner Q21; Tutor Q22.
- **M – Hình thức và điều kiện địa điểm: 10%.** Nguồn: Learner Q19–20; Tutor Q19–21.
- **T – Phương pháp, phong cách và khả năng hỗ trợ: 10%.** Nguồn: Learner Q9–14, Q25–27; Tutor Q9–14, Q25–27.
- **A – Tương thích lịch tổng quát: 5%.** Nguồn: Learner Q15–18; Tutor Q15–18.
- **E – Kinh nghiệm và bằng cấp/chứng chỉ không bắt buộc: 5%.** Nguồn: Learner Q23–24; Tutor Q23–24.
- **R – Đánh giá từ học viên: 5%.** Nguồn: Review hợp lệ và ratingSummary.

**Lưu ý trọng số:** Công thức này là đề xuất chỉnh sửa so với công thức minh họa ban đầu `35/20/20/15/10`. Nhóm cần thống nhất và kiểm thử trên bộ dữ liệu mẫu trước khi chốt. Khi một tiêu chí không có câu trả lời từ Learner, có thể loại trọng số tiêu chí đó và chuẩn hóa lại tổng trọng số còn lại. Không được tự coi dữ liệu bị thiếu là “khớp hoàn toàn”.

### Cách tính điểm thành phần

- **S – Subject/Topic:** Dùng ID taxonomy. Có thể tính tỷ lệ `topicIds` Learner yêu cầu được Tutor hỗ trợ; ưu tiên chuyên môn khớp chính xác hơn chỉ khớp category. Category/subject bắt buộc có thể được dùng làm filter trước scoring.
- **L – Level/Goal:** Kiểm tra Learner currentLevel có trong `teachableLevels`; targetLevel có trong `supportedTargetLevels`; so khớp purpose, goal tags và thời gian dự kiến. Không diễn giải mục tiêu tự do bằng AI trong bản đầu.
- **B – Budget:** So sánh giá Tutor với khoảng ngân sách. Đề xuất: 1.0 nếu nằm trong ngân sách; giảm điểm theo mức vượt nếu Learner cho phép linh hoạt; 0 nếu vượt giới hạn cứng. Cần chốt rõ giá theo buổi hay theo 60 phút.
- **M – Mode/Location:** Điểm cao khi mode giao nhau. Offline cần khu vực Learner và khu vực/bán kính Tutor; nếu thiếu khu vực Learner thì không được khẳng định mức độ gần.
- **T – Teaching Fit:** So khớp methods, pace, classFormat, styles, materials, interaction, desiredSupport, supportApproaches và progress tracking. Từng trường được chuẩn hóa về cùng taxonomy/enum.
- **A – Availability Preference:** So sánh weekday/timeBand/duration mong muốn với khả năng tổng quát của Tutor. Khi Learner xem lịch và đặt lịch, phải truy vấn AvailabilitySlot cụ thể.
- **E – Experience/Qualification:** Kinh nghiệm có thể tính theo mức/range; chứng chỉ `required` là filter, không chỉ là điểm thưởng. Chứng chỉ đã xác minh có giá trị cao hơn chứng chỉ chưa xác minh.
- **R – Rating:** Chuẩn hóa rating về thang 0–1. Tutor chưa có review không bị cho điểm 0; dùng điểm trung lập hoặc prior đã thống nhất và không hiển thị tuyên bố “đánh giá tốt” khi chưa có review.

### Ưu tiên lựa chọn của Learner

Q22 của Learner (`selectionPriorities[]`) không có câu đối xứng trong Tutor. Ở MVP:

- Lưu tối đa ba ưu tiên.
- Dùng để tạo lý do giải thích và tie-breaker khi điểm tổng bằng nhau/gần nhau.
- Không tự điều chỉnh trọng số tổng của thuật toán theo từng người dùng cho đến khi nhóm có bộ quy tắc và kiểm thử riêng.

### Kết quả API

API cần trả:

- `tutorId` và thông tin Tutor public.
- `matchScore` theo thang 0–100.
- `scoreBreakdown` theo từng nhóm tiêu chí.
- `matchedReasons[]` và có thể `missingOrWeakMatches[]`.
- `algorithmVersion` để xác định công thức đã dùng.

Ví dụ response:

```json
{
  "success": true,
  "data": {
    "algorithmVersion": "cbf-v1",
    "items": [
      {
        "tutorId": "<tutorId>",
        "matchScore": 92.5,
        "scoreBreakdown": {
          "subject": 100,
          "levelGoal": 90,
          "budget": 100,
          "modeLocation": 100,
          "teachingFit": 85,
          "availability": 90,
          "experienceQualification": 80,
          "rating": 90
        },
        "matchedReasons": [
          "Có dạy đúng môn/chuyên môn Learner đang tìm",
          "Có thể tiếp nhận trình độ hiện tại và hỗ trợ mục tiêu",
          "Hình thức dạy phù hợp",
          "Học phí nằm trong ngân sách"
        ]
      }
    ]
  }
}
```

### API và kiểm thử

- `POST /api/recommendations/tutors`
- Có thể nhận filter bổ sung như `mode`, `dateRange`, `page`, `limit`; nhu cầu chính lấy từ profile đã xác thực.
- Không cho client gửi `matchScore` hoặc trọng số tùy ý.
- Cùng dữ liệu và cùng `algorithmVersion` phải tạo kết quả nhất quán.
- Kiểm thử trường hợp thiếu tiêu chí, không có ứng viên, cùng điểm, tutor chưa có review, budget linh hoạt và chứng chỉ bắt buộc.

**Đầu ra:** Recommendation Service, công thức được tài liệu hóa, response có điểm và lý do.  
**Tiêu chí hoàn thành:** Không sử dụng ML; điểm có thể kiểm tra lại; không đề xuất Tutor chưa duyệt hoặc không đạt điều kiện bắt buộc.

**Trạng thái triển khai:** Đã hoàn thành (Phase 6 Completed)
- [x] Thuật toán Recommendation Content-based Filtering (CBF) chuẩn xác, phiên bản `cbf-v1`, áp dụng công thức chấm điểm 8 thành phần minh bạch:
  `MatchScore = 0.30S + 0.20L + 0.15B + 0.10M + 0.10T + 0.05A + 0.05E + 0.05R`
- [x] Kiến trúc xử lý hai tầng (Two-stage Processing):
  - **Tầng A (Candidate Eligibility Filtering):** Loại trừ tuyệt đối gia sư chưa duyệt hoặc tài khoản bị khóa; kiểm tra môn học/chuyên môn; kiểm tra phạm vi cấp độ nhận dạy; áp dụng Hard Filter cho chứng chỉ xác minh khi learner yêu cầu; áp dụng Hard Filter cho ngân sách khi kích hoạt tùy chọn `strictBudget`.
  - **Tầng B (Content-based Scoring & Ranking):** Tính điểm chi tiết từng tiêu chí, gán điểm prior trung lập công bằng cho gia sư mới chưa có đánh giá, sinh mảng lý do phù hợp (`matchedReasons`) trung thực và có thể giải thích được.
- [x] Telemetry Logging (`backend/src/models/recommendationLog.model.js`): Ghi nhận lịch sử truy vấn gợi ý để phục vụ theo dõi chất lượng và tối ưu hóa hệ thống.
- [x] Endpoints API hoàn thiện:
  - `POST /api/recommendations/tutors`: Nhận gợi ý gia sư cho Learner đã đăng nhập và hoàn thành onboarding (hỗ trợ lọc bổ sung theo `mode`, `minScore`, `page`, `limit`).
  - `GET /api/recommendations/tutors`: Alias truy vấn thuận tiện.
  - Hỗ trợ quyền Admin xem trước (preview) kết quả gợi ý của bất kỳ học viên nào qua tham số `?learnerId=...`.
- [x] Kiểm thử tự động toàn diện (`backend/tests/recommendation.test.js`): 18/18 test cases vượt qua 100%.

## Giai đoạn 7 – Availability CRUD và kiểm tra khả dụng

**Mục tiêu:** Quản lý slot thực tế và bảo vệ lịch của Tutor.

**Công việc:**

- Tutor tạo/xem/sửa/đóng/xóa slot.
- Kiểm tra `startAt < endAt`, không nằm trong quá khứ và timezone hợp lệ.
- Chống các slot của cùng Tutor bị chồng lấn.
- Learner xem slot theo Tutor và khoảng ngày.
- Có thể kiểm tra thời lượng slot đủ cho duration Learner chọn.
- Không cho sửa/xóa slot đang gắn booking confirmed nếu chưa qua luồng thay đổi/hủy booking.
- Dùng transaction hoặc atomic update để ngăn hai booking xác nhận cùng slot.

**Trạng thái slot đề xuất:**

- `available`: Có thể được yêu cầu đặt.
- `booked`: Đã được booking xác nhận chiếm.
- `closed`: Tutor chủ động đóng hoặc không còn cung cấp.

Nếu nhóm quyết định `pending` giữ chỗ, phải bổ sung `reserved`, `holdExpiresAt` và job giải phóng slot hết hạn. Không triển khai trạng thái giữ chỗ nếu chưa có cơ chế timeout rõ ràng.

**API chính:**

- `POST /api/availability`
- `GET /api/availability/mine`
- `PATCH /api/availability/:id`
- `DELETE /api/availability/:id`
- `GET /api/tutors/:id/availability?from=&to=`

**Đầu ra:** Availability CRUD và API đọc slot khả dụng.  
**Tiêu chí hoàn thành:** Slot chồng lấn bị từ chối; slot booked không bị xóa/sửa trái phép; thời gian hiển thị đúng timezone.

**Trạng thái triển khai:** Đã hoàn thành (Phase 7 Completed)
- [x] Model `AvailabilitySlot` (`backend/src/models/availabilitySlot.model.js`): Quản lý slot của gia sư với các trường `tutorId`, `startAt`, `endAt`, `timezone`, `status` (`available`, `booked`, `closed`), `bookingId`, audit fields.
- [x] Quy tắc kiểm tra thời gian nghiêm ngặt:
  - Bắt buộc `startAt < endAt` và thời gian bắt đầu không nằm trong quá khứ.
  - Kiểm tra định danh múi giờ IANA chuẩn (ví dụ `Asia/Ho_Chi_Minh`).
  - Chống trùng lặp / chồng lấn thời gian (overlap check) giữa các slot của cùng một gia sư.
- [x] Cơ chế bảo vệ slot booked: Chặn sửa đổi hoặc xóa các slot đang gắn với booking confirmed.
- [x] Bộ helper khóa/mở slot nguyên tử (`atomicBookSlot`, `atomicReleaseSlot`): Sử dụng `findOneAndUpdate` nguyên tử chuẩn bị cho hệ thống Booking chống race condition.
- [x] 6 Endpoints API hoàn thiện:
  - `POST /api/availability`: Tutor tạo slot rảnh mới.
  - `GET /api/availability/mine`: Tutor xem danh sách slot của chính mình (hỗ trợ lọc ngày và trạng thái).
  - `PATCH /api/availability/:id`: Tutor cập nhật thời gian, ghi chú, trạng thái slot.
  - `DELETE /api/availability/:id`: Tutor xóa slot đang mở.
  - `GET /api/tutors/:id/availability`: Học viên/Public tra cứu slot khả dụng trong tương lai theo khoảng thời gian (`from`, `to`) và thời lượng tối thiểu (`minDuration`).
  - `GET /api/availability/tutors/:id`: Alias tương thích.
- [x] Kiểm thử tự động toàn diện (`backend/tests/availability.test.js`): 23/23 test cases vượt qua 100%.

## Giai đoạn 8 – Booking và vòng đời yêu cầu

**Mục tiêu:** Quản lý yêu cầu học, xác nhận/từ chối/hủy và hoàn thành buổi học.

**Công việc:**

- Learner tạo booking theo slot khả dụng; Backend tự lấy learnerId từ token.
- Kiểm tra slot thuộc Tutor, status available, thời gian hợp lệ và duration phù hợp.
- Lưu snapshot `startAt`, `endAt`, timezone, duration, giá và currency.
- Tutor chỉ xem/xử lý booking của chính mình.
- Learner chỉ xem/hủy booking thuộc mình.
- Kiểm tra state transition hợp lệ; không cho client cập nhật status tùy ý.
- Ghi `confirmedAt`, `cancelledBy`, `cancelReason`, `completedAt` và audit fields cần thiết.
- Khi confirmed, cập nhật slot và booking atomically/transactionally.
- Khi booking bị hủy, giải phóng slot nếu chính sách cho phép.
- Phát event nội bộ sau confirmed/cancelled/completed để kích hoạt notification/calendar/review.

**State machine đề xuất:**

| Trạng thái hiện tại | Hành động | Trạng thái tiếp theo | Người có quyền |
|---|---|---|---|
| `pending` | Xác nhận | `confirmed` | Tutor sở hữu booking |
| `pending` | Từ chối | `rejected` | Tutor sở hữu booking |
| `pending` | Hủy yêu cầu | `cancelled` | Learner sở hữu booking hoặc Admin theo quyền |
| `confirmed` | Hủy theo chính sách | `cancelled` | Learner/Tutor/Admin theo policy |
| `confirmed` | Đánh dấu hoàn tất sau buổi học | `completed` | Quy tắc hệ thống/role được phân quyền |
| `rejected`, `cancelled`, `completed` | Không cho chuyển trạng thái tùy ý | — | Chỉ thao tác đặc biệt do Admin nếu có audit |

**Quy tắc chiếm slot cho MVP đề xuất:** `pending` chưa chiếm slot; chỉ khi Tutor xác nhận, Backend mới atomic chuyển slot `available → booked`. Nếu slot đã bị một booking khác chiếm trước, xác nhận thất bại và booking còn lại phải được xử lý theo trạng thái/lý do hệ thống đã thống nhất. Nếu muốn pending giữ chỗ, phải thiết kế thời hạn giữ và job giải phóng ngay từ đầu.

**API chính:**

- `POST /api/bookings`
- `GET /api/bookings/me`
- `GET /api/bookings/:id`
- `PATCH /api/bookings/:id/confirm`
- `PATCH /api/bookings/:id/reject`
- `PATCH /api/bookings/:id/cancel`
- `PATCH /api/bookings/:id/complete`

**Đầu ra:** Booking model, state machine, quyền sở hữu và kiểm soát đặt trùng.  
**Tiêu chí hoàn thành:** Không có hai booking confirmed cùng chiếm một slot; không thể chuyển trạng thái trái quyền hoặc trái state machine.

**Trạng thái triển khai:** Đã hoàn thành (Phase 8 Completed)
- [x] Tạo `Booking` model (`backend/src/models/booking.model.js`) lưu đầy đủ snapshots (`startAt`, `endAt`, `timezone`, `durationMinutes`, `price`, `currency`, `subjectId`, `subjectName`, `learningMode`, `location`, `learnerNote`, `tutorNote`) và audit fields (`confirmedAt`, `rejectedAt`, `rejectionReason`, `cancelledAt`, `cancelledBy`, `cancelledByRole`, `cancelReason`, `completedAt`, `completedBy`).
- [x] Định nghĩa hằng số và quy tắc State Machine (`backend/src/constants/bookingStatus.js`): `pending` → `confirmed` | `rejected` | `cancelled`; `confirmed` → `cancelled` | `completed`; chặn chuyển đổi từ trạng thái cuối.
- [x] Cơ chế khóa slot nguyên tử (Atomic Slot Locking) & Race Condition Protection: Khi Tutor xác nhận, gọi `atomicBookSlot` chuyển slot `available → booked` và gắn `bookingId`. Tự động từ chối các booking pending cạnh tranh cùng slot.
- [x] Cơ chế giải phóng slot nguyên tử (Atomic Slot Release): Khi booking đã confirmed bị hủy, gọi `atomicReleaseSlot` chuyển slot `booked → available`.
- [x] Phân quyền & Kiểm soát truy cập nghiêm ngặt: Learner chỉ xem/hủy booking của mình; Tutor chỉ xem/xác nhận/từ chối/hủy/hoàn tất booking dạy của mình; Admin quản lý toàn diện qua `/api/admin/bookings`.
- [x] Hệ thống sự kiện nội bộ `bookingEvents` (`backend/src/events/booking.events.js`): Phát các event `booking.created`, `booking.confirmed`, `booking.rejected`, `booking.cancelled`, `booking.completed` sẵn sàng tích hợp Google Calendar (Phase 9) và Review/Notification (Phase 10).
- [x] 8 Endpoints API hoàn thiện:
  - `POST /api/bookings`
  - `GET /api/bookings/me`
  - `GET /api/bookings/:id`
  - `PATCH /api/bookings/:id/confirm`
  - `PATCH /api/bookings/:id/reject`
  - `PATCH /api/bookings/:id/cancel`
  - `PATCH /api/bookings/:id/complete`
  - `GET /api/admin/bookings`
- [x] Kiểm thử tự động toàn diện (`backend/tests/booking.test.js`): 33/33 test cases vượt qua 100% (Tổng toàn dự án: 10/10 suites, 197/197 tests PASS).

## Giai đoạn 9 – Google Calendar API

**Mục tiêu:** Đồng bộ booking đã xác nhận vào lịch của Learner và Tutor đã kết nối.

**Công việc:**

- Tạo Google Cloud project, bật Calendar API và cấu hình OAuth consent screen/redirect URI.
- Xây dựng OAuth Authorization Code Flow; dùng state chống CSRF và scope tối thiểu.
- Mã hóa access/refresh token khi lưu; xử lý refresh khi access token hết hạn.
- Tạo event sau `booking.confirmed` cho từng user đã kết nối.
- Lưu `googleEventId`, `syncStatus`, `lastSyncedAt`, `errorCode` theo từng user/booking.
- Khi booking hủy/thay đổi, cập nhật hoặc xóa event tương ứng.
- Xử lý một bên chưa kết nối, token bị thu hồi, quota, lỗi mạng và retry.
- Dùng idempotency để retry không tạo event trùng.
- Không rollback booking nếu Google Calendar lỗi.

**API chính:**

- `GET /api/calendar/status`
- `GET /api/calendar/oauth`
- `GET /api/calendar/oauth/callback`
- `POST /api/calendar/disconnect`
- `POST /api/calendar/sync/retry` (chỉ khi cần cho phép retry thủ công theo quyền)

**Đầu ra:** OAuth service, Calendar integration, connection/event collections và retry.  
**Tiêu chí hoàn thành:** Booking xác nhận vẫn hợp lệ khi Calendar lỗi; sync status được lưu riêng; retry idempotent.

**Trạng thái triển khai:** Chưa triển khai (Kế hoạch tiếp theo / Next Step)
- [ ] Xây dựng OAuth 2.0 Authorization Code Flow kết nối Google Calendar (`/api/calendar/oauth`, `/api/calendar/oauth/callback`).
- [ ] Mã hóa và lưu trữ an toàn refresh token, access token trong cơ sở dữ liệu (`CalendarConnection` model).
- [ ] Lắng nghe sự kiện `booking.confirmed` từ `bookingEvents` để tự động tạo Google Calendar Event cho cả Learner và Tutor đã liên kết.
- [ ] Đồng bộ cập nhật hoặc xóa event trên Google Calendar khi booking bị hủy (`booking.cancelled`).
- [ ] Quản lý trạng thái đồng bộ (`not_connected`, `pending`, `synced`, `failed`, `cancelled`) và cơ chế retry idempotent.

## Giai đoạn 10 – Review, Admin, bảo mật và vận hành

**Mục tiêu:** Hoàn thiện các nghiệp vụ phụ trợ và chuẩn bị triển khai production.

**Công việc:**

- Review chỉ được tạo bởi Learner có booking `completed` hợp lệ.
- Quy định một review/booking; cho phép chỉnh sửa hoặc phản hồi hay không phải được chốt.
- Tính lại `ratingSummary` từ review hợp lệ; không cho client gửi điểm trung bình.
- Admin quản lý users, Tutor approval, taxonomy, booking, reviews và trạng thái Calendar.
- Validate toàn bộ input; whitelist field được cập nhật; chống mass assignment và NoSQL injection.
- Rate limit các endpoint nhạy cảm; giới hạn payload; sanitize nội dung hiển thị.
- Tạo index phù hợp và kiểm tra query chậm.
- Unit/integration test cho auth, onboarding, recommendation, availability, booking, review và calendar.
- Logging, monitoring, backup MongoDB, cấu hình deploy và hướng dẫn khôi phục.
- Quản lý secret qua environment/secret manager; không commit `.env`.

**API chính:**

- `POST /api/reviews`
- `GET /api/tutors/:id/reviews`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/status`
- `GET /api/admin/bookings`
- `GET /api/admin/calendar-sync` (nếu cần trang giám sát)

**Đầu ra:** Review API, Admin API, test suite, tài liệu API và deploy guide.  
**Tiêu chí hoàn thành:** Nghiệp vụ cốt lõi có test; quyền truy cập được kiểm tra; có logging/backup và quy trình triển khai.

**Trạng thái triển khai:** Chưa triển khai (Pending)
- [ ] Review & Rating System: Chỉ cho phép Learner có booking `completed` đánh giá, tự động tính toán lại `ratingSummary` cho Tutor.
- [ ] Mở rộng Admin Dashboard: Quản lý người dùng (`/api/admin/users`), khóa/mở tài khoản, giám sát trạng thái đồng bộ Calendar.
- [ ] Tăng cường bảo mật: Rate limiting chuyên sâu, NoSQL injection protection, input sanitization toàn diện.
- [ ] Logging, monitoring & MongoDB backup/restore automation cho môi trường production.

# Quy tắc trạng thái và nghiệp vụ

## User

| Trạng thái | Ý nghĩa |
|---|---|
| `active` | Tài khoản hoạt động. |
| `locked` | Tạm khóa; không được thực hiện nghiệp vụ yêu cầu đăng nhập. |
| `disabled` | Vô hiệu hóa theo quy trình quản trị. |

## TutorProfile approval

| Trạng thái | Ý nghĩa |
|---|---|
| `draft` | Tutor đang hoàn thiện hồ sơ. |
| `pending` | Đã gửi hồ sơ chờ Admin duyệt. |
| `approved` | Được phép xuất hiện trong tìm kiếm/gợi ý. |
| `rejected` | Bị từ chối; lưu lý do và cho phép cập nhật/gửi lại theo chính sách. |

## AvailabilitySlot

| Trạng thái | Ý nghĩa |
|---|---|
| `available` | Slot đang mở và chưa bị booking confirmed chiếm. |
| `booked` | Slot đã được booking confirmed chiếm. |
| `closed` | Tutor đóng slot. |
| `reserved` | Chỉ dùng nếu triển khai pending hold có `holdExpiresAt` và job giải phóng. |

## Booking

| Trạng thái | Ý nghĩa |
|---|---|
| `pending` | Learner gửi yêu cầu, chờ Tutor xử lý. |
| `confirmed` | Tutor xác nhận, slot được chiếm. |
| `rejected` | Tutor từ chối. |
| `cancelled` | Booking bị hủy bởi Learner, Tutor, Admin hoặc hệ thống theo chính sách. |
| `completed` | Buổi học hoàn tất; có thể đủ điều kiện review. |

## Calendar sync

| Trạng thái | Ý nghĩa |
|---|---|
| `not_connected` | Người dùng chưa kết nối Calendar. |
| `pending` | Đang chờ đồng bộ. |
| `synced` | Event đã được tạo/cập nhật thành công. |
| `failed` | Đồng bộ lỗi; có thể retry. |
| `cancelled` | Event đã được xóa/hủy theo booking. |

# Danh sách API tổng hợp

| Module | Endpoint | Quyền chính |
|---|---|---|
| Auth | `POST /api/auth/register` | Public |
| Auth | `POST /api/auth/login` | Public |
| Auth | `POST /api/auth/refresh`, `POST /api/auth/logout` | Người dùng có phiên |
| Auth | `GET /api/auth/me` | Người dùng đăng nhập |
| Questionnaire | `GET /api/questionnaires/:role` | Public hoặc người dùng đăng nhập tùy cấu hình |
| Taxonomy | `GET /api/taxonomies`, `GET /api/taxonomies/:id/children` | Public đọc danh mục active |
| Taxonomy Admin | `POST /api/admin/taxonomies`, `PATCH /api/admin/taxonomies/:id` | Admin |
| Learner | `GET/PUT /api/learners/preferences/me` | Learner sở hữu |
| Learner | `POST /api/learners/preferences/complete` | Learner sở hữu |
| Tutor | `GET/PUT /api/tutors/profile/me` | Tutor sở hữu |
| Tutor | `POST /api/tutors/profile/submit` | Tutor sở hữu |
| Tutor Search | `GET /api/tutors`, `GET /api/tutors/:id` | Public với dữ liệu công khai |
| Tutor Admin | `PATCH /api/admin/tutors/:id/approval` | Admin |
| Recommendation | `POST /api/recommendations/tutors` | Learner |
| Availability | `POST /api/availability`, `GET /api/availability/mine` | Tutor |
| Availability | `PATCH/DELETE /api/availability/:id` | Tutor sở hữu slot |
| Availability | `GET /api/tutors/:id/availability` | Public/Learner theo policy |
| Booking | `POST /api/bookings`, `GET /api/bookings/me` | Learner |
| Booking | `PATCH /api/bookings/:id/confirm`, `/reject` | Tutor sở hữu booking |
| Booking | `PATCH /api/bookings/:id/cancel` | Bên sở hữu theo policy |
| Booking | `PATCH /api/bookings/:id/complete` | Role/quy trình được phân quyền |
| Calendar | `GET /api/calendar/status`, `GET /api/calendar/oauth` | Người dùng sở hữu connection |
| Calendar | `GET /api/calendar/oauth/callback`, `POST /api/calendar/disconnect` | OAuth state/Người dùng sở hữu |
| Review | `POST /api/reviews` | Learner có booking completed |
| Review | `GET /api/tutors/:id/reviews` | Public đọc |
| Admin | `GET /api/admin/users`, `GET /api/admin/bookings` | Admin |

Tên endpoint có thể điều chỉnh để tương thích API đang có; cần chốt API contract với Frontend trước khi triển khai.

# Kiểm thử nghiệp vụ bắt buộc

## Auth và onboarding

- Email trùng, mật khẩu sai, token hết hạn, refresh token bị revoke.
- Learner không thể ghi TutorProfile; Tutor không thể ghi LearnerPreference.
- Lưu nháp và tiếp tục onboarding không làm mất câu trả lời cũ.
- Q2/Q3 không hợp lệ với Q1 hoặc ID taxonomy inactive phải bị từ chối.
- Số lựa chọn vượt giới hạn (Q12/Q22) bị từ chối.
- Profile thiếu trường bắt buộc không được đánh dấu completed.

## Hồ sơ và recommendation

- Tutor pending/rejected/locked không xuất hiện trong kết quả gợi ý.
- Môn học không tương thích hoặc chứng chỉ bắt buộc không đáp ứng phải bị loại.
- Cùng input và cùng algorithmVersion cho kết quả nhất quán.
- Xử lý được profile thiếu tiêu chí tùy chọn, không có Tutor phù hợp và nhiều Tutor bằng điểm.
- Tutor không có review không bị mặc định điểm 0.
- MatchedReasons không được nêu tiêu chí chưa có dữ liệu xác nhận.
- Ngân sách, giá và thời lượng được so sánh cùng đơn vị.

## Availability và booking

- Không tạo slot có startAt >= endAt hoặc trong quá khứ.
- Slot của cùng Tutor không chồng lấn.
- Hai Learner tạo yêu cầu cùng slot; chỉ một booking có thể được xác nhận.
- Hai thao tác confirm đồng thời không thể cùng chiếm một slot.
- Tutor không thể sửa/xóa slot đã có booking confirmed trái policy.
- Learner không thể xem/sửa booking của người khác.
- Tutor không thể xử lý booking của Tutor khác.
- Rejected/cancelled giải phóng slot đúng chính sách; confirmed giữ slot.

## Calendar và Review

- Một bên chưa kết nối Calendar không ảnh hưởng booking.
- Google API lỗi không rollback booking confirmed.
- Retry không tạo event trùng.
- Token bị thu hồi được xử lý và cập nhật sync status.
- Chỉ booking completed hợp lệ mới tạo được review.
- Một booking không tạo nhiều review trái quy tắc.

# Thứ tự ưu tiên triển khai

| Mức ưu tiên | Phạm vi | Lý do | Trạng thái triển khai |
|---|---|---|---|
| P0 – Nền tảng | Auth/role, config, database, validation, error handling | Bắt buộc cho mọi module. | **Hoàn thành 100%** (Phase 1, 2) |
| P1 – Dữ liệu gốc | Taxonomy, questionnaire version, LearnerPreference, TutorProfile, onboarding | Tạo nguồn dữ liệu chính xác cho tìm kiếm và gợi ý. | **Hoàn thành 100%** (Phase 3, 4) |
| P2 – Tutor discovery | Admin approval, Tutor search, Content-based Filtering | Đáp ứng mục tiêu kết nối/gợi ý gia sư. | **Hoàn thành 100%** (Phase 5, 6) |
| P3 – Booking core | Availability CRUD, booking state machine, chống đặt trùng | Hoàn tất hành trình chọn và đặt gia sư. | **Hoàn thành 100%** (Phase 7, 8) |
| P4 – Chất lượng và tích hợp | Review/rating, Google Calendar, notification | Cải thiện trải nghiệm và đồng bộ lịch. | **Kế hoạch tiếp theo** (Phase 9, 10) |
| P5 – Vận hành nâng cao | Admin dashboard, analytics, monitoring, backup nâng cao | Phục vụ mở rộng và vận hành lâu dài. | **Kế hoạch tiếp theo** (Phase 10) |

Có thể triển khai Availability song song với Recommendation sau khi TutorProfile và taxonomy ổn định. Không nên triển khai booking trước khi thống nhất state machine, quy tắc chiếm slot và quyền sở hữu.

# Các quyết định nhóm cần chốt trước khi lập trình

1. Q1 lĩnh vực và Q2/Q3 môn/chuyên môn là single-select hay multi-select ở từng vai trò?
2. Learner có cần khai báo ngôn ngữ Tutor dùng để giảng dạy không? Nếu có, bổ sung câu hỏi nào?
3. Learner muốn học Offline ở khu vực nào? Cần bổ sung tỉnh/thành hoặc phường/xã hay chỉ cần địa điểm chung?
4. Ngân sách Learner và học phí Tutor tính theo buổi hay theo 60 phút? Các khoảng giá có biên đóng/mở thế nào?
5. Giá Tutor là giá cố định, khoảng giá hay có thể thương lượng?
6. Chứng chỉ nào là điều kiện bắt buộc? Có cần upload minh chứng và Admin xác minh không?
7. `pending` có giữ slot hay chỉ `confirmed` mới chiếm slot? Bản đề xuất MVP chọn `confirmed` mới chiếm slot để tránh phải triển khai hold timeout ngay.
8. Booking có cho phép đổi lịch không? Ai chịu trách nhiệm cập nhật slot và Calendar event?
9. Review cho phép một lần theo booking hay có phản hồi từ Tutor?
10. Trọng số Recommendation dùng công thức ban đầu `35/20/20/15/10` hay công thức cập nhật `30/20/15/10/10/5/5/5` trong tài liệu này?

# Kết luận

Roadmap Backend 2.0 lấy dữ liệu onboarding làm nền tảng cho chức năng gợi ý. `LearnerPreference` mô tả nhu cầu học tập; `TutorProfile` mô tả năng lực giảng dạy; cả hai dùng taxonomy chung để Backend đối chiếu nhất quán.

Thứ tự triển khai khuyến nghị: **Auth → Taxonomy/Questionnaire → Onboarding/Profile → Tutor Approval/Search → Recommendation → Availability → Booking → Review/Calendar → Admin/Operations**.

Trước khi code, nhóm cần chốt taxonomy, các câu hỏi chưa đối xứng, cách quy đổi giá/thời lượng, khu vực Offline, trọng số và quy tắc pending/confirmed chiếm slot. API contract thống nhất sẽ hạn chế thay đổi schema và lỗi tích hợp Frontend–Backend.
