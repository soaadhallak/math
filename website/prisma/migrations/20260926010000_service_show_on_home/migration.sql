-- Feature up to 4 services on the homepage Vision section
ALTER TABLE `services` ADD COLUMN `showOnHome` BOOLEAN NOT NULL DEFAULT false;
