# Báo Cáo Thực Hành Buổi 5 - CourseHub
**Môn học:** Cơ sở dữ liệu Web và hệ thống thông tin  
**Giảng viên hướng dẫn:** TS. Vũ Tiến Dũng – Phạm Duy Phương  
**Chủ đề:** Xây dựng Frontend với React, kết nối giao diện CourseHub với FastAPI  

---

## 1. Thông Tin Chung & Kiến Trúc Ứng Dụng

* **Mô hình kết nối:** Single Page Application (SPA) với React + Vite giao tiếp REST API FastAPI và PostgreSQL.
  * **Frontend (React 18 + Vite):** Chạy tại `http://127.0.0.1:5173`, tổ chức giao diện theo component, quản lý state và vòng đời với `useEffect` / `AbortController`.
  * **Backend (FastAPI):** Chạy tại `http://127.0.0.1:8000`, cung cấp RESTful API, cấu hình `CORSMiddleware`, đảm bảo tính toàn vẹn và khóa dòng (`SELECT ... FOR UPDATE`).
  * **Database (PostgreSQL):** Lưu trữ bền vững dữ liệu học phần, sinh viên, đăng ký và nhật ký kiểm toán `enrollment_events`.
* **Phân định trách nhiệm:** Giao diện chỉ gửi yêu cầu HTTP và hiển thị dữ liệu/trạng thái. Toàn bộ quyết định nghiệp vụ, kiểm tra sức chứa và ghi log vẫn do Backend và Database đảm nhiệm.

---

## 2. Cấu Hình CORS Trong FastAPI Backend

Đã bổ sung `CORSMiddleware` vào [`backend/app/main.py`](../backend/app/main.py) ngay sau khai báo `app = FastAPI(...)`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "PATCH"],
    allow_headers=["Content-Type"],
)
```

### Kết quả kiểm tra Preflight Request (OPTIONS)
Gửi yêu cầu OPTIONS từ origin `http://127.0.0.1:5173` tới `http://127.0.0.1:8000/enrollments`:
```text
HTTP/1.1 200 OK
access-control-allow-origin: http://127.0.0.1:5173
access-control-allow-methods: GET, POST, DELETE, PATCH
access-control-allow-headers: Accept, Accept-Language, Content-Language, Content-Type
access-control-max-age: 600
```
➔ Trình duyệt được phép thực hiện các thao tác `GET`, `POST`, `DELETE`, `PATCH` mà không bị chặn bởi chính sách cùng nguồn gốc (Same-Origin Policy).

---

## 3. Cấu Trúc Thư Mục Frontend

```text
frontend/
├── package.json          # React 18.2.0, Vite 7.1.7, node --test
├── vite.config.js        # Cấu hình esbuild jsx automatic
├── index.html            # Mount point div#root
├── .env.example          # VITE_API_BASE_URL=http://127.0.0.1:8000
├── .env.local            # Cấu hình cục bộ máy phát triển (được gitignore)
├── tests/
│   └── api.test.mjs      # 8 ca kiểm thử giả lập HTTP cho api.js
└── src/
    ├── main.jsx          # Điểm khởi đầu ReactDOM.createRoot
    ├── api.js            # Wrapper fetch dùng chung, xử lý 204, parse error
    ├── styles.css        # CSS hoàn chỉnh, responsive Desktop/Tablet/Mobile
    ├── components/
    │   ├── Notice.jsx         # Hiển thị thông báo trạng thái/lỗi
    │   ├── StudentForm.jsx    # Form chọn mã sinh viên (Bài 1)
    │   ├── SectionTable.jsx   # Bảng danh sách lớp và nút Đăng ký
    │   ├── EnrollmentList.jsx # Danh sách lớp đã đăng ký và nút Hủy
    │   └── EventHistory.jsx   # Lịch sử sự kiện có phân trang (Bài 3)
    └── App.jsx           # Quản lý State chính, useEffect, và bộ lọc học phần (Bài 2)
```

