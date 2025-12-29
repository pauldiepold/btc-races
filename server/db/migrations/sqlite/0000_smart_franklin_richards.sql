CREATE TABLE `auth_tokens` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`first_name` text,
	`last_name` text,
	`role` text DEFAULT 'member',
	`campai_id` text,
	`membership_number` text,
	`membership_status` text DEFAULT 'inactive',
	`membership_enter_date` integer,
	`membership_leave_date` integer,
	`sections` text,
	`last_synced_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_campaiId_unique` ON `users` (`campai_id`);