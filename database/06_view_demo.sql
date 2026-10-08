-- =============================================================================
-- VIII.3. QUAN SÁT VIEW KHI CÓ MỘT ĐĂNG KÝ MỚI
-- Các bước sau phải chạy trên cùng một tab Query Tool, cùng một kết nối.
-- Mỗi bước chọn và chạy riêng phần mã được chỉ rõ.
-- BEGIN bắt đầu giao dịch; ROLLBACK hủy các thay đổi chưa được chốt.
-- =============================================================================

-- Bước 1 & 2: Bắt đầu giao dịch và thêm đăng ký thử
BEGIN;

INSERT INTO enrollments (student_id, class_section_id)
VALUES ('22000004', 'WEB-01');

-- Bước 3: Xem kết quả khi đang trong giao dịch (số lượng tăng từ 2 lên 3, remaining giảm từ 1 xuống 0)
SELECT class_id, capacity, enrolled, remaining
FROM v_section_summary
WHERE class_id = 'WEB-01';

-- Bước 4: Hủy đăng ký thử bằng hoàn tác
ROLLBACK;

-- Bước 5: Xem lại kết quả sau khi hoàn tác (WEB-01 trở về 2 đăng ký và còn 1 chỗ)
SELECT class_id, capacity, enrolled, remaining
FROM v_section_summary
WHERE class_id = 'WEB-01';
