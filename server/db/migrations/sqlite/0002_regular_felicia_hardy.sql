DROP TABLE `registration_disciplines`;--> statement-breakpoint
ALTER TABLE `registrations` ADD `wish_disciplines` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `registrations` ADD `ladv_disciplines` text;