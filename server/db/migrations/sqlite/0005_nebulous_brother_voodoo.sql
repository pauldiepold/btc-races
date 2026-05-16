PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
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
	`created_by` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_events`("id", "type", "name", "date", "start_time", "duration", "location", "description", "registration_deadline", "announcement_link", "cancelled_at", "race_type", "championship_type", "is_wrc", "priority", "ladv_id", "ladv_data", "ladv_last_sync", "created_by", "created_at", "updated_at") SELECT "id", "type", "name", "date", "start_time", "duration", "location", "description", "registration_deadline", "announcement_link", "cancelled_at", "race_type", "championship_type", "is_wrc", "priority", "ladv_id", "ladv_data", "ladv_last_sync", "created_by", "created_at", "updated_at" FROM `events`;--> statement-breakpoint
DROP TABLE `events`;--> statement-breakpoint
ALTER TABLE `__new_events` RENAME TO `events`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_registrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`status` text NOT NULL,
	`notes` text,
	`wish_disciplines` text DEFAULT '[]' NOT NULL,
	`ladv_disciplines` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_registrations`("id", "event_id", "user_id", "status", "notes", "wish_disciplines", "ladv_disciplines", "created_at", "updated_at") SELECT "id", "event_id", "user_id", "status", "notes", "wish_disciplines", "ladv_disciplines", "created_at", "updated_at" FROM `registrations`;--> statement-breakpoint
DROP TABLE `registrations`;--> statement-breakpoint
ALTER TABLE `__new_registrations` RENAME TO `registrations`;--> statement-breakpoint
CREATE UNIQUE INDEX `registrations_eventId_userId_unique` ON `registrations` (`event_id`,`user_id`);