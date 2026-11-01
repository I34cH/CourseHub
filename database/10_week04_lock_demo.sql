-- ============================================================
-- BUOI 4 - PHAN IV.3: QUAN SAT MOT REQUEST PHAI CHO ROW LOCK
-- ============================================================

-- [TAB A] - Khoa dong RACE-01 va giu 8 giay
BEGIN;

SELECT id, capacity
FROM class_sections
WHERE id = 'RACE-01'
FOR UPDATE;

SELECT pg_sleep(8);

COMMIT;

-- [TAB B] - Chay khi Tab A dang giu lock (se phai cho den khi Tab A COMMIT)
BEGIN;

SELECT id, capacity
FROM class_sections
WHERE id = 'RACE-01'
FOR UPDATE;

ROLLBACK;
