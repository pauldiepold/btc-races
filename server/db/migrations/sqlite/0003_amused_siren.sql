ALTER TABLE `events` ADD `description` text;--> statement-breakpoint
ALTER TABLE `events` ADD `race_type` text;--> statement-breakpoint
ALTER TABLE `events` ADD `championship_type` text;--> statement-breakpoint
ALTER TABLE `events` ADD `is_wrc` integer DEFAULT 0 NOT NULL;