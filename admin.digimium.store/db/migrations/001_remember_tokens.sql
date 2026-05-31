-- Migration: add remember_tokens table for server-side revocation
-- Run once against your MySQL database.

CREATE TABLE IF NOT EXISTS remember_tokens (
    id             INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    user_id        INT UNSIGNED    NOT NULL,
    username       VARCHAR(100)    NOT NULL,
    role           VARCHAR(20)     NOT NULL,
    selector       CHAR(24)        NOT NULL,
    validator_hash CHAR(64)        NOT NULL,
    expires_at     DATETIME        NOT NULL,
    created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_selector  (selector),
    KEY idx_user_id         (user_id),
    KEY idx_expires_at      (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

