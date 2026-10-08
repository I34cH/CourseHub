# Báo Cáo Thực Hành Tuần 2 - CourseHub

## 1. Thông Tin Chung & Khởi Tạo
- **Cơ sở dữ liệu**: `coursehub` (PostgreSQL)
- **Thứ tự thực thi**: `01_schema.sql` -> `02_seed.sql` -> `04_views.sql`
- **Dữ liệu chuẩn ban đầu**: 4 sinh viên, 3 học phần, 1 học kỳ, 2 giảng viên, 4 lớp học phần, 5 đăng ký.
- **Trạng thái lớp tiêu biểu**: 
  - `WEB-01`: 2 đăng ký, còn 1 chỗ.
  - `WEB-02`: 0 đăng ký, còn 2 chỗ.

---

## 2. Kết Quả Các Truy Vấn (03_queries.sql)

### Truy vấn 1: Danh sách tất cả các học phần
```sql
SELECT code, name, credits
FROM courses
ORDER BY code;
```
**Kết quả:**
| code | name | credits |
| :--- | :--- | :--- |
| INT2204 | Co so du lieu Web va he thong thong tin | 3 |
| INT2205 | Khai pha du lieu | 3 |
| INT2206 | Lap trinh Python | 2 |

---

### Truy vấn 2: Tìm học phần theo từ khóa 'web'
```sql
SELECT code, name
FROM courses
WHERE LOWER(code) LIKE '%web%'
OR LOWER(name) LIKE '%web%'
ORDER BY code;
```
**Kết quả:**
| code | name |
| :--- | :--- |
| INT2204 | Co so du lieu Web va he thong thong tin |

---

### Truy vấn 3: Danh sách lớp học phần sinh viên 22000001 đã đăng ký
```sql
SELECT student_id, class_section_id
FROM enrollments
WHERE student_id = '22000001'
ORDER BY class_section_id;
```
**Kết quả:**
| student_id | class_section_id |
| :--- | :--- |
| 22000001 | DM-01 |
| 22000001 | WEB-01 |

---

### Truy vấn 4: Thông tin chi tiết đăng ký của sinh viên 22000001 (kèm tên SV, mã HP)
```sql
SELECT s.name AS student_name,
cs.id AS class_id,
c.code AS course_code
FROM enrollments AS e
JOIN students AS s ON s.id = e.student_id
JOIN class_sections AS cs ON cs.id = e.class_section_id
JOIN courses AS c ON c.code = cs.course_code
WHERE s.id = '22000001'
ORDER BY cs.id;
```
**Kết quả:**
| student_name | class_id | course_code |
| :--- | :--- | :--- |
| Nguyen Minh Anh | DM-01 | INT2205 |
| Nguyen Minh Anh | WEB-01 | INT2204 |

---

### Truy vấn 5: Thống kê số lượng sinh viên đã đăng ký và số chỗ còn lại theo từng lớp
```sql
SELECT cs.id AS class_id,
cs.course_code,
cs.capacity,
COUNT(e.student_id) AS enrolled,
cs.capacity - COUNT(e.student_id) AS remaining
FROM class_sections AS cs
LEFT JOIN enrollments AS e ON e.class_section_id = cs.id
GROUP BY cs.id, cs.course_code, cs.capacity
ORDER BY cs.id;
```
**Kết quả:**
| class_id | course_code | capacity | enrolled | remaining |
| :--- | :--- | :--- | :--- | :--- |
| DM-01 | INT2205 | 2 | 2 | 0 |
| PY-01 | INT2206 | 2 | 1 | 1 |
| WEB-01 | INT2204 | 3 | 2 | 1 |
| WEB-02 | INT2204 | 2 | 0 | 2 |

---

### Truy vấn 6: Danh sách sinh viên chưa đăng ký bất kỳ lớp học phần nào
```sql
SELECT s.id, s.name
FROM students AS s
WHERE NOT EXISTS (
SELECT 1
FROM enrollments AS e
WHERE e.student_id = s.id
)
ORDER BY s.id;
```
**Kết quả:**
| id | name |
| :--- | :--- |
| 22000004 | Le Hoang Nam |

---

### Truy vấn 7: Danh sách các lớp học phần còn chỗ trống (sử dụng CTE)
```sql
WITH section_counts AS (
SELECT cs.id AS class_id,
cs.capacity,
COUNT(e.student_id) AS enrolled
FROM class_sections AS cs
LEFT JOIN enrollments AS e ON e.class_section_id = cs.id
GROUP BY cs.id, cs.capacity
)
SELECT class_id, capacity, enrolled,
capacity - enrolled AS remaining
FROM section_counts
WHERE enrolled < capacity
ORDER BY class_id;
```
**Kết quả:**
| class_id | capacity | enrolled | remaining |
| :--- | :--- | :--- | :--- |
| PY-01 | 2 | 1 | 1 |
| WEB-01 | 3 | 2 | 1 |
| WEB-02 | 2 | 0 | 2 |

