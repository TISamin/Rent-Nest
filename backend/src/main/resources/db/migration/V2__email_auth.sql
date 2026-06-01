-- V2: Switch primary auth from phone to email
ALTER TABLE users ALTER COLUMN phone_number DROP NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
