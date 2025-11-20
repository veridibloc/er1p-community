import {db} from "@/lib/server/db"
import {count, eq, inArray, sql, sum} from "drizzle-orm"
import {participantEvents, raceFlowEvents, races} from "@er1p-community/race-indexer-db"
import {withCache} from "@/lib/server/with-cache";

async function fetchUncachedLiveRaces() {
    return db.query.liveRaces.findMany({
        with: {
            race: true
        }
    })
}

async function queryTotalTrackedTimeSeconds() {
    const startEvents = db.$with('start_events').as(
        db.select({
            raceId: raceFlowEvents.raceId,
            startTime: raceFlowEvents.dateTime
        })
            .from(raceFlowEvents)
            .where(eq(raceFlowEvents.eventType, 'race_started'))
    )

    const endEvents = db.$with('end_events').as(
        db.select({
            raceId: raceFlowEvents.raceId,
            endTime: raceFlowEvents.dateTime
        })
            .from(raceFlowEvents)
            .where(inArray(raceFlowEvents.eventType, ['race_ended', 'race_cancelled']))
    )

    const [result] = await db.with(startEvents, endEvents)
        .select({
            totalTrackedTimeSeconds: sql<number>`
                COALESCE(
    SUM(unixepoch(
                ${endEvents.endTime}
                )
                -
                unixepoch
                (
                ${startEvents.startTime}
                )
                ),
                0
                )
            `
        })
        .from(startEvents)
        .innerJoin(endEvents, eq(startEvents.raceId, endEvents.raceId))

    return result?.totalTrackedTimeSeconds ?? 0;
}

async function querySimpleRaceStats() {
    const [stats] = await db.select({
        totalDistanceKilometer: sum(races.lengthKilometer),
        racesCount: count()
    })
        .from(races)
        // .innerJoin(raceFlowEvents, eq(raceFlowEvents.raceId, races.id))
        // .where(eq(raceFlowEvents.eventType, 'race_started'))

    return stats ?? null
}

async function queryParticipantCount() {
    return db.$count(participantEvents, eq(participantEvents.eventType, 'confirmed'));
}

async function fetchUncachedOverallRaceStats() {

    const [stats, totalParticipants, totalTrackedTimeSeconds] = await Promise.all([
        querySimpleRaceStats(),
        queryParticipantCount(),
        queryTotalTrackedTimeSeconds()
    ])

    return {
        totalDistanceKilometer: Number(stats?.totalDistanceKilometer ?? 0),
        totalParticipants: Number(totalParticipants ?? 0),
        totalTrackedTimeSeconds: Math.round(Number(totalTrackedTimeSeconds ?? 0)),
        racesCount: stats?.racesCount ?? 0
    }
}

export const fetchLiveRaces = withCache(fetchUncachedLiveRaces, ['live-races'], {revalidate: 10})
export const fetchOverallRaceStats = withCache(fetchUncachedOverallRaceStats, ['overall-race-stats'], {revalidate: 60 * 60 * 24})
