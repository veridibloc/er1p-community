PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_checkpoint_passages` (
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
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_checkpoint_passages`("id", "is_pending", "race_id", "checkpoint_id", "participant_id", "passed_at", "weather_temperature", "weather_uvIndex", "weather_humidity", "weather_pressure", "weather_precipitation", "wind_speed", "wind_direction", "action", "reason", "indexed_at") SELECT "id", "is_pending", "race_id", "checkpoint_id", "participant_id", "passed_at", "weather_temperature", "weather_uvIndex", "weather_humidity", "weather_pressure", "weather_precipitation", "wind_speed", "wind_direction", "action", "reason", "indexed_at" FROM `checkpoint_passages`;--> statement-breakpoint
DROP TABLE `checkpoint_passages`;--> statement-breakpoint
ALTER TABLE `__new_checkpoint_passages` RENAME TO `checkpoint_passages`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `checkpoint_passages_race_checkpoint_idx` ON `checkpoint_passages` (`race_id`,`checkpoint_id`);--> statement-breakpoint
CREATE INDEX `unique_race_checkpoint_idx` ON `checkpoints` (`race_id`,`checkpoint_id`);