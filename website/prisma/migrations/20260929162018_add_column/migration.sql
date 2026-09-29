-- DropForeignKey
ALTER TABLE `service_medias` DROP FOREIGN KEY `service_media_serviceId_fkey`;

-- AlterTable
ALTER TABLE `projects` ADD COLUMN `isFeatured` BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE `service_medias` ADD CONSTRAINT `service_medias_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `project_categories` RENAME INDEX `product_categories_slug_key` TO `project_categories_slug_key`;

-- RenameIndex
ALTER TABLE `projects` RENAME INDEX `products_slug_key` TO `projects_slug_key`;