---

### Truy vấn 8: Xếp hạng mức độ phổ biến của học phần theo số lượt đăng ký (CTE + DENSE_RANK)
```sql
WITH course_totals AS (
SELECT c.code, COUNT(e.student_id) AS total
FROM courses AS c
LEFT JOIN class_sections AS cs ON cs.course_code = c.code
LEFT JOIN enrollments AS e ON e.class_section_id = cs.id
GROUP BY c.code
)
SELECT code, total,
DENSE_RANK() OVER (ORDER BY total DESC) AS demand_rank
FROM course_totals
ORDER BY total DESC, code;
```
**Kết quả:**
| code | total | demand_rank |
| :--- | :--- | :--- |
| INT2204 | 2 | 1 |
| INT2205 | 2 | 1 |
| INT2206 | 1 | 2 |

---

## 3. Kết Quả Truy Vấn View (04_views.sql)

### 3.1. Xem toàn bộ thống kê các lớp từ `v_section_summary`
```sql
SELECT class_id, course_code, capacity, enrolled, remaining
FROM v_section_summary
ORDER BY class_id;
```
**Kết quả:**
| class_id | course_code | capacity | enrolled | remaining |
| :--- | :--- | :--- | :--- | :--- |
| DM-01 | INT2205 | 2 | 2 | 0 |
| PY-01 | INT2206 | 2 | 1 | 1 |
| WEB-01 | INT2204 | 3 | 2 | 1 |
| WEB-02 | INT2204 | 2 | 0 | 2 |

### 3.2. Lọc các lớp còn chỗ trống từ view
```sql
SELECT class_id, remaining
FROM v_section_summary
WHERE remaining > 0
ORDER BY class_id;
```
**Kết quả:**
| class_id | remaining |
| :--- | :--- |
| PY-01 | 1 |
| WEB-01 | 1 |
| WEB-02 | 2 |

---

## 4. Thử Nghiệm Ràng Buộc (05_constraint_checks.sql)
Các câu lệnh cố ý vi phạm để kiểm chứng cơ chế toàn vẹn dữ liệu:
1. **Đăng ký trùng lớp**: Bị từ chối bởi khóa chính `pk_enrollments` (*ERROR: duplicate key value violates unique constraint "pk_enrollments"*).
2. **Đăng ký cho sinh viên không tồn tại**: Bị từ chối bởi khóa ngoại `FOREIGN KEY` (*ERROR: insert or update on table "enrollments" violates foreign key constraint*).
3. **Đổi capacity về 0**: Bị từ chối bởi `CHECK ck_sections_capacity (capacity > 0)`.
4. **Cập nhật credits = NULL**: Bị từ chối bởi `NOT NULL`.
5. **Cập nhật trùng email**: Bị từ chối bởi `UNIQUE uq_students_email`.
6. **Họ tên chỉ gồm khoảng trắng**: Bị từ chối bởi `CHECK (trim(name) <> '')`.
7. **Kiểm tra lại tổng số lượt đăng ký**:
   ```sql
   SELECT COUNT(*) AS total_enrollments FROM enrollments;
   ```
   Kết quả trả về: `total_enrollments = 5` (dữ liệu vẫn an toàn và nguyên vẹn).

---

## 5. Thử Nghiệm Giao Dịch & View (06_view_demo.sql)
1. Trong giao dịch (`BEGIN; INSERT ...`):
   Lớp `WEB-01` tăng số đăng ký từ 2 lên 3, chỗ còn lại giảm từ 1 về 0.
2. Sau khi hủy bỏ giao dịch (`ROLLBACK;`):
   Lớp `WEB-01` hoàn tác trở về đúng 2 đăng ký, còn lại 1 chỗ.

---

## 6. Đối Chiếu Truy Vấn Do AI Đề Xuất (07_ai_query.sql)
- **Truy vấn sai (dùng `COUNT(*)` với `LEFT JOIN`)**: Với lớp `WEB-02` chưa có sinh viên nào đăng ký, `LEFT JOIN` vẫn giữ lại 1 dòng của bảng `class_sections`, dẫn đến `COUNT(*)` đếm thành **1** (sai nghiệp vụ).
- **Truy vấn đã sửa (dùng `COUNT(e.student_id)`)**: Chỉ đếm các giá trị không `NULL` của khóa sinh viên tham gia đăng ký, trả về chính xác **0** (đúng nghiệp vụ).
