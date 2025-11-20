"use server"

import {db} from "@/lib/server/db.ts";
import {asc, desc, eq} from "drizzle-orm";
import {historicalLeaderboards, liveLeaderboards, raceFlowEvents, races} from "@er1p-community/race-indexer-db";
import {withCache} from "@/lib/server/with-cache.ts";

async function fetchUncachedLiveLeaderboard(raceId: string) {
    return await db.query.liveLeaderboards.findMany({
        where: eq(liveLeaderboards.raceId, raceId),
        orderBy: [asc(liveLeaderboards.raceDurationSeconds)],
    });
}

// Server-side cache: revalidate every 10 seconds
// This prevents hitting the database on every page load
export const fetchLiveLeaderboard = withCache(
    fetchUncachedLiveLeaderboard,
    ['live-leaderboard'],
    {revalidate: 10}
);

// we use ISR and page cache for historical leaderboard (instead of react cache)
export async function fetchHistoricalLeaderboard(raceId: string) {
    return await db.query.historicalLeaderboards.findMany({
        where: eq(historicalLeaderboards.raceId, raceId),
        orderBy: [asc(historicalLeaderboards.finalRank)],
    });
}


async function fetchUncachedRace(id: string) {
    const race = await db.query.races.findFirst({
        where: eq(races.id, id),
        with: {
            checkpoints: true,
            participantEvents: {
                columns: {
                    participantId: true,
                    eventType: true,
                }
            },
            raceFlowEvents: {
                columns: {
                    eventType: true,
                },
                orderBy: desc(raceFlowEvents.dateTime),
                limit: 1
            }
        }
    })

    return race ?? null
}

export const fetchRace = withCache(
    fetchUncachedRace,
    ['race'],
    {revalidate: 10}
);
