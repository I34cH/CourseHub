# CourseHub - Buoi 4

- Migration 001: enrollment_events.
- Demo class: RACE-01, capacity = 1.
- POST /enrollments: lock class_sections bang FOR UPDATE.
- Concurrency test: 1 request 201, 1 request 409.
- Performance data: 100000 rows, dataset=performance.
- Index: idx_enrollment_events_dataset_student_time.
- Scan type & Execution Time truoc/sau Index:
  - **Truoc Index:** `Seq Scan on enrollment_events` + `Sort (top-N heapsort)`, `Rows Removed by Filter: 99180`, `Buffers: shared hit=1137`, `Planning Time: 0.041 ms`, **`Execution Time: 6.083 ms`**.
  - **Sau Index:** `Index Scan using idx_enrollment_events_dataset_student_time`, `Index Searches: 1`, `Buffers: shared hit=53`, `Planning Time: 0.040 ms`, **`Execution Time: 0.042 ms`** (nhanh hon ~145 lan, giam doc buffer tu 1137 xuong 53 blocks).

Khong commit backend/.env.

---

# Báo Cáo Chi Tiết Thực Hành Buổi 4 - CourseHub
**Môn học:** Cơ sở dữ liệu Web và hệ thống thông tin  
**Chủ đề:** Transaction, Xử lý đồng thời (Concurrency), Migration và Tối ưu truy vấn trong CourseHub  

---

## 1. Migration 001 & Chuẩn Bị Lớp Học Phần Demo (`RACE-01`)

* **Tệp Migration:** [`database/migrations/001_add_enrollment_events.sql`](../database/migrations/001_add_enrollment_events.sql) và [`database/migrations/001_add_enrollment_events_rollback.sql`](../database/migrations/001_add_enrollment_events_rollback.sql).
* **Các bảng được bổ sung:**
  * `schema_migrations`: Lưu lịch sử phiên bản migration (`version = '001'`, `description = 'Add enrollment event audit table'`).
  * `enrollment_events`: Bảng nhật ký nghiệp vụ ghi nhận sự kiện `CREATED` và `CANCELLED`, phân tách rõ `dataset IN ('demo', 'performance')`.
* **Tạo lớp `RACE-01` ([`database/08_week04_demo_setup.sql`](../database/08_week04_demo_setup.sql)):**
  * Lớp `RACE-01` thuộc học phần `INT2204`, học kỳ `2026-1`, giảng viên `GV01`, với `capacity = 1`, `enrolled = 0`, `remaining = 1`.

---

## 2. Quan Sát Race Condition & Cơ Chế Khóa Dòng (`SELECT ... FOR UPDATE`)

### 2.1. Tái hiện Race Condition khi không khóa dòng ([`database/09_week04_race_condition_unsafe.sql`](../database/09_week04_race_condition_unsafe.sql))
* Khi Tab A và Tab B cùng đọc `COUNT(e.student_id) = 0` trước khi `INSERT` (Tab A dừng tại `pg_sleep(8)`):
  * Cả hai transaction đều thấy `enrolled = 0 < capacity (1)` nên cùng thực hiện `INSERT`.
  * **Kết quả sai lệch:** `capacity = 1`, `enrolled = 2`, `remaining = -1` (vượt sức chứa của lớp học phần).
* Sau thí nghiệm, chạy lại `08_week04_demo_setup.sql` để đưa `RACE-01` về `enrolled = 0`, `remaining = 1`.

### 2.2. Quan sát Row Lock với `SELECT ... FOR UPDATE` ([`database/10_week04_lock_demo.sql`](../database/10_week04_lock_demo.sql))
* Tab A chạy `SELECT id, capacity FROM class_sections WHERE id = 'RACE-01' FOR UPDATE;` và giữ lock trong 8 giây.
* Tab B chạy cùng câu lệnh `FOR UPDATE` phải **chờ tuần tự** cho đến khi Tab A `COMMIT` mới lấy được lock.

---

## 3. Nâng Cấp FastAPI (`v0.4.0`) & Kiểm Thử Đồng Thời (`Concurrency Test`)

### 3.1. Cập nhật Endpoint `POST /enrollments` và `DELETE /enrollments/{student_id}/{class_section_id}`
* Trong [`backend/app/main.py`](../backend/app/main.py):
  1. Kiểm tra sinh viên tồn tại (`404 Not Found` nếu không có).
  2. Khóa dòng lớp học phần bằng `SELECT id, capacity FROM class_sections WHERE id = :class_section_id FOR UPDATE`.
  3. Kiểm tra trùng lặp đăng ký (`409 Conflict`).
  4. Đếm số lượng đã đăng ký hiện tại sau khi đã giữ lock (`409 Conflict` nếu `enrolled >= capacity`).
  5. Thực hiện `INSERT INTO enrollments` và `INSERT INTO enrollment_events` (`CREATED`) trong cùng một khối `with engine.begin() as connection:`.
  6. Ở endpoint `DELETE`, khóa dòng `class_sections` bằng `FOR UPDATE`, xóa với `RETURNING student_id` và ghi sự kiện `CANCELLED` trong cùng transaction.

### 3.2. Kết quả kiểm thử tuần tự (Phần V.5)
```text
API Version: 0.4.0
POST 22000004 -> 201 {'message': 'Dang ky thanh cong', 'student_id': '22000004', 'class_section_id': 'RACE-01'}
POST 22000002 -> 409 {'detail': 'Lop hoc phan da het cho'}
DELETE 22000004/RACE-01 -> 204
Audit Events in DB:
  - {'id': 100001, 'student_id': '22000004', 'class_section_id': 'RACE-01', 'event_type': 'CREATED', 'source': 'api', 'dataset': 'demo'}
  - {'id': 100002, 'student_id': '22000004', 'class_section_id': 'RACE-01', 'event_type': 'CANCELLED', 'source': 'api', 'dataset': 'demo'}
```

### 3.3. Kết quả kiểm thử 2 Request đồng thời ([`backend/tests/week04_concurrency_test.py`](../backend/tests/week04_concurrency_test.py))
Sử dụng `ThreadPoolExecutor(max_workers=2)` và `threading.Barrier(2)` để 2 sinh viên `22000002` và `22000004` gửi request đăng ký vào lớp `RACE-01` (`capacity = 1`) cùng lúc:
```text
22000002 201 {'message': 'Dang ky thanh cong', 'student_id': '22000002', 'class_section_id': 'RACE-01'}
22000004 409 {'detail': 'Lop hoc phan da het cho'}
PASS: chi mot request dang ky thanh cong cho lop co 1 cho.
{'class_id': 'RACE-01', 'course_code': 'INT2204', 'capacity': 1, 'enrolled': 1, 'remaining': 0}
```

---

## 4. Đo Hiệu Năng Truy Vấn Trên 100.000 Sự Kiện & Composite Index

### 4.1. Sinh 100.000 dòng dữ liệu hiệu năng ([`database/11_generate_performance_events.sql`](../database/11_generate_performance_events.sql))
* Sinh 100.000 dòng với `dataset = 'performance'`, `source = 'generator'` bằng `generate_series(1, 100000)` và cập nhật thống kê bằng `ANALYZE enrollment_events;`.

### 4.2. So sánh `EXPLAIN (ANALYZE, BUFFERS)` trước và sau khi tạo Composite Index ([`database/12_explain_and_index.sql`](../database/12_explain_and_index.sql))

**Truy vấn cần đo:**
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, student_id, class_section_id, event_type, occurred_at
FROM enrollment_events
WHERE dataset = 'performance'
  AND student_id = '22000001'
  AND occurred_at >= TIMESTAMP '2025-12-20 00:00:00'
ORDER BY occurred_at DESC
LIMIT 50;
```

#### A. Trước khi tạo Index (`Seq Scan` + `Sort`)
```text
Limit  (cost=2912.91..2913.04 rows=50 width=39) (actual time=6.070..6.073 rows=50.00 loops=1)
  Buffers: shared hit=1137
  ->  Sort  (cost=2912.91..2914.86 rows=780 width=39) (actual time=6.069..6.071 rows=50.00 loops=1)
        Sort Key: occurred_at DESC
        Sort Method: top-N heapsort  Memory: 31kB
        Buffers: shared hit=1137
        ->  Seq Scan on enrollment_events  (cost=0.00..2887.00 rows=780 width=39) (actual time=0.026..5.947 rows=820.00 loops=1)
              Filter: ((occurred_at >= '2025-12-20 00:00:00'::timestamp without time zone) AND ((dataset)::text = 'performance'::text) AND ((student_id)::text = '22000001'::text))
              Rows Removed by Filter: 99180
              Buffers: shared hit=1137
Planning Time: 0.041 ms
Execution Time: 6.083 ms
```

#### B. Sau khi tạo Index `idx_enrollment_events_dataset_student_time` (`Index Scan`)
```sql
CREATE INDEX idx_enrollment_events_dataset_student_time
ON enrollment_events (dataset, student_id, occurred_at DESC);
ANALYZE enrollment_events;
```
```text
Limit  (cost=0.42..67.82 rows=50 width=39) (actual time=0.018..0.034 rows=50.00 loops=1)
  Buffers: shared hit=53
  ->  Index Scan using idx_enrollment_events_dataset_student_time on enrollment_events  (cost=0.42..1107.20 rows=821 width=39) (actual time=0.018..0.031 rows=50.00 loops=1)
        Index Cond: (((dataset)::text = 'performance'::text) AND ((student_id)::text = '22000001'::text) AND (occurred_at >= '2025-12-20 00:00:00'::timestamp without time zone))
        Index Searches: 1
        Buffers: shared hit=53
