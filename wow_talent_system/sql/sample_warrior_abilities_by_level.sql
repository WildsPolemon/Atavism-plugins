-- Sample WotLK-style Warrior spell progression (aspect=1).
-- REPLACE ability_id values with your project's Warrior ability IDs before production.

DELETE FROM `class_ability_by_level` WHERE `aspect` = 1;

INSERT INTO `class_ability_by_level`
  (`aspect`, `player_level`, `ability_id`, `auto_learn`, `unlearn_on_delevel`, `sort_order`, `isactive`)
VALUES
  -- Level 1 kit
  (1,  1, 100001, 1, 1, 10, 1),  -- Battle Stance
  (1,  1, 100002, 1, 1, 20, 1),  -- Heroic Strike (rank 1)
  (1,  1, 100003, 1, 1, 30, 1),  -- Attack / Auto-attack enable
  -- Core rotation unlocks
  (1,  4, 100004, 1, 1, 10, 1),  -- Charge
  (1,  6, 100005, 1, 1, 10, 1),  -- Rend
  (1,  8, 100006, 1, 1, 10, 1),  -- Thunder Clap
  (1, 10, 100007, 1, 1, 10, 1),  -- Bloodrage (talents also unlock at 10)
  (1, 12, 100008, 1, 1, 10, 1),  -- Hamstring
  (1, 14, 100009, 1, 1, 10, 1),  -- Overpower
  (1, 16, 100010, 1, 1, 10, 1),  -- Mocking Blow
  (1, 18, 100011, 1, 1, 10, 1),  -- Demoralizing Shout
  (1, 20, 100012, 1, 1, 10, 1),  -- Cleave
  (1, 20, 100013, 1, 1, 20, 1),  -- Slam
  (1, 24, 100014, 1, 1, 10, 1),  -- Retaliation
  (1, 28, 100015, 1, 1, 10, 1),  -- Intimidating Shout
  (1, 30, 100016, 1, 1, 10, 1),  -- Sweeping Strikes
  (1, 32, 100017, 1, 1, 10, 1),  -- Berserker Rage
  (1, 36, 100018, 1, 1, 10, 1),  -- Whirlwind
  (1, 40, 100019, 1, 1, 10, 1),  -- Mortal Strike (if Arms; or use spec ability)
  (1, 50, 100020, 1, 1, 10, 1),  -- Recklessness
  (1, 60, 100021, 1, 1, 10, 1),  -- Rampage / high-level ability
  (1, 70, 100022, 1, 1, 10, 1),  -- Titan's Grip placeholder
  (1, 80, 100023, 1, 1, 10, 1);  -- Bladestorm placeholder
