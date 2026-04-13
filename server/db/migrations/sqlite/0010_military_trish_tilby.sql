PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_registration_disciplines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`registration_id` integer NOT NULL,
	`discipline` text NOT NULL,
	`age_class` text NOT NULL,
	`ladv_registered_at` integer,
	`ladv_registered_by` integer,
	`ladv_canceled_at` integer,
	`ladv_canceled_by` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ladv_registered_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`ladv_canceled_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_registration_disciplines`("id", "registration_id", "discipline", "age_class", "ladv_registered_at", "ladv_registered_by", "ladv_canceled_at", "ladv_canceled_by", "created_at") SELECT "id", "registration_id", "discipline", "age_class", "ladv_registered_at", "ladv_registered_by", "ladv_canceled_at", "ladv_canceled_by", "created_at" FROM `registration_disciplines`;--> statement-breakpoint
DROP TABLE `registration_disciplines`;--> statement-breakpoint
ALTER TABLE `__new_registration_disciplines` RENAME TO `registration_disciplines`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `registration_disciplines_registrationId_discipline_unique` ON `registration_disciplines` (`registration_id`,`discipline`);