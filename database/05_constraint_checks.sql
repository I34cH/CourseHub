-- =============================================================================
-- VII. THỬ CÁC RÀNG BUỘC BẰNG DỮ LIỆU SAI
-- Nhập các ví dụ ở phần này vào database/05_constraint_checks.sql. Mỗi lần chỉ chọn và
-- chạy một câu lệnh. Các lệnh được viết để cố ý gây lỗi; thông báo từ chối là kết quả cần quan
-- sát, không phải lỗi cần “sửa” bằng cách bỏ ràng buộc.
-- Giữ Auto commit bật. Nếu Query Tool báo giao dịch đang lỗi, chạy riêng ROLLBACK; trước
-- khi thử ví dụ tiếp theo. Không thực hiện các thử nghiệm này trên dữ liệu thật.
-- =============================================================================

-- 1. Đăng ký trùng một lớp
-- Vi phạm khóa chính pk_enrollments; thông báo chứa "duplicate key value"
INSERT INTO enrollments (student_id, class_section_id)
VALUES ('22000001', 'WEB-01');

-- 2. Đăng ký cho sinh viên không tồn tại
-- Khóa ngoại từ chối; thông báo chứa "violates foreign key constraint"
INSERT INTO enrollments (student_id, class_section_id)
VALUES ('22999999', 'WEB-01');

-- 3. Đổi sức chứa lớp thành 0
-- CHECK ck_sections_capacity từ chối cập nhật
UPDATE class_sections
SET capacity = 0
WHERE id = 'WEB-01';

-- 4. Bỏ trống số tín chỉ
-- NOT NULL từ chối; thông báo chứa "violates not-null constraint"
UPDATE courses
SET credits = NULL
WHERE code = 'INT2204';

-- 5. Dùng lại email của sinh viên khác
-- UNIQUE uq_students_email từ chối
UPDATE students
SET email = 'anh@example.com'
WHERE id = '22000002';

-- 6. Nhập họ tên chỉ gồm dấu cách
-- CHECK(trim(name) <> '') từ chối
UPDATE students
SET name = ' '
WHERE id = '22000004';

-- 7. Kiểm tra dữ liệu sau các lần bị từ chối
-- Kết quả total_enrollments vẫn phải là 5
SELECT COUNT(*) AS total_enrollments
FROM enrollments;
