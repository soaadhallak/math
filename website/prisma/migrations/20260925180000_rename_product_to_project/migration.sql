-- Rename Product* domain → Project* (Asas Soft)
SET FOREIGN_KEY_CHECKS = 0;

-- Drop legacy FKs (support both historical constraint names)
SET @sql := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `product_category_translations` DROP FOREIGN KEY `product_category_translations_productCategoryId_fkey`',
    'SELECT 1'
  )
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'product_category_translations'
    AND CONSTRAINT_NAME = 'product_category_translations_productCategoryId_fkey'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `products` DROP FOREIGN KEY `products_productCategoryId_fkey`',
    'SELECT 1'
  )
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND CONSTRAINT_NAME = 'products_productCategoryId_fkey'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `product_translations` DROP FOREIGN KEY `product_translations_productId_fkey`',
    'SELECT 1'
  )
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'product_translations'
    AND CONSTRAINT_NAME = 'product_translations_productId_fkey'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `product_medias` DROP FOREIGN KEY `product_media_productId_fkey`',
    'SELECT 1'
  )
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'product_medias'
    AND CONSTRAINT_NAME = 'product_media_productId_fkey'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `product_medias` DROP FOREIGN KEY `product_medias_productId_fkey`',
    'SELECT 1'
  )
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'product_medias'
    AND CONSTRAINT_NAME = 'product_medias_productId_fkey'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

RENAME TABLE `product_categories` TO `project_categories`;
RENAME TABLE `product_category_translations` TO `project_category_translations`;
RENAME TABLE `products` TO `projects`;
RENAME TABLE `product_translations` TO `project_translations`;
RENAME TABLE `product_medias` TO `project_medias`;

ALTER TABLE `project_category_translations` CHANGE `productCategoryId` `projectCategoryId` INTEGER NOT NULL;
ALTER TABLE `projects` CHANGE `productCategoryId` `projectCategoryId` INTEGER NOT NULL;
ALTER TABLE `project_translations` CHANGE `productId` `projectId` INTEGER NOT NULL;
ALTER TABLE `project_medias` CHANGE `productId` `projectId` INTEGER NOT NULL;

ALTER TABLE `project_category_translations`
  RENAME INDEX `product_category_translations_productCategoryId_locale_field_key`
  TO `project_category_translations_projectCategoryId_locale_field_key`;
ALTER TABLE `project_translations`
  RENAME INDEX `product_translations_productId_locale_field_key`
  TO `project_translations_projectId_locale_field_key`;

ALTER TABLE `project_category_translations`
  ADD CONSTRAINT `project_category_translations_projectCategoryId_fkey`
  FOREIGN KEY (`projectCategoryId`) REFERENCES `project_categories`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `projects`
  ADD CONSTRAINT `projects_projectCategoryId_fkey`
  FOREIGN KEY (`projectCategoryId`) REFERENCES `project_categories`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `project_translations`
  ADD CONSTRAINT `project_translations_projectId_fkey`
  FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `project_medias`
  ADD CONSTRAINT `project_medias_projectId_fkey`
  FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;
