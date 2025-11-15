CREATE TABLE `checkpoint_passages` (
	`id` text PRIMARY KEY NOT NULL,
	`is_pending` integer DEFAULT 0 NOT NULL,
	`race_id` text NOT NULL,
	`checkpoint_id` text NOT NULL,
	`participant_id` text NOT NULL,
	`passed_at` integer NOT NULL,
	`weather_temperature` integer,
	`weather_uvIndex` integer,
	`weather_humidity` integer,
	`weather_pressure` integer,
	`weather_precipitation` real,
	`wind_speed` real,
	`wind_direction` real,
	`action` text NOT NULL,
	`reason` text,
	`indexed_at` integer DEFAULT (unixepoch()
                     ) NOT NULL,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`checkpoint_id`) REFERENCES `checkpoints`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `checkpoints` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`checkpoint_id` text NOT NULL,
	`race_id` text NOT NULL,
	`name` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`distance_kilometer` real NOT NULL,
	`elevation` integer NOT NULL,
	`elevation_gain` integer NOT NULL,
	`elevation_loss` integer NOT NULL,
	`cutoff_time_in_minutes` integer NOT NULL,
	`type` text NOT NULL,
	`order_index` integer NOT NULL,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `participant_events` (
	`id` text PRIMARY KEY NOT NULL,
	`is_pending` integer DEFAULT 0 NOT NULL,
	`date_time` integer NOT NULL,
	`race_id` text NOT NULL,
	`participant_id` text NOT NULL,
	`event_type` text NOT NULL,
	`reason` text,
	`bib` text,
	`annotation` text,
	`indexed_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `race_flow_events` (
	`id` text PRIMARY KEY NOT NULL,
	`is_pending` integer DEFAULT 0 NOT NULL,
	`race_id` text NOT NULL,
	`event_type` text NOT NULL,
	`reason` text,
	`date_time` integer NOT NULL,
	`indexed_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `races` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`director_id` text NOT NULL,
	`max_participants` integer NOT NULL,
	`latitude` text NOT NULL,
	`longitude` text NOT NULL,
	`date_time` integer NOT NULL,
	`duration_minutes` integer NOT NULL,
	`length_kilometer` real NOT NULL,
	`banner_logo_url` text,
	`image_logo_url` text,
	`indexed_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `races_transaction_id_unique` ON `races` (`transaction_id`);