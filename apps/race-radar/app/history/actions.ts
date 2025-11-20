import {withCache} from "@/lib/server/with-cache";
import {db} from "@/lib/server/db";
import {checkpointPassages, participantEvents} from "@er1p-community/race-indexer-db";
import {and, eq} from "drizzle-orm";

async function fetchUncachedAllRaces() {
    return db.query.races.findMany({
        with:{
            checkpoints: true,
            participantEvents: true
        }
    })
}
async function fetchUncachedAllRaceStats() {
   const participantCount = await db.$count(participantEvents, eq(participantEvents.eventType, 'confirmed'))
    const totalFinishers = await db.$count(checkpointPassages,
        and(
            eq(checkpointPassages.action, 'continue'),
            eq(checkpointPassages.checkpointId, 'f')
        )
    )
    return {participantCount, totalFinishers}
}

export const fetchAllRaces = withCache(fetchUncachedAllRaces, ['races'], {revalidate: 60 * 60})
export const fetchAllRaceStats = withCache(fetchUncachedAllRaceStats, ['race-stats'], {revalidate: 60 * 60})

