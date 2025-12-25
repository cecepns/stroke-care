-- Migration: Add sort_order column to materials table
-- Date: 2025-01-17
-- Purpose: Add sort_order column to allow custom ordering of materials

USE atira_db;

-- Check if sort_order column exists before adding
-- This migration is idempotent and safe to run multiple times
SET @db_name = DATABASE();
SET @table_name = 'materials';
SET @column_name = 'sort_order';

SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
  AND TABLE_NAME = @table_name 
  AND COLUMN_NAME = @column_name
);

-- Add sort_order column if it doesn't exist
SET @sql = IF(
  @column_exists = 0,
  CONCAT('ALTER TABLE ', @table_name, ' ADD COLUMN sort_order INT DEFAULT 0 AFTER status'),
  'SELECT "Column sort_order already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if index exists before adding
SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = @db_name 
  AND TABLE_NAME = @table_name 
  AND INDEX_NAME = 'idx_sort_order'
);

-- Add index for sort_order if it doesn't exist
SET @sql = IF(
  @index_exists = 0,
  CONCAT('CREATE INDEX idx_sort_order ON ', @table_name, '(sort_order)'),
  'SELECT "Index idx_sort_order already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing materials to have sequential sort_order based on created_at
-- This ensures existing materials have proper ordering
UPDATE materials m1
SET sort_order = (
  SELECT COUNT(*) 
  FROM materials m2 
  WHERE m2.created_at < m1.created_at 
  OR (m2.created_at = m1.created_at AND m2.id <= m1.id)
)
WHERE sort_order = 0 OR sort_order IS NULL;

