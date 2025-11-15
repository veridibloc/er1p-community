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
                     ) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_checkpoint_passages`("id", "is_pending", "race_id", "checkpoint_id", "participant_id", "passed_at", "weather_temperature", "weather_uvIndex", "weather_humidity", "weather_pressure", "weather_precipitation", "wind_speed", "wind_direction", "action", "reason", "indexed_at") SELECT "id", "is_pending", "race_id", "checkpoint_id", "participant_id", "passed_at", "weather_temperature", "weather_uvIndex", "weather_humidity", "weather_pressure", "weather_precipitation", "wind_speed", "wind_direction", "action", "reason", "indexed_at" FROM `checkpoint_passages`;--> statement-breakpoint
DROP TABLE `checkpoint_passages`;--> statement-breakpoint
ALTER TABLE `__new_checkpoint_passages` RENAME TO `checkpoint_passages`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `checkpoint_passages_race_checkpoint_idx` ON `checkpoint_passages` (`race_id`,`checkpoint_id`);--> statement-breakpoint
CREATE INDEX `checkpoint_passages_participant_id_idx` ON `checkpoint_passages` (`participant_id`);--> statement-breakpoint
CREATE TABLE `__new_participant_events` (
	`id` text PRIMARY KEY NOT NULL,
	`is_pending` integer DEFAULT 0 NOT NULL,
	`date_time` integer NOT NULL,
	`race_id` text NOT NULL,
	`participant_id` text NOT NULL,
	`event_type` text NOT NULL,
	`reason` text,
	`bib` text,
	`annotation` text,
	`indexed_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_participant_events`("id", "is_pending", "date_time", "race_id", "participant_id", "event_type", "reason", "bib", "annotation", "indexed_at") SELECT "id", "is_pending", "date_time", "race_id", "participant_id", "event_type", "reason", "bib", "annotation", "indexed_at" FROM `participant_events`;--> statement-breakpoint
DROP TABLE `participant_events`;--> statement-breakpoint
ALTER TABLE `__new_participant_events` RENAME TO `participant_events`;--> statement-breakpoint
CREATE INDEX `participant_events_race_id_idx` ON `participant_events` (`race_id`);--> statement-breakpoint
CREATE INDEX `participant_events_participant_id_idx` ON `participant_events` (`participant_id`);--> statement-breakpoint
CREATE TABLE `__new_race_flow_events` (
	`id` text PRIMARY KEY NOT NULL,
	`is_pending` integer DEFAULT 0 NOT NULL,
	`race_id` text NOT NULL,
	`event_type` text NOT NULL,
	`reason` text,
	`date_time` integer NOT NULL,
	`indexed_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_race_flow_events`("id", "is_pending", "race_id", "event_type", "reason", "date_time", "indexed_at") SELECT "id", "is_pending", "race_id", "event_type", "reason", "date_time", "indexed_at" FROM `race_flow_events`;--> statement-breakpoint
DROP TABLE `race_flow_events`;--> statement-breakpoint
ALTER TABLE `__new_race_flow_events` RENAME TO `race_flow_events`;--> statement-breakpoint
CREATE INDEX `race_flow_events_race_id_idx` ON `race_flow_events` (`race_id`);