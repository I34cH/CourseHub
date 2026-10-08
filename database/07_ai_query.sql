-- =============================================================================
-- IX. KIỂM TRA TRUY VẤN DO AI ĐỀ XUẤT
-- Dùng ngay lớp WEB-02 chưa có ai đăng ký để kiểm tra một đề xuất đếm số sinh viên.
-- =============================================================================

-- 1. Truy vấn chạy được nhưng đếm sai (Ví dụ sai do AI đề xuất để đối chiếu)
-- Lỗi: LEFT JOIN giữ lại dòng của WEB-02 dù không có sinh viên ghép vào.
-- COUNT(*) đếm dòng được giữ lại đó -> trả về 1 (sai nghiệp vụ vì lớp chưa có ai đăng ký).
SELECT cs.id, COUNT(*) AS enrolled
FROM class_sections AS cs
LEFT JOIN enrollments AS e ON e.class_section_id = cs.id
WHERE cs.id = 'WEB-02'
GROUP BY cs.id;

-- 2. Sửa cột được đếm (Truy vấn đã sửa)
-- COUNT(e.student_id) chỉ đếm mã sinh viên không NULL -> trả về 0 (đúng nghiệp vụ).
SELECT cs.id, COUNT(e.student_id) AS enrolled
FROM class_sections AS cs
LEFT JOIN enrollments AS e ON e.class_section_id = cs.id
WHERE cs.id = 'WEB-02'
GROUP BY cs.id;
