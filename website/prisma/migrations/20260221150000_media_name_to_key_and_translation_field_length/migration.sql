-- ServiceMedia: rename name to key
ALTER TABLE `service_media` CHANGE COLUMN `name` `key` VARCHAR(50) NOT NULL;

-- ProductMedia: rename name to key
ALTER TABLE `product_media` CHANGE COLUMN `name` `key` VARCHAR(50) NOT NULL;

-- Allow longer field values for media keys in translations (e.g. kebab-case keys)
ALTER TABLE `service_translations` MODIFY COLUMN `field` VARCHAR(80) NOT NULL;
ALTER TABLE `product_translations` MODIFY COLUMN `field` VARCHAR(80) NOT NULL;
