CREATE TABLE `notification_deliveries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`job_id` integer NOT NULL,
	`channel` text NOT NULL,
	`recipient_id` integer NOT NULL,
	`status` text NOT NULL,
	`error` text,
	`sent_at` integer,
	FOREIGN KEY (`job_id`) REFERENCES `notification_jobs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notification_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`payload` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`error` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`processed_at` integer
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`notification_type` text NOT NULL,
	`channel` text NOT NULL,
	`enabled` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_preferences_userId_notificationType_channel_unique` ON `notification_preferences` (`user_id`,`notification_type`,`channel`);--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`endpoint` text NOT NULL,
	`keys_auth` text NOT NULL,
	`keys_p_256dh` text NOT NULL,
	`device_hint` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_subscriptions_userId_endpoint_unique` ON `push_subscriptions` (`user_id`,`endpoint`);--> statement-breakpoint
DROP TABLE `sent_emails`;