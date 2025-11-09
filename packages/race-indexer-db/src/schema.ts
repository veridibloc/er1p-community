import {sql} from "drizzle-orm";
import {text, integer, sqliteTable, real, index} from "drizzle-orm/sqlite-core";

/**
 * Races table - stores information about indexed races from the blockchain
 * This is the immutable race definition/configuration from the race_created event.
 * Race state changes (started, stopped, etc.) are tracked in raceFlowEvents table.
 */
export const races = sqliteTable("races", {
    // Blockchain identifiers
    id: text("id").primaryKey(), // Account/Race ID from blockchain
    transactionId: text("transaction_id").notNull().unique(),

    // Race details
    name: text("name").notNull(),
    description: text("description").notNull(),
    directorId: text("director_id").notNull(),

    // Capacity and logistics
    maxParticipants: integer("max_participants").notNull(),

    // Location
    latitude: text("latitude").notNull(), // Stored as text to preserve precision
    longitude: text("longitude").notNull(),

    // Timing
    dateTime: integer("date_time", {mode: "timestamp"}).notNull(),
    durationMinutes: integer("duration_minutes").notNull(),

    // Distance
    lengthKilometer: real("length_kilometer").notNull(),

    // Media
    bannerLogoUrl: text("banner_logo_url"),
    imageLogoUrl: text("image_logo_url"),

    // Indexer metadata
    indexedAt: integer("indexed_at", {mode: "timestamp"})
        .notNull()
        .default(sql`(unixepoch())`),
});

/**
 * Checkpoints table - stores individual checkpoints for races
 */
export const checkpoints = sqliteTable("checkpoints", {
    id: integer("id").primaryKey({autoIncrement: true}),
    checkpointId: text("checkpoint_id").notNull(),
    raceId: text("race_id")
        .notNull()
        .references(() => races.id),

    name: text("name").notNull(),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    distanceKilometer: real("distance_kilometer").notNull(),
    elevation: integer("elevation").notNull(),
    elevationGain: integer("elevation_gain").notNull(),
    elevationLoss: integer("elevation_loss").notNull(),
    cutoffTimeInMinutes: integer("cutoff_time_in_minutes").notNull(),
    type: text("type", {enum: ["split", "in", "out"]}).notNull(),

    // Ordering within the race
    orderIndex: integer("order_index").notNull(),
});

/**
 * Race flow events - stores the history of race state changes
 * Examples: race_started, race_stopped, race_resumed, race_cancelled, race_ended
 * This allows tracking the complete timeline of race state transitions.
 */
export const raceFlowEvents = sqliteTable("race_flow_events", {
    id: text("id").primaryKey(), // Transaction ID
    isPending: integer("is_pending").notNull().default(0),
    raceId: text("race_id")
        .notNull()
        .references(() => races.id),

    eventType: text("event_type", {
        enum: ["race_started", "race_stopped", "race_resumed", "race_cancelled", "race_ended"]
    }).notNull(),
    reason: text("reason"), // Optional reason for the state change
    dateTime: integer("date_time", {mode: "timestamp"}).notNull(),
    indexedAt: integer("indexed_at", {mode: "timestamp"})
        .notNull()
        .default(sql`(unixepoch())`),
});

/**
 * Participant events - stores the history of participant-related events
 * Each transaction is recorded as a separate event (confirmed, disqualified, etc.)
 * This allows tracking the full timeline of a participant's journey through a race.
 */
export const participantEvents = sqliteTable("participant_events", {
    id: text("id").primaryKey(), // Transaction ID
    isPending: integer("is_pending").notNull().default(0),
    dateTime: integer("date_time", {mode: "timestamp"}).notNull(),
    raceId: text("race_id")
        .notNull()
        .references(() => races.id),
    participantId: text("participant_id").notNull(), // Blockchain account ID

    eventType: text("event_type", {enum: ["confirmed", "disqualified"]})
        .notNull(),
    reason: text("reason"),
    bib: text("bib"), // For confirmed participants
    annotation: text("annotation"), // Optional annotation for confirmed participants
    indexedAt: integer("indexed_at", {mode: "timestamp"})
        .notNull()
        .default(sql`(unixepoch())`),
});

/**
 * Checkpoint passages - records when participants pass checkpoints
 */
export const checkpointPassages = sqliteTable("checkpoint_passages", {
    id: text("id").primaryKey(), // transaction ids
    isPending: integer("is_pending").notNull().default(0),
    raceId: text("race_id")
        .notNull()
        .references(() => races.id),
    checkpointId: text("checkpoint_id")
        .notNull()
        .references(() => checkpoints.id),
    participantId: text("participant_id").notNull(),
    passedAt: integer("passed_at", {mode: "timestamp"}).notNull(),
    weatherTemperature: integer("weather_temperature"),
    weatherUvIndex: integer("weather_uvIndex"),
    weatherHumidity: integer("weather_humidity"),
    weatherPressure: integer("weather_pressure"),
    weatherPrecipitation: real("weather_precipitation"),
    windSpeed: real("wind_speed"),
    windDirection: real("wind_direction"),
    action: text("action", { enum : ["continue", "give_up", "disqualified"]} ).notNull(),
    reason: text("reason"),

    indexedAt: integer("indexed_at", {mode: "timestamp"})
        .notNull()
        .default(sql`(unixepoch()
                     )`),
});

// Export types for use in the application
export type Race = typeof races.$inferSelect;
export type NewRace = typeof races.$inferInsert;

export type Checkpoint = typeof checkpoints.$inferSelect;
export type NewCheckpoint = typeof checkpoints.$inferInsert;

export type RaceFlowEvent = typeof raceFlowEvents.$inferSelect;
export type NewRaceFlowEvent = typeof raceFlowEvents.$inferInsert;

export type ParticipantEvent = typeof participantEvents.$inferSelect;
export type NewParticipantEvent = typeof participantEvents.$inferInsert;

export type CheckpointPassage = typeof checkpointPassages.$inferSelect;
export type NewCheckpointPassage = typeof checkpointPassages.$inferInsert;

/**
 * Live races - tracks currently active races
 * Races are added when race_started event occurs
 * Races are removed when race_ended or race_cancelled events occur
 */
export const liveRaces = sqliteTable("live_races", {
    raceId: text("race_id").primaryKey()
        .references(() => races.id),

    // Race metadata for quick access
    name: text("name").notNull(),
    dateTime: integer("date_time", {mode: "timestamp"}).notNull(),

    // Status tracking
    status: text("status", {enum: ["active", "paused"]}).notNull().default("active"),
    startedAt: integer("started_at", {mode: "timestamp"}).notNull(),
    lastActivityAt: integer("last_activity_at", {mode: "timestamp"}).notNull(),

    // Quick stats
    participantCount: integer("participant_count").notNull().default(0),
    totalCheckpoints: integer("total_checkpoints").notNull().default(0),
});

/**
 * Live leaderboards - materialized leaderboard for active races
 * Includes ALL checkpoint passages (pending + confirmed) for live preview
 * Recalculated when new checkpoints arrive
 * Cleared when race ends (data moves to historical_leaderboards)
 */
export const liveLeaderboards = sqliteTable("live_leaderboards", {
    id: text("id").primaryKey(), // raceId-participantId
    raceId: text("race_id").notNull()
        .references(() => liveRaces.raceId),

    // Participant info
    participantId: text("participant_id").notNull(),
    participantName: text("participant_name"),
    bib: text("bib"),

    // Last checkpoint info
    lastCheckpointTime: integer("last_checkpoint_time", {mode: "timestamp"}),
    lastCheckpointId: text("last_checkpoint_id"), // Track which checkpoint they're at

    // Performance metrics (calculated from start checkpoint 's')
    raceDurationSeconds: integer("race_duration_seconds"), // Time from start to last checkpoint
    paceSecondsPerKm: real("pace_seconds_per_km"), // Average pace in seconds per kilometer

    // Status
    status: text("status", {enum: ["racing", "finished", "dnf", "disqualified"]}).notNull().default("racing"),
    reason: text("reason"),

    updatedAt: integer("updated_at", {mode: "timestamp"}).notNull(),
}, (table) => ({
    // Index for querying and sorting leaderboard by race
    raceIdDurationIdx: index("live_leaderboards_race_duration_idx")
        .on(table.raceId, table.raceDurationSeconds),
    // Index for looking up specific participant
    participantIdx: index("live_leaderboards_participant_idx")
        .on(table.participantId),
}));

/**
 * Historical leaderboards - final leaderboard snapshot when race ends
 * Permanent record of race results
 */
export const historicalLeaderboards = sqliteTable("historical_leaderboards", {
    id: text("id").primaryKey(), // raceId-participantId
    raceId: text("race_id").notNull()
        .references(() => races.id),

    // Participant info
    participantId: text("participant_id").notNull(),
    participantName: text("participant_name"),
    bib: text("bib"),

    // Final stats
    checkpointsCompleted: integer("checkpoints_completed").notNull(),
    lastCheckpointTime: integer("last_checkpoint_time", {mode: "timestamp"}),

    // Performance metrics
    raceDurationSeconds: integer("race_duration_seconds"), // Total time from race start to last checkpoint
    paceSecondsPerKm: real("pace_seconds_per_km"), // Average pace in seconds per kilometer

    // Final ranking (only for finishers who passed checkpoint 'f')
    finalRank: integer("final_rank"), // null for DNF/disqualified

    // Status
    status: text("status", {enum: ["finished", "dnf", "disqualified"]}).notNull(),

    // Metadata
    raceEndedAt: integer("race_ended_at", {mode: "timestamp"}).notNull(),
    createdAt: integer("created_at", {mode: "timestamp"}).notNull()
        .default(sql`(unixepoch())`),
}, (table) => ({
    // Index for querying historical results by race
    raceIdRankIdx: index("historical_leaderboards_race_rank_idx")
        .on(table.raceId, table.finalRank),
    // Index for looking up specific participant
    participantIdx: index("historical_leaderboards_participant_idx")
        .on(table.participantId),
}));

export type LiveRace = typeof liveRaces.$inferSelect;
export type NewLiveRace = typeof liveRaces.$inferInsert;

export type LiveLeaderboard = typeof liveLeaderboards.$inferSelect;
export type NewLiveLeaderboard = typeof liveLeaderboards.$inferInsert;

export type HistoricalLeaderboard = typeof historicalLeaderboards.$inferSelect;
export type NewHistoricalLeaderboard = typeof historicalLeaderboards.$inferInsert;
