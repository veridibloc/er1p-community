import {CheckpointPassedEvent} from "@er1p/event-ledger";
import {checkpointPassages, type NewCheckpointPassage} from "../schema";
import {db} from "../client.ts";

/**
 * Efficiently upserts a checkpoint passage event.
 * Uses a single database operation instead of check-then-insert/update pattern.
 *
 * - If the record doesn't exist: inserts it
 * - If the record exists (by transaction ID): updates isPending to 0
 *
 * This is atomic and handles both pending→confirmed transitions and direct inserts.
 */
export async function upsertCheckpointPassages(event: CheckpointPassedEvent, isPending: boolean = false) {
    try {
        const tx = event.tx!;
        const raceId = tx.sender;
        const participantId = tx.recipient!;
        const payload = event.payload;

        const passage: NewCheckpointPassage = {
            id: tx.transaction,
            checkpointId: payload.checkpointId,
            raceId,
            participantId,
            isPending: isPending ? 1 : 0,
            passedAt: payload.dateTime,
            weatherTemperature: payload.weatherTemperature,
            weatherUvIndex: payload.weatherUvIndex,
            weatherHumidity: payload.weatherHumidity,
            weatherPressure: payload.weatherPressure,
            windSpeed: payload.windSpeed,
            windDirection: payload.windDirection,
            weatherPrecipitation: payload.weatherPrecipitation,
            action: payload.action,
            reason: payload.reason,
        };

        // Single atomic operation: insert or update if conflict on primary key
        await db.insert(checkpointPassages)
            .values(passage)
            .onConflictDoUpdate({
                target: checkpointPassages.id,
                set: {
                    isPending: isPending ? 1 : 0,
                    // Optionally update other fields if they might change:
                    passedAt: passage.passedAt,
                    weatherTemperature: passage.weatherTemperature,
                    weatherUvIndex: passage.weatherUvIndex,
                    weatherHumidity: passage.weatherHumidity,
                    weatherPressure: passage.weatherPressure,
                    windSpeed: passage.windSpeed,
                    windDirection: passage.windDirection,
                    weatherPrecipitation: passage.weatherPrecipitation,
                    action: passage.action,
                    reason: passage.reason,
                }
            });
    } catch (e: any) {
        console.error(`Error upserting checkpoint passage [txId: ${event.tx!.transaction}]`, e.message);
    }
}
