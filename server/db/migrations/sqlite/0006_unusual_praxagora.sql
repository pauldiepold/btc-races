CREATE TABLE `threads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room_slug` text NOT NULL,
	`title` text,
	`body` text,
	`event_id` integer,
	`last_activity_at` integer NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `threads_eventId_unique` ON `threads` (`event_id`);