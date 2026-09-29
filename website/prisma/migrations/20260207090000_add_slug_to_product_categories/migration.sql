-- Add slug to product categories
ALTER TABLE `product_categories`
ADD COLUMN `slug` VARCHAR(100) NULL;

-- Backfill slug for existing rows
UPDATE `product_categories`
SET `slug` = CONCAT('category-', `id`)
WHERE `slug` IS NULL;

-- Enforce not-null and unique constraint
ALTER TABLE `product_categories`
MODIFY COLUMN `slug` VARCHAR(100) NOT NULL;

CREATE UNIQUE INDEX `product_categories_slug_key` ON `product_categories`(`slug`);
