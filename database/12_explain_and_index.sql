-- ============================================================
-- BUOI 4 - PHAN VII.3, VII.4, VII.5: EXPLAIN ANALYZE VA INDEX
-- ============================================================

-- 1. EXPLAIN truoc khi tao composite index
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, student_id, class_section_id, event_type, occurred_at
FROM enrollment_events
WHERE dataset = 'performance'
  AND student_id = '22000001'
  AND occurred_at >= TIMESTAMP '2025-12-20 00:00:00'
ORDER BY occurred_at DESC
LIMIT 50;

-- 2. Tao composite index va cap nhat thong ke
CREATE INDEX IF NOT EXISTS idx_enrollment_events_dataset_student_time
ON enrollment_events (dataset, student_id, occurred_at DESC);

ANALYZE enrollment_events;

-- 3. EXPLAIN sau khi tao composite index
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, student_id, class_section_id, event_type, occurred_at
FROM enrollment_events
WHERE dataset = 'performance'
  AND student_id = '22000001'
  AND occurred_at >= TIMESTAMP '2025-12-20 00:00:00'
ORDER BY occurred_at DESC
LIMIT 50;

-- ============================================================
-- BAI TAP 3 (TU THUC HANH): CHI MUC THU HAI THEO NGHIEP VU
-- Thong ke su kien theo class_section_id, event_type va thoi gian
-- ============================================================

-- Truoc khi tao index thu 2
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, student_id, class_section_id, event_type, occurred_at
FROM enrollment_events
WHERE dataset = 'performance'
  AND class_section_id = 'WEB-01'
  AND event_type = 'CANCELLED'
  AND occurred_at >= TIMESTAMP '2025-12-01 00:00:00'
ORDER BY occurred_at DESC
LIMIT 50;

-- Tao index thu 2
CREATE INDEX IF NOT EXISTS idx_enrollment_events_dataset_section_type_time
ON enrollment_events (dataset, class_section_id, event_type, occurred_at DESC);

ANALYZE enrollment_events;

-- Sau khi tao index thu 2
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, student_id, class_section_id, event_type, occurred_at
FROM enrollment_events
WHERE dataset = 'performance'
  AND class_section_id = 'WEB-01'
  AND event_type = 'CANCELLED'
  AND occurred_at >= TIMESTAMP '2025-12-01 00:00:00'
ORDER BY occurred_at DESC
LIMIT 50;
