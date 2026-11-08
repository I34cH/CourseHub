-- ============================================================
-- BUOI 5: TRUY VAN DOI CHIEU VA XAC MINH DU LIEU TRONG POSTGRESQL
-- Chi doc du lieu; chay tung truy van trong Query Tool
-- ============================================================

-- 1. Kiem tra si so va so cho con lai cua cac lop WEB-01 va RACE-01
SELECT class_id, capacity, enrolled, remaining
FROM v_section_summary
WHERE class_id IN ('WEB-01', 'RACE-01')
ORDER BY class_id;

-- 2. Kiem tra danh sach dang ky cua sinh vien 22000004
SELECT student_id, class_section_id
FROM enrollments
WHERE student_id = '22000004'
ORDER BY class_section_id;

-- 3. Kiem tra nhat ky su kien dang ky / huy cua sinh vien 22000004 trong bo demo
SELECT id, student_id, class_section_id, event_type, source, dataset, occurred_at
FROM enrollment_events
WHERE dataset = 'demo'
  AND student_id = '22000004'
  AND class_section_id = 'WEB-01'
ORDER BY id DESC
LIMIT 10;