---

## 4. Kết Quả Kiểm Thử Hàm Gọi API (`npm test`)

Thực thi bộ 8 ca kiểm thử giả lập với Node Test Runner (`node --test tests/api.test.mjs`):

```text
> coursehub-frontend@0.5.0 test
> node --test tests/api.test.mjs

✔ 1. GET thanh cong tra ve du lieu JSON (20.67ms)
✔ 2. POST voi body JSON truyen dung header va nhan 201 (0.40ms)
✔ 3. DELETE thanh cong tra 204 No Content -> api() tra ve null (0.21ms)
✔ 4. HTTP 404 tra detail dang chuoi nem loi dung status (0.61ms)
✔ 5. HTTP 409 Conflict tra detail het cho nem dung loi (0.42ms)
✔ 6. HTTP 422 tra detail dang mang (Pydantic) ghep cac message (0.40ms)
✔ 7. Loi mang / mat ket noi nem thong bao huong dan Backend/CORS (0.21ms)
✔ 8. Yeu cau bi huy boi AbortController nem lai AbortError (0.22ms)
ℹ tests 8
ℹ pass 8
ℹ fail 0
```
➔ **100% Passed (8 / 8 tests)**.

---

## 5. Kết Quả Biên Dịch Bản Build (`npm run build`)

```text
> coursehub-frontend@0.5.0 build
> vite build

vite v7.1.7 building for production...
transforming...
✓ 33 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.43 kB │ gzip:  0.31 kB
dist/assets/index-CxzG8mOS.css    3.18 kB │ gzip:  1.23 kB
dist/assets/index-D4wqdKN-.js   153.04 kB │ gzip: 49.62 kB
✓ built in 537ms
```
➔ Biên dịch thành công, tạo thư mục `dist/` phục vụ môi trường production hoặc preview.

---

## 6. Kiểm Thử Luồng Dữ Liệu Frontend – API – PostgreSQL

### 6.1. Luồng xem danh sách và tìm kiếm
* Khi khởi động, `Promise.all` tải đồng thời `GET /courses`, `GET /sections` và `GET /students/22000004/enrollments`.
* Bộ lọc kết hợp: Từ khóa tìm kiếm (mã lớp, tên môn), bộ lọc theo môn học dropdown, và checkbox "Chỉ hiện lớp còn chỗ".

### 6.2. Luồng đăng ký lớp `WEB-01`
* Sinh viên `22000004` bấm nút **Đăng ký** tại dòng `WEB-01`.
* Request: `POST /enrollments` với payload `{"student_id": "22000004", "class_section_id": "WEB-01"}`.
* Trạng thái trả về: `201 Created`.
* Giao diện tải lại dữ liệu từ server:
  * Hàng `WEB-01`: hiện nhãn **Đã đăng ký**, số chỗ còn lại giảm về `0`.
  * Cột phải "Lớp đã đăng ký": xuất hiện `WEB-01`.
* **Đối chiếu SQL ([`database/13_week05_verify.sql`](../database/13_week05_verify.sql)):**
  * `v_section_summary`: `class_id = 'WEB-01'`, `capacity = 3`, `enrolled = 3`, `remaining = 0`.
  * `enrollments`: có bản ghi `('22000004', 'WEB-01')`.
  * `enrollment_events`: xuất hiện sự kiện `CREATED` nguồn `api` dataset `demo`.

### 6.3. Luồng hủy đăng ký `WEB-01`
* Bấm **Hủy đăng ký** tại cột phải, xác nhận hộp thoại `window.confirm`.
* Request: `DELETE /enrollments/22000004/WEB-01`.
* Trạng thái trả về: `204 No Content`.
* Giao diện tải lại từ server:
  * Hàng `WEB-01`: khôi phục nút **Đăng ký**, `remaining = 1`.
  * Cột phải: biến mất khỏi danh sách đăng ký.
