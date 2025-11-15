CREATE TABLE `historical_leaderboards` (
	`id` text PRIMARY KEY NOT NULL,
	`race_id` text NOT NULL,
	`participant_id` text NOT NULL,
	`participant_name` text,
	`bib` text,
	`checkpoints_completed` integer NOT NULL,
	`last_checkpoint_time` integer,
	`race_duration_seconds` integer,
	`pace_seconds_per_km` real,
	`final_rank` integer,
	`status` text NOT NULL,
	`race_ended_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `historical_leaderboards_race_rank_idx` ON `historical_leaderboards` (`race_id`,`final_rank`);--> statement-breakpoint
CREATE INDEX `historical_leaderboards_participant_idx` ON `historical_leaderboards` (`participant_id`);--> statement-breakpoint
CREATE TABLE `live_leaderboards` (
	`id` text PRIMARY KEY NOT NULL,
	`race_id` text NOT NULL,
	`participant_id` text NOT NULL,
	`participant_name` text,
	`bib` text,
	`last_checkpoint_time` integer,
	`last_checkpoint_id` text,
	`race_duration_seconds` integer,
	`pace_seconds_per_km` real,
	`status` text DEFAULT 'racing' NOT NULL,
	`reason` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`race_id`) REFERENCES `live_races`(`race_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `live_leaderboards_race_duration_idx` ON `live_leaderboards` (`race_id`,`race_duration_seconds`);--> statement-breakpoint
CREATE INDEX `live_leaderboards_participant_idx` ON `live_leaderboards` (`participant_id`);--> statement-breakpoint
CREATE TABLE `live_races` (
	`race_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`date_time` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`started_at` integer NOT NULL,
	`last_activity_at` integer NOT NULL,
	`participant_count` integer DEFAULT 0 NOT NULL,
	`total_checkpoints` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE no action
);
