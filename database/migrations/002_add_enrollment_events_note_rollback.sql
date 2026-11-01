-- Rollback Migration 002
-- Luu y: Lenh DROP COLUMN se xoa vinh vien du lieu trong cot note cua bang enrollment_events,
-- nhung giu nguyen toan bo cac dong va cac cot lich su khac.
BEGIN;

ALTER TABLE enrollment_events
DROP COLUMN IF EXISTS note;

DELETE FROM schema_migrations WHERE version = '002';

COMMIT;
