PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`date` text,
	`start_time` text,
	`duration` integer,
	`location` text,
	`description` text,
	`registration_deadline` text,
	`announcement_link` text,
	`cancelled_at` integer,
	`race_type` text,
	`championship_type` text,
	`is_wrc` integer DEFAULT 0 NOT NULL,
	`priority` text,
	`ladv_id` integer,
	`ladv_data` text,
	`ladv_last_sync` integer,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_events`("id", "type", "name", "date", "start_time", "duration", "location", "description", "registration_deadline", "announcement_link", "cancelled_at", "race_type", "championship_type", "is_wrc", "priority", "ladv_id", "ladv_data", "ladv_last_sync", "created_by", "created_at", "updated_at") SELECT "id", "type", "name", "date", NULL, NULL, "location", "description", "registration_deadline", "announcement_link", "cancelled_at", "race_type", "championship_type", "is_wrc", "priority", "ladv_id", "ladv_data", "ladv_last_sync", "created_by", "created_at", "updated_at" FROM `events`;--> statement-breakpoint
DROP TABLE `events`;--> statement-breakpoint
ALTER TABLE `__new_events` RENAME TO `events`;--> statement-breakpoint
PRAGMA foreign_keys=ON;