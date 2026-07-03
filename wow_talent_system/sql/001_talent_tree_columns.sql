-- WoW-style talent tree columns for Atavism `skills` table.
-- Run against your content database before deploying patched AGIS.

ALTER TABLE `skills`
  ADD COLUMN IF NOT EXISTS `tree_id` INT NOT NULL DEFAULT -1 COMMENT 'Talent tree id (0..2 per class)',
  ADD COLUMN IF NOT EXISTS `tier` INT NOT NULL DEFAULT 0 COMMENT 'Row in tree (1=top)',
  ADD COLUMN IF NOT EXISTS `column` INT NOT NULL DEFAULT 0 COMMENT 'Column in row (1=left)',
  ADD COLUMN IF NOT EXISTS `tree_points_required` INT NOT NULL DEFAULT 0 COMMENT 'Points spent in tree required to unlock tier',
  ADD COLUMN IF NOT EXISTS `exclusive_group` INT NOT NULL DEFAULT 0 COMMENT 'Same group = pick one branch (WoW row choice)';

-- MySQL < 8.0 may not support IF NOT EXISTS on ADD COLUMN; use manual checks if needed.
