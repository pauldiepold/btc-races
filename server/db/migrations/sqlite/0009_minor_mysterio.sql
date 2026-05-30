ALTER TABLE `comments` ADD `edited_at` integer;--> statement-breakpoint
-- Backfill: vor dieser Migration hat der Pin-Hack `updated_at` bei reinem Anheften bewahrt;
-- ein erhöhtes `updated_at` an nicht-gelöschten Kommentaren markiert daher echte Body-Edits.
UPDATE `comments` SET `edited_at` = `updated_at` WHERE `updated_at` > `created_at` AND `deleted_at` IS NULL;