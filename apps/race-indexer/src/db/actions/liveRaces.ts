import {eq} from "drizzle-orm";
import {
    liveRaces,
    liveLeaderboards,
    historicalLeaderboards,
    races,
    type NewLiveRace,
    type NewHistoricalLeaderboard,
} from "@er1p-community/race-indexer-db";
import {dbClient as db} from "../dbClient.ts";

/**
 * Start tracking a race as live
 * Called when race_started event is processed
 */
export async function startLiveRace(raceId: string, startedAt: Date) {
    // Get race details
    const race = await db
        .select()
        .from(races)
        .where(eq(races.id, raceId))
        .limit(1);

    if (!race.length || !race[0]) {
        throw new Error(`Race ${raceId} not found`);
    }

    const raceData = race[0];

    const liveRace: NewLiveRace = {
        raceId,
        name: raceData.name,
        dateTime: raceData.dateTime,
        status: "active",
        startedAt,
        lastActivityAt: startedAt,
        participantCount: 0,
        totalCheckpoints: 0,
    };

    await db
        .insert(liveRaces)
        .values(liveRace)
        .onConflictDoUpdate({
            target: liveRaces.raceId,
            set: {
                status: "active",
                startedAt,
                lastActivityAt: startedAt,
            },
        });

    console.log(`✅ Started tracking live race: ${raceData.name} (${raceId})`);
}

/**
 * Pause a live race
 * Called when race_stopped event is processed
 */
export async function pauseLiveRace(raceId: string) {
    await db
        .update(liveRaces)
        .set({
            status: "paused",
            lastActivityAt: new Date(),
        })
        .where(eq(liveRaces.raceId, raceId));

    console.log(`⏸️  Paused live race: ${raceId}`);
}

/**
 * Resume a live race
 * Called when race_resumed event is processed
 */
export async function resumeLiveRace(raceId: string) {
    await db
        .update(liveRaces)
        .set({
            status: "active",
            lastActivityAt: new Date(),
        })
        .where(eq(liveRaces.raceId, raceId));

    console.log(`▶️  Resumed live race: ${raceId}`);
}

/**
 * Finalize a race: move data from live to historical
 * Called when race_ended or race_cancelled event is processed
 */
export async function finalizeLiveRace(raceId: string, endedAt: Date) {
    // 1. Get all live leaderboard entries
    const liveLeaderboard = await db
        .select()
        .from(liveLeaderboards)
        .where(eq(liveLeaderboards.raceId, raceId));

    if (liveLeaderboard.length === 0) {
        console.log(`⚠️  No leaderboard entries found for race ${raceId}`);
    }

    // 2. Separate finishers (passed checkpoint 'f') from DNF/disqualified
    const finishers = liveLeaderboard
        .filter((entry) => entry.status === "finished" && entry.lastCheckpointId === "f")
        .sort((a, b) => {
            // Sort by duration (fastest first)
            if (a.raceDurationSeconds === null) return 1;
            if (b.raceDurationSeconds === null) return -1;
            return a.raceDurationSeconds - b.raceDurationSeconds;
        });

    const nonFinishers = liveLeaderboard.filter(
        (entry) => entry.status !== "finished" || entry.lastCheckpointId !== "f"
    );

    // 3. Create historical entries: finishers get ranks, others don't
    const finisherHistorical = finishers.map((entry, index) => {
        const historical: NewHistoricalLeaderboard = {
            id: entry.id,
            raceId: entry.raceId,
            participantId: entry.participantId,
            participantName: entry.participantName,
            bib: entry.bib,
            checkpointsCompleted: 0, // TODO: Could calculate from checkpoint passages
            lastCheckpointTime: entry.lastCheckpointTime,
            raceDurationSeconds: entry.raceDurationSeconds,
            paceSecondsPerKm: entry.paceSecondsPerKm,
            finalRank: index + 1, // Finishers get ranks
            status: "finished",
            raceEndedAt: endedAt,
        };
        return historical;
    });

    const nonFinisherHistorical = nonFinishers.map((entry) => {
        // Determine status
        let status: "finished" | "dnf" | "disqualified" = "dnf";
        if (entry.status === "disqualified") {
            status = "disqualified";
        } else if (entry.status === "dnf") {
            status = "dnf";
        }

        const historical: NewHistoricalLeaderboard = {
            id: entry.id,
            raceId: entry.raceId,
            participantId: entry.participantId,
            participantName: entry.participantName,
            bib: entry.bib,
            checkpointsCompleted: 0, // TODO: Could calculate from checkpoint passages
            lastCheckpointTime: entry.lastCheckpointTime,
            raceDurationSeconds: entry.raceDurationSeconds,
            paceSecondsPerKm: entry.paceSecondsPerKm,
            finalRank: null, // DNF/disqualified don't get ranks
            status,
            raceEndedAt: endedAt,
        };
        return historical;
    });

    const sortedLeaderboard = [...finisherHistorical, ...nonFinisherHistorical];
    await db.transaction(async (tx) => {

        // 3. Insert into historical leaderboards
        if (sortedLeaderboard.length > 0) {
            await tx.insert(historicalLeaderboards).values(sortedLeaderboard);
            console.log(
                `📊 Saved ${sortedLeaderboard.length} entries to historical leaderboard for race ${raceId}`
            );
        }

        // 4. Delete live leaderboard entries
        await tx.delete(liveLeaderboards).where(eq(liveLeaderboards.raceId, raceId));

        // 5. Delete live race entry
        await tx.delete(liveRaces).where(eq(liveRaces.raceId, raceId));
    })

    console.log(`🏁 Finalized race: ${raceId}`);
}

/**
 * Update last activity timestamp for a live race
 */
export async function updateLiveRaceActivity(raceId: string) {
    await db
        .update(liveRaces)
        .set({lastActivityAt: new Date()})
        .where(eq(liveRaces.raceId, raceId));
}

/**
 * Check if a race is currently live
 */
export async function isRaceLive(raceId: string): Promise<boolean> {
    const result = await db
        .select({raceId: liveRaces.raceId})
        .from(liveRaces)
        .where(eq(liveRaces.raceId, raceId))
        .limit(1);

    return result.length > 0;
}