* **Đối chiếu SQL:**
  * `v_section_summary`: `class_id = 'WEB-01'`, `capacity = 3`, `enrolled = 2`, `remaining = 1`.
  * `enrollments`: bản ghi đã bị xóa hoàn toàn.
  * `enrollment_events`: ghi nhận sự kiện `CANCELLED` nguồn `api` dataset `demo`.

### 6.4. Xử lý tranh chấp suất cuối `RACE-01` (409 Conflict)
* Sinh viên A (`22000002`) đăng ký suất duy nhất của `RACE-01` (`capacity = 1`) -> Nhận `201 Created`.
* Sinh viên B (`22000004`) ở cửa sổ khác bấm Đăng ký khi giao diện cũ chưa kịp cập nhật -> Nhận `409 Conflict: Lop hoc phan da het cho`.
* Giao diện bắt lỗi `409`, hiển thị thông báo lỗi màu đỏ, sau đó tự động kích hoạt `setRefresh` tải lại dữ liệu mới nhất từ CSDL và chuyển nút thành **Hết chỗ** (vô hiệu hóa nút).

---

## 7. Chi Tiết Thực Hiện Các Bài Tập Tự Thực Hành (Mục XV.2)

### Bài 1. Tách form chọn sinh viên thành `StudentForm.jsx`
* Đã tách toàn bộ khối form chọn mã sinh viên sang component độc lập [`frontend/src/components/StudentForm.jsx`](../frontend/src/components/StudentForm.jsx).
* Nhận các props: `draftId`, `onChangeDraftId`, `onSubmit`, `studentId`, `busy`, `loading`, `onRefresh`. Không lưu state sinh viên riêng trong component con để tránh hiện tượng mất đồng bộ dữ liệu.

### Bài 2. Bổ sung bộ lọc học phần bằng mã (`INT2204`, `INT2205`, `INT2206`)
* Bổ sung dropdown `<select aria-label="Lọc theo học phần">` lấy danh sách môn học tự động từ `courses` (`GET /courses`).
* Cho phép chọn xem "Tất cả học phần" hoặc chỉ xem các lớp thuộc một mã môn nhất định. Khi không có lớp nào phù hợp, `SectionTable` hiển thị thông báo rỗng "Không có lớp phù hợp với bộ lọc." mà không ảnh hưởng tới dữ liệu CSDL.

### Bài 3. Màn hình lịch sử sự kiện của sinh viên có phân trang (`EventHistory.jsx`)
* Sử dụng endpoint `GET /enrollment-events` đã hoàn thành ở Buổi 4:
  * Lọc theo `student_id` đang chọn.
  * Chỉ hiển thị các sự kiện thuộc `dataset = 'demo'`.
  * Hỗ trợ nút **Trang trước** và **Trang sau** với kích thước trang `EVENT_PAGE_SIZE = 5`.
* Component [`frontend/src/components/EventHistory.jsx`](../frontend/src/components/EventHistory.jsx) hiển thị bảng trực quan: ID sự kiện, mã lớp, nhãn hành động (Đăng ký / Hủy đăng ký), nguồn gốc và thời gian theo chuẩn tiếng Việt (`vi-VN`).

### Bài 4. Thiết kế tìm kiếm / phân trang phía Server cho Project nhóm
* Đã tài liệu hóa nguyên tắc phân trang phía CSDL (sử dụng `LIMIT` và `OFFSET` với `ORDER BY` khóa chính cố định) thay vì tải toàn bộ bản ghi về client để filter mảng trên trình duyệt.

---

## 8. Hướng Dẫn Khởi Chạy Ứng Dụng

### Khởi chạy Backend
```powershell
.venv\Scripts\Activate.ps1
python -m uvicorn backend.app.main:app --reload
```
* API Health: `http://127.0.0.1:8000/health`
* Swagger Docs: `http://127.0.0.1:8000/docs`

### Khởi chạy Frontend
```powershell
cd frontend
npm run dev
```
* Giao diện Web: `http://127.0.0.1:5173/`