Planning Time: 0.040 ms
Execution Time: 0.042 ms
```

#### C. Bảng tổng hợp so sánh hiệu năng
| Tiêu chí | Trước khi có Index | Sau khi có Composite Index | Nhận xét |
| :--- | :--- | :--- | :--- |
| **Scan Type** | `Seq Scan` + `Sort (top-N heapsort)` | `Index Scan` | Không cần đọc toàn bảng và loại bỏ bước `Sort` |
| **Rows Removed by Filter** | `99,180` dòng | `0` dòng | Nhảy thẳng vào nhánh B-Tree của `(dataset, student_id)` |
| **Buffers (shared hit)** | `1,137` blocks | `53` blocks | Giảm ~95.3% số trang bộ nhớ phải đọc |
| **Execution Time** | **`6.083 ms`** | **`0.042 ms`** | Nhanh hơn **~145 lần** |

---

## 5. An Toàn Truy Vấn & Phòng Chống SQL Injection (Phần VIII)

* Đã kiểm thử truyền chuỗi tấn công SQL Injection vào query parameter `q`:
  * Request: `GET /courses?q=%25%27%20OR%20%271%27%3D%271%27--`
  * Kết quả: `200 OK`, trả về danh sách rỗng `[]`.
* Nhờ sử dụng **bind parameter** (`:keyword`) với `sqlalchemy.text()`, chuỗi đầu vào được driver `psycopg` gửi tách biệt khỏi cấu trúc câu lệnh SQL, ngăn chặn hoàn toàn việc thay đổi mệnh đề `WHERE`.

---

## 6. Kết Quả Các Bài Tập Tự Thực Hành (Phần XII)

### Bài 1. API đọc lịch sử đăng ký (`GET /enrollment-events`)
* Đã cài đặt tại [`backend/app/main.py`](../backend/app/main.py) hỗ trợ lọc theo `student_id`, `event_type`, phân trang `skip` (`>= 0`) và `limit` (`1..100`), sắp xếp `ORDER BY occurred_at DESC, id DESC`.
* Kết quả kiểm thử:
  * Có dữ liệu (`?student_id=22000001&event_type=CREATED&limit=2`): trả về `200 OK` gồm 2 sự kiện mới nhất.
  * Không có dữ liệu (`?student_id=99999999`): trả về `200 OK` với `[]`.

### Bài 2. Kiểm thử Rollback nhiều bảng
* Khi `INSERT INTO enrollments` thành công nhưng `INSERT INTO enrollment_events` vi phạm `CHECK (event_type IN ('CREATED', 'CANCELLED'))`, khối `with engine.begin()` tự động `ROLLBACK` toàn bộ transaction, giữ nguyên số dòng của bảng `enrollments`.

### Bài 3. Chỉ mục thứ hai theo nghiệp vụ (`idx_enrollment_events_dataset_section_type_time`)
* Thiết kế cho truy vấn thống kê sự kiện theo lớp học phần (`class_section_id`), loại sự kiện (`event_type`) và thời gian (`occurred_at DESC`):
  ```sql
  CREATE INDEX idx_enrollment_events_dataset_section_type_time
  ON enrollment_events (dataset, class_section_id, event_type, occurred_at DESC);
  ```
* Kết quả đo trên 100.000 dòng:
  * **Trước Index 2:** `Bitmap Heap Scan` + `Sort`, `Rows Removed by Filter: 8073`, `Buffers: shared hit=438`, `Execution Time: 0.988 ms`.
  * **Sau Index 2:** `Index Scan using idx_enrollment_events_dataset_section_type_time`, `Buffers: shared hit=53`, `Execution Time: 0.084 ms`.

### Bài 4. Migration 002 ([`database/migrations/002_add_enrollment_events_note.sql`](../database/migrations/002_add_enrollment_events_note.sql))
* Bổ sung cột `note VARCHAR(200)` cho bảng `enrollment_events` mà không làm mất dữ liệu hiện có; kèm tệp rollback [`002_add_enrollment_events_note_rollback.sql`](../database/migrations/002_add_enrollment_events_note_rollback.sql).

### Bài 5 & Phần IX. Hồ Sơ Thiết Kế Mốc Kiểm Tra Project 1
| Nội dung cần xác định | Thiết kế áp dụng |
| :--- | :--- |
| **Một transaction nhiều bảng** | Đăng ký học phần (`INSERT enrollments`) + ghi nhật ký kiểm toán (`INSERT enrollment_events`) trong cùng 1 transaction nguyên tử (`with engine.begin()`). |
| **Một nguy cơ đồng thời** | Hai sinh viên (`22000002` và `22000004`) cùng gửi yêu cầu đăng ký suất cuối cùng của lớp học phần (`capacity = 1`). |
| **Dòng/tài nguyên cần khóa** | Dòng của lớp học phần trong bảng `class_sections` (`SELECT id, capacity FROM class_sections WHERE id = :class_section_id FOR UPDATE`). |
| **Migration đầu tiên** | Migration `001_add_enrollment_events.sql` thêm bảng `schema_migrations` và `enrollment_events`. |
| **Truy vấn cần đo** | Tra cứu 50 sự kiện đăng ký/hủy gần nhất của một sinh viên hoặc một lớp học phần trên tập dữ liệu 100.000 sự kiện. |
| **Chỉ mục dự kiến** | Đặt các cột lọc bằng (`=`) trước (`dataset`, `student_id`), cột lọc khoảng/sắp xếp (`occurred_at DESC`) ở cuối. |
| **Cách kiểm thử** | Chạy `backend/tests/week04_concurrency_test.py` với 2 luồng đồng bộ qua `threading.Barrier(2)`; xác nhận đúng 1 luồng nhận `201 Created`, 1 luồng nhận `409 Conflict` và trạng thái cuối `enrolled = 1, remaining = 0`. |
