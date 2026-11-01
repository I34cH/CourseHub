BEGIN;

ALTER TABLE enrollment_events
ADD COLUMN IF NOT EXISTS note VARCHAR(200);

INSERT INTO schema_migrations (version, description)
VALUES ('002', 'Add note column to enrollment_events')
ON CONFLICT (version) DO NOTHING;

COMMIT;
