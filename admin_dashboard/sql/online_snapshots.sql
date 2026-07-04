-- Optional analytics table for online player history
-- Run against atavism_admin database

CREATE TABLE IF NOT EXISTS online_snapshots (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  players_online INT NOT NULL DEFAULT 0,
  recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Example cron job (every 5 min) to populate snapshots:
-- INSERT INTO online_snapshots (players_online)
-- SELECT players_online FROM server_stats LIMIT 1;
