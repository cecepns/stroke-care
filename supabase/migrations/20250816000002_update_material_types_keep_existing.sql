-- Alternative Migration: Update material types while keeping existing data unchanged
-- Date: 2025-01-16
-- Purpose: Change materials.type from ENUM to VARCHAR without modifying existing data
-- Use this if you want to keep 'video' and 'podcast' types as-is

USE atira_db;

-- Step 1: Add new temporary column with VARCHAR type
ALTER TABLE materials ADD COLUMN type_new VARCHAR(50) NOT NULL DEFAULT 'article' AFTER type;

-- Step 2: Copy existing data to new column (keeps original values)
UPDATE materials SET type_new = type;

-- Step 3: Drop old ENUM column
ALTER TABLE materials DROP COLUMN type;

-- Step 4: Rename new column to 'type'
ALTER TABLE materials CHANGE COLUMN type_new type VARCHAR(50) NOT NULL;

-- Step 5: Recreate index for type column
CREATE INDEX idx_type ON materials(type);

-- Step 6: Update stored procedures to handle all types
DROP PROCEDURE IF EXISTS GetMaterialStats;

DELIMITER //

CREATE PROCEDURE GetMaterialStats()
BEGIN
  SELECT 
    type,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
    COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft
  FROM materials 
  GROUP BY type;
END //

DELIMITER ;

-- Step 7: Recreate the view
DROP VIEW IF EXISTS published_materials;

CREATE VIEW published_materials AS
SELECT m.*, u.name as author_name 
FROM materials m 
JOIN users u ON m.author_id = u.id 
WHERE m.status = 'published';

-- Verification: Show current material types distribution
SELECT 'Current material types:' as info;
SELECT type, COUNT(*) as count FROM materials GROUP BY type;

-- Note: This migration keeps existing data unchanged
-- Existing 'video' and 'podcast' entries will remain as-is
-- You can manually update them later if needed








