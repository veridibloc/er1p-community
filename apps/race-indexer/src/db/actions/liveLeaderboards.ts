import {eq, and, sql, asc} from "drizzle-orm";
import {
    liveLeaderboards,
    checkpointPassages,
    checkpoints,
    type NewLiveLeaderboard,
} from "@er1p-community/race-indexer-db";
import {isRaceLive, updateLiveRaceActivity} from "./liveRaces";
import {dbClient as db} from "../dbClient.ts";
/**
 * Add or update a participant in the live leaderboard
 * Called when a participant is confirmed for a live race
 */
export async function upsertLiveLeaderboardParticipant(
    raceId: string,
    participantId: string,
    participantName: string | null,
    bib: string | null
) {
    // Check if race is live
    if (!(await isRaceLive(raceId))) {
        return; // Race not live, skip
    }

    const leaderboardId = `${raceId}-${participantId}`;

    const entry: NewLiveLeaderboard = {
        id: leaderboardId,
        raceId,
        participantId,
        participantName,
        bib,
        lastCheckpointTime: null,
        lastCheckpointId: null,
        raceDurationSeconds: null,
        paceSecondsPerKm: null,
        status: "racing",
        updatedAt: new Date(),
    };

    await db
        .insert(liveLeaderboards)
        .values(entry)
        .onConflictDoUpdate({
            target: liveLeaderboards.id,
            set: {
                participantName: entry.participantName,
                bib: entry.bib,
                updatedAt: new Date(),
            },
        });

    console.log(
        `👤 Added participant to live leaderboard: ${participantName || participantId} (${raceId})`
    );
}

/**
 * Update leaderboard when a checkpoint passage is recorded
 * Efficiently calculates duration and pace using only 2 queries:
 * 1. Find when participant started (checkpoint 's')
 * 2. Get current checkpoint distance
 */
export async function updateLiveLeaderboardOnCheckpoint(
    raceId: string,
    participantId: string,
    checkpointId: string,
    checkpointTime: Date,
    isPending: boolean
) {
    // Only update on new passages (pending), not on confirmation
    if (!isPending) return;

    // Check if race is live
    if (!(await isRaceLive(raceId))) {
        return; // Race not live, skip
    }

    const leaderboardId = `${raceId}-${participantId}`;

    // 1. Find when participant started (passed checkpoint 's')
    const startPassage = await db
        .select({passedAt: checkpointPassages.passedAt})
        .from(checkpointPassages)
        .where(
            and(
                eq(checkpointPassages.raceId, raceId),
                eq(checkpointPassages.participantId, participantId),
                eq(checkpointPassages.checkpointId, "s")
            )
        )
        .limit(1);

    if (!startPassage.length || !startPassage[0]) {
        // Participant hasn't started yet - this might be the start passage itself
        if (checkpointId === "s") {
            // This IS the start passage
            await db
                .update(liveLeaderboards)
                .set({
                    lastCheckpointTime: checkpointTime,
                    lastCheckpointId: checkpointId,
                    raceDurationSeconds: 0, // Just started
                    paceSecondsPerKm: null,
                    updatedAt: new Date(),
                })
                .where(eq(liveLeaderboards.id, leaderboardId));
        }
        return;
    }

    // 2. Get current checkpoint distance
    const checkpoint = await db
        .select({distanceKilometer: checkpoints.distanceKilometer})
        .from(checkpoints)
        .where(
            and(
                eq(checkpoints.raceId, raceId),
                eq(checkpoints.checkpointId, checkpointId)
            )
        )
        .limit(1);

    if (!checkpoint.length || !checkpoint[0]) {
        console.warn(`Checkpoint ${checkpointId} not found for race ${raceId}`);
        return;
    }

    // 3. Calculate metrics
    const raceDurationSeconds = Math.floor(
        (checkpointTime.getTime() - startPassage[0].passedAt.getTime()) / 1000
    );

    const distanceKm = checkpoint[0].distanceKilometer;
    const paceSecondsPerKm =
        distanceKm > 0 ? raceDurationSeconds / distanceKm : null;

    // 4. Update leaderboard (only this participant)
    await db
        .update(liveLeaderboards)
        .set({
            lastCheckpointTime: checkpointTime,
            lastCheckpointId: checkpointId,
            raceDurationSeconds,
            paceSecondsPerKm,
            updatedAt: new Date(),
        })
        .where(eq(liveLeaderboards.id, leaderboardId));

    // Update race activity
    await updateLiveRaceActivity(raceId);

    console.log(
        `📍 Updated leaderboard for ${participantId} at checkpoint ${checkpointId} (${raceDurationSeconds}s)`
    );
}

/**
 * Mark a participant as disqualified in live leaderboard
 */
export async function markLiveLeaderboardDisqualifiedOrDNF(
    raceId: string,
    participantId: string,
    status: 'give_up' | 'disqualified',
    reason: string
) {
    // Check if race is live
    if (!(await isRaceLive(raceId))) {
        return; // Race not live, skip
    }

    const leaderboardId = `${raceId}-${participantId}`;

    await db
        .update(liveLeaderboards)
        .set({
            status: status === 'give_up' ? "dnf" : "disqualified",
            reason,
            updatedAt: new Date(),
        })
        .where(eq(liveLeaderboards.id, leaderboardId));

    console.log(
        `🚫 Marked participant ${participantId} as ${status} (reason: ${reason}) in race ${raceId}`
    );
}


/**
 * Mark a participant as finished in live leaderboard
 * Called when they pass the final checkpoint ('f')
 */
export async function markLiveLeaderboardFinished(
    raceId: string,
    participantId: string,
) {
    if (!(await isRaceLive(raceId))) {
        return; // Race not live, skip
    }

    const leaderboardId = `${raceId}-${participantId}`;

    await db
        .update(liveLeaderboards)
        .set({
            status: "finished",
            updatedAt: new Date(),
        })
        .where(eq(liveLeaderboards.id, leaderboardId));

    console.log(
        `✅ Marked participant ${participantId} as finished in race ${raceId}`
    );
}

