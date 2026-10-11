# Báo Cáo Thực Hành Tuần 3 - CourseHub
**Môn học:** Cơ sở dữ liệu Web và hệ thống thông tin  
**Giảng viên hướng dẫn:** TS. Vũ Tiến Dũng – Phạm Duy Phương  
**Chủ đề:** Xây dựng Backend API với FastAPI, kết nối PostgreSQL và kiểm thử bằng Postman  

---

## 1. Thông Tin Chung & Khởi Tạo Môi Trường

* **Kiến trúc ứng dụng:** Mô hình phân tầng Controller / Model.
  * **FastAPI** đảm nhận vai trò định tuyến, xác thực schema dữ liệu và điều phối request/response.
  * **SQLAlchemy Core & psycopg 3** quản lý kết nối và thực thi các truy vấn SQL có tham số tới cơ sở dữ liệu **PostgreSQL** (`coursehub`).
  * **Postman / Swagger UI** đóng vai trò API client kiểm thử chức năng.
* **Môi trường ảo:** Sử dụng `.venv` cô lập với Python 3.11.
* **Bảo mật biến môi trường:**
  * Thông tin kết nối CSDL được cấu hình trong `backend/.env`.
  * Đã kiểm tra `.gitignore` đảm bảo file `.env` không bị đưa lên Git repository (`git check-ignore -v backend/.env`). File mẫu được lưu tại `backend/.env.example`.
* **Khởi chạy ứng dụng:**
  ```powershell
  python -m uvicorn backend.app.main:app --reload
  ```
  * Swagger UI tự động: `http://127.0.0.1:8000/docs`
  * Postman Environment: `base_url = http://127.0.0.1:8000`

---

## 2. Bảng Tổng Hợp Danh Sách API Endpoints

Hệ thống đã hoàn thiện **100% phần cốt lõi** và **toàn bộ 4 bài tập tự thực hành (Bài 1 - Bài 4)**:

| STT | HTTP Method | Endpoint | Chức năng | Phân loại | Status Code |
| :---: | :---: | :--- | :--- | :---: | :---: |
| 1 | `GET` | `/` | Kiểm tra trạng thái hoạt động gốc | Cốt lõi | `200` |
| 2 | `GET` | `/health` | Kiểm tra kết nối CSDL PostgreSQL | Cốt lõi | `200` / `503` |
| 3 | `GET` | `/courses` | Danh sách học phần, tìm kiếm (`q`), phân trang (`skip`, `limit`) | Mở rộng (Bài 4) | `200` / `400` |
| 4 | `GET` | `/courses/{course_code}` | Chi tiết học phần theo mã | Cốt lõi | `200` / `404` |
| 5 | `GET` | `/lecturers` | Danh sách giảng viên tăng dần theo ID | Bài 1 | `200` |
| 6 | `GET` | `/sections` | Danh sách lớp học phần (lọc lớp còn chỗ `available_only`) | Cốt lõi | `200` |
| 7 | `GET` | `/sections/{section_id}` | Chi tiết lớp học phần (kèm môn, kỳ, giảng viên, sĩ số) | Bài 2 | `200` / `404` |
| 8 | `PATCH` | `/sections/{section_id}/capacity` | Cập nhật sức chứa lớp học phần (chống giảm < số đã đăng ký) | Bài 3 | `200` / `404` / `409` |
| 9 | `GET` | `/students/{student_id}/enrollments` | Danh sách lớp học phần sinh viên đã đăng ký | Cốt lõi | `200` / `404` |
| 10 | `POST` | `/enrollments` | Đăng ký lớp học phần mới (kiểm tra tồn tại, trùng lặp, hết chỗ) | Cốt lõi | `201` / `404` / `409` / `422` |
| 11 | `DELETE`| `/enrollments/{student_id}/{class_section_id}` | Hủy đăng ký lớp học phần | Cốt lõi | `204` / `404` |

---

## 3. Bảng Kết Quả Kiểm Thử Postman Runner (23 / 23 Tests PASS)

Toàn bộ bộ sưu tập `CourseHub API - Buoi 3` được kiểm thử tự động tuần tự qua Postman Runner và đạt kết quả **100% Passed**:

| Mã Request | Tên Request | Method & URL | Kỳ vọng HTTP | Test Assertion | Kết quả |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **01** | `01 - Health Check` | `GET {{base_url}}/health` | `200 OK` | `status == "ok"`, `database == "connected"` | **PASS** |
| **02** | `02 - List courses` | `GET {{base_url}}/courses` | `200 OK` | Số học phần >= 3 | **PASS** |
| **03** | `03 - Search courses` | `GET {{base_url}}/courses?q=web` | `200 OK` | Chứa môn `INT2204` | **PASS** |
| **04** | `04 - Search empty error` | `GET {{base_url}}/courses?q=%20%20` | `400 Bad Request` | Từ khóa rỗng bị từ chối | **PASS** |
| **05** | `05 - Courses pagination` | `GET {{base_url}}/courses?skip=0&limit=2` | `200 OK` | Đúng 2 học phần đầu tiên | **PASS** |
| **06** | `06 - Course detail` | `GET {{base_url}}/courses/INT2204` | `200 OK` | Mã `INT2204`, số tín chỉ = 3 | **PASS** |
| **07** | `07 - Course not found` | `GET {{base_url}}/courses/UNKNOWN` | `404 Not Found` | Không tìm thấy học phần | **PASS** |
| **08** | `08 - List lecturers` | `GET {{base_url}}/lecturers` | `200 OK` | Chứa giảng viên `GV01` và `GV02` | **PASS** |
| **09** | `09 - List sections all` | `GET {{base_url}}/sections` | `200 OK` | Đúng 4 lớp học phần | **PASS** |
| **10** | `10 - Available sections` | `GET {{base_url}}/sections?available_only=true` | `200 OK` | Tất cả lớp trả về đều có `remaining > 0` | **PASS** |
| **11** | `11 - Section detail` | `GET {{base_url}}/sections/WEB-01` | `200 OK` | Đúng thông tin `WEB-01`, GV `GV01` | **PASS** |
| **12** | `12 - Section not found` | `GET {{base_url}}/sections/UNKNOWN` | `404 Not Found` | Không tìm thấy lớp học phần | **PASS** |
| **13** | `13 - Update capacity` | `PATCH {{base_url}}/sections/WEB-01/capacity` (`4`) | `200 OK` | `capacity = 4`, `remaining = 2` | **PASS** |
| **14** | `14 - Update conflict` | `PATCH {{base_url}}/sections/WEB-01/capacity` (`1`) | `409 Conflict` | Từ chối giảm nhỏ hơn số đã đăng ký (2) | **PASS** |
| **15** | `15 - Reset capacity` | `PATCH {{base_url}}/sections/WEB-01/capacity` (`3`) | `200 OK` | Khôi phục `capacity = 3`, `remaining = 1` | **PASS** |
| **16** | `16 - Update not found` | `PATCH {{base_url}}/sections/UNKNOWN/capacity` | `404 Not Found` | Lớp không tồn tại | **PASS** |
| **17** | `17 - Student enrollments` | `GET {{base_url}}/students/22000001/enrollments` | `200 OK` | Sinh viên đã đăng ký đúng 2 lớp | **PASS** |
| **18** | `18 - Student not found` | `GET {{base_url}}/students/99999999/enrollments` | `404 Not Found` | Không tìm thấy sinh viên | **PASS** |
| **19** | `19 - Create enrollment` | `POST {{base_url}}/enrollments` (`22000004` vào `WEB-01`)| `201 Created` | Đăng ký thành công | **PASS** |
| **20** | `20 - Create duplicate` | `POST {{base_url}}/enrollments` (`22000004` vào `WEB-01`)| `409 Conflict` | Báo lỗi sinh viên đã đăng ký lớp này | **PASS** |
| **21** | `21 - Create validation`| `POST {{base_url}}/enrollments` (`student_id: "123"`)| `422 Unproc` | Pydantic chặn sai độ dài mã SV (8 số) | **PASS** |
| **22** | `22 - Delete enrollment` | `DELETE {{base_url}}/enrollments/22000004/WEB-01` | `204 No Content` | Hủy đăng ký thành công (dọn dẹp CSDL) | **PASS** |
| **23** | `23 - Delete not found` | `DELETE {{base_url}}/enrollments/22000004/WEB-01` | `404 Not Found` | Không tìm thấy đăng ký cần hủy (đã xóa)| **PASS** |

---

## 4. Chi Tiết Thực Hiện Các Bài Tập Tự Thực Hành

### Bài 1. API Danh Sách Giảng Viên (`GET /lecturers`)
* **Endpoint:** `GET /lecturers`
* **Mục tiêu:** Trả về danh sách giảng viên sắp xếp tăng dần theo `id`.
* **Câu lệnh SQL:**
  ```sql
  SELECT id, name
  FROM lecturers
  ORDER BY id;
  ```
* **Kết quả mẫu:**
  ```json
  [
    {
      "id": "GV01",
      "name": "Nguyen Thu Lan"
    },
    {
      "id": "GV02",
      "name": "Le Minh Son"
    }
  ]
  ```

---

