-- Rename service_translations field value from 'details' to 'contentHtml'
UPDATE `service_translations` SET `field` = 'contentHtml' WHERE `field` = 'details';
