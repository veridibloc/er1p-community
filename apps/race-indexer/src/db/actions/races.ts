import {
    RaceCreatedEvent,
    type RaceFlowEvent
} from "@er1p/event-ledger";
import {db} from "../client.ts";
import {checkpoints, raceFlowEvents, type NewCheckpoint, type NewRace, type NewRaceFlowEvent, races} from "../schema";
import {eq} from "drizzle-orm";

export async function insertRace(raceCreatedEvent: RaceCreatedEvent) {
    try {
        const tx = raceCreatedEvent.tx!;
        const raceId = tx.recipient!;

        // check if exists - if so, we skip insertion!
        const existingRaces = await db.$count(races, eq(races.id, raceId));
        if (existingRaces) {
            return;
        }

        const {payload} = raceCreatedEvent;
        const newRace: NewRace = {
            id: raceId,
            name: payload.name,
            transactionId: tx.transaction,
            description: payload.description,
            directorId: payload.directorId,
            maxParticipants: payload.maxParticipants,
            latitude: payload.latitude.toString(),
            longitude: payload.longitude.toString(),
            dateTime: payload.dateTime,
            durationMinutes: payload.durationMinutes,
            lengthKilometer: payload.lengthKilometer,
            bannerLogoUrl: payload.bannerLogoUrl,
            imageLogoUrl: payload.imageLogoUrl,
        };

        await db.insert(races).values(newRace);

        // insert checkpoints
        await db.insert(checkpoints).values(payload.checkpoints.map<NewCheckpoint>((c, index) => (
            {
                raceId,
                checkpointId: c.id,
                name: c.name,
                latitude: c.latitude,
                longitude: c.longitude,
                distanceKilometer: c.distanceKilometer,
                elevation: c.elevation,
                elevationGain: c.elevationGain,
                elevationLoss: c.elevationLoss,
                cutoffTimeInMinutes: c.cutoffTimeInMinutes,
                type: c.type,
                orderIndex: index
            })
        ));
    } catch (e: any) {
        console.error(`Error inserting race from event [txId: ${raceCreatedEvent.tx!.transaction}]`, e.message);
    }
}

/**
 * Efficiently upserts a race flow event (inserts or updates based on transaction ID).
 * Uses a single database operation to handle both pending and confirmed events.
 *
 * - If the record doesn't exist: inserts it as a new state change event
 * - If the record exists (same transaction ID): updates isPending flag
 *
 * This is atomic and handles pending→confirmed transitions when transactions settle.
 */
export async function upsertRaceFlow(event: RaceFlowEvent, isPending: boolean = false) {
    try {
        const tx = event.tx!;
        const raceId = tx.sender;

        const flowEvent: NewRaceFlowEvent = {
            id: tx.transaction,
            isPending: isPending ? 1 : 0,
            raceId,
            eventType: event.name as any, // event.name is one of the RaceFlowEventNames
            reason: event.payload.reason || null,
            dateTime: event.payload.dateTime,
        };

        // Single atomic operation: insert or update if conflict on primary key (transaction ID)
        await db.insert(raceFlowEvents)
            .values(flowEvent)
            .onConflictDoUpdate({
                target: raceFlowEvents.id,
                set: {
                    isPending: isPending ? 1 : 0,
                }
            });
    } catch (e: any) {
        console.error(`Error upserting race flow event [txId: ${event.tx!.transaction}]`, e.message);
    }
}