### Bài 2. API Chi Tiết Một Lớp Học Phần (`GET /sections/{section_id}`)
* **Endpoint:** `GET /sections/{section_id}`
* **Mục tiêu:** Trả về thông tin lớp học phần, tên môn học, học kỳ, giảng viên phụ trách và sĩ số chi tiết.
* **Câu lệnh SQL:**
  ```sql
  SELECT cs.id AS class_id,
         cs.course_code,
         c.name AS course_name,
         cs.semester_code,
         sem.name AS semester_name,
         cs.lecturer_id,
         l.name AS lecturer_name,
         v.capacity,
         v.enrolled,
         v.remaining
  FROM class_sections cs
  JOIN courses c ON c.code = cs.course_code
  JOIN semesters sem ON sem.code = cs.semester_code
  JOIN lecturers l ON l.id = cs.lecturer_id
  JOIN v_section_summary v ON v.class_id = cs.id
  WHERE cs.id = :section_id;
  ```
* **Kết quả khi gọi `GET /sections/WEB-01`:**
  ```json
  {
    "class_id": "WEB-01",
    "course_code": "INT2204",
    "course_name": "Co so du lieu Web va he thong thong tin",
    "semester_code": "2026-1",
    "semester_name": "Hoc ky I - 2026",
    "lecturer_id": "GV01",
    "lecturer_name": "Nguyen Thu Lan",
    "capacity": 3,
    "enrolled": 2,
    "remaining": 1
  }
  ```

---

### Bài 3. Cập Nhật Sức Chứa Bằng PATCH (`PATCH /sections/{section_id}/capacity`)
* **Endpoint:** `PATCH /sections/{section_id}/capacity`
* **Pydantic Schema:**
  ```python
  class SectionCapacityUpdate(BaseModel):
      capacity: int = Field(gt=0, description="Suc chua moi phai lon hon 0")
  ```
* **Logic nghiệp vụ:**
  1. Kiểm tra lớp học phần tồn tại (nếu không có trả `404 Not Found`).
  2. Kiểm tra sức chứa mới không được nhỏ hơn số lượng sinh viên đã đăng ký:
     ```python
     if payload.capacity < int(section["enrolled"]):
         raise HTTPException(
             status_code=status.HTTP_409_CONFLICT,
             detail="Suc chua moi khong the nho hon so luong da dang ky",
         )
     ```
  3. Cập nhật `UPDATE class_sections SET capacity = :capacity WHERE id = :section_id` và trả về thông tin đã cập nhật.
* **Các trường hợp kiểm thử:**
  * Tăng lên 4: `200 OK`, `capacity = 4`, `remaining = 2`.
  * Giảm xuống 1 (trong khi đã có 2 đăng ký): `409 Conflict`.
  * Khôi phục về 3: `200 OK`, `capacity = 3`, `remaining = 1`.

---

### Bài 4. Tìm Kiếm Và Phân Trang (`GET /courses`)
* **Endpoint:** `GET /courses?skip=0&limit=10&q=...`
* **Tham số:**
  * `q`: Tùy chọn, tìm kiếm không phân biệt hoa thường theo mã và tên môn.
  * `skip`: Mặc định `0`, điều kiện `>= 0`.
  * `limit`: Mặc định `10`, điều kiện `1 <= limit <= 100`.
* **Câu lệnh SQL:**
  ```sql
  SELECT code, name, credits
  FROM courses
  ORDER BY code OFFSET :skip LIMIT :limit;
  ```
* **Kết quả khi gọi `GET /courses?skip=0&limit=2`:** Trả về đúng 2 môn học phần đầu tiên theo thứ tự mã môn.

---

## 5. Xác Nhận Toàn Vẹn CSDL & Quy Trình Dọn Dẹp

* **Nguyên tắc chuỗi kiểm thử:** Request `19` thực hiện `POST` đăng ký thêm sinh viên `22000004` vào lớp `WEB-01`, sau đó Request `22` thực hiện `DELETE` để hủy đăng ký này.
* **Trạng thái CSDL sau khi hoàn tất kiểm thử:**
  ```sql
  SELECT COUNT(*) AS total_enrollments FROM enrollments;
  -- Kết quả: 5 bản ghi (đúng chuẩn ban đầu)
  ```
  ```sql
  SELECT class_id, capacity, enrolled, remaining 
  FROM v_section_summary 
  ORDER BY class_id;
  ```
  * `DM-01`: capacity = 2, enrolled = 2, remaining = 0
  * `PY-01`: capacity = 2, enrolled = 1, remaining = 1
  * `WEB-01`: capacity = 3, enrolled = 2, remaining = 1
  * `WEB-02`: capacity = 2, enrolled = 0, remaining = 2
* ➔ **Dữ liệu được bảo toàn nguyên vẹn, sẵn sàng cho các bài thực hành tiếp theo.**