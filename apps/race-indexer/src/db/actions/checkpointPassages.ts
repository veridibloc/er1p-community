import {CheckpointPassedEvent} from "@er1p-community/event-ledger";
import {checkpointPassages, type NewCheckpointPassage} from "@er1p-community/race-indexer-db";
import {dbClient as db} from "../dbClient.ts";

import {
    updateLiveLeaderboardOnCheckpoint,
    markLiveLeaderboardFinished,
    markLiveLeaderboardDisqualifiedOrDNF
} from "./liveLeaderboards";

/**
 * Efficiently upserts a checkpoint passage event.
 * Uses a single database operation instead of check-then-insert/update pattern.
 *
 * - If the record doesn't exist: inserts it
 * - If the record exists (by transaction ID): updates isPending to 0
 *
 * This is atomic and handles both pending→confirmed transitions and direct inserts.
 */
export async function upsertCheckpointPassages(event: CheckpointPassedEvent, shallUpdateLeaderBoard: boolean, isPending: boolean = false) {
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

        if (shallUpdateLeaderBoard) {
            // Update leaderboard for this participant only (efficient - just 2 queries)
            await updateLiveLeaderboardOnCheckpoint(
                raceId,
                participantId,
                payload.checkpointId,
                payload.dateTime,
                isPending
            );

            // Check if participant finished (passed checkpoint 'f')
            if (payload.checkpointId === 'f' && payload.action === 'continue') {
                await markLiveLeaderboardFinished(raceId, participantId);
            }

            if (payload.action === 'give_up' || payload.action === 'disqualified') {
                await markLiveLeaderboardDisqualifiedOrDNF(raceId, participantId, payload.action, payload.reason ?? "No reason provided");
            }
        }
    } catch (e: any) {
        console.error(`Error upserting checkpoint passage [txId: ${event.tx!.transaction}]`, e.message);
    }
}
