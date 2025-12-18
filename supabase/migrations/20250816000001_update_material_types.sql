-- Migration: Update material types to support new categories
-- Date: 2025-01-16
-- Purpose: Change materials.type from ENUM to VARCHAR to support new categories: poster, full, part

USE atira_db;

-- Step 1: Add new temporary column with VARCHAR type
ALTER TABLE materials ADD COLUMN type_new VARCHAR(50) NOT NULL DEFAULT 'article' AFTER type;

-- Step 2: Copy existing data to new column
UPDATE materials SET type_new = type;

-- Step 3: Drop old ENUM column
ALTER TABLE materials DROP COLUMN type;

-- Step 4: Rename new column to 'type'
ALTER TABLE materials CHANGE COLUMN type_new type VARCHAR(50) NOT NULL;

-- Step 5: Recreate index for type column
CREATE INDEX idx_type ON materials(type);

-- Step 6: Update existing data to use new type values
-- Change 'video' to 'full' (assuming existing videos are full videos)
-- Change 'podcast' to 'part' (assuming podcasts are video parts)
-- You can adjust this based on your needs
UPDATE materials SET type = 'full' WHERE type = 'video';
UPDATE materials SET type = 'part' WHERE type = 'podcast';

-- Note: Existing 'article' types remain unchanged

-- Step 7: Update stored procedures to handle new types
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

-- Step 8: Recreate the view to include all material types
DROP VIEW IF EXISTS published_materials;

CREATE VIEW published_materials AS
SELECT m.*, u.name as author_name 
FROM materials m 
JOIN users u ON m.author_id = u.id 
WHERE m.status = 'published';

-- Verification: Show current material types distribution
SELECT type, COUNT(*) as count FROM materials GROUP BY type;








