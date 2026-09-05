CREATE TABLE IF NOT EXISTS auto_cnc_jobs (
  id VARCHAR(64) PRIMARY KEY,
  status VARCHAR(64) NOT NULL,
  progress_percent INT NOT NULL,
  payload_json JSON NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_status_updated (status, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
