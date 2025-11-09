import {ParticipantConfirmedEvent, ParticipantDisqualifiedEvent} from "@er1p/event-ledger";
import {db, participantEvents, type NewParticipantEvent} from "@er1p/race-indexer-db";
import {ChainTime} from "@signumjs/util";
import {
    upsertLiveLeaderboardParticipant,
    markLiveLeaderboardDisqualifiedOrDNF
} from "./liveLeaderboards";

/**
 * Efficiently upserts a participant event (inserts or updates based on transaction ID).
 * Uses a single database operation to handle both pending and confirmed events.
 *
 * - If the record doesn't exist: inserts it as a new event
 * - If the record exists (same transaction ID): updates isPending flag
 *
 * This is atomic and handles pending→confirmed transitions when transactions settle.
 */
export async function upsertParticipantEvent(event: ParticipantDisqualifiedEvent | ParticipantConfirmedEvent, isPending: boolean) {
    try {
        const tx = event.tx!;
        const raceId = tx.sender;
        const participantId = tx.recipient!;

        const isConfirmed = event.name === ParticipantConfirmedEvent.Name;
        const eventType = isConfirmed ? "confirmed" : "disqualified";
        const {payload} = event;
        const reason = ("reason" in payload) ? payload.reason! : null;
        const bib = ("bib" in payload) ? payload.bib! : null;
        const annotation = ("annotation" in payload) ? payload.annotation! : null;
        const participantEvent: NewParticipantEvent = {
            id: tx.transaction,
            isPending: isPending ? 1 : 0,
            dateTime: ChainTime.fromChainTimestamp(tx.timestamp).getDate(),
            raceId,
            participantId,
            eventType,
            reason,
            bib,
            annotation,
        };

        // Single atomic operation: insert or update if conflict on primary key (transaction ID)
        await db.insert(participantEvents)
            .values(participantEvent)
            .onConflictDoUpdate({
                target: participantEvents.id,
                set: {
                    isPending: isPending ? 1 : 0,
                }
            });

        // Update live leaderboard (only for confirmed events)
        if (!isPending) {
            if (isConfirmed) {
                // Get participant name if available (from account lookup or elsewhere)
                // For now, we'll use null and update it later if needed
                await upsertLiveLeaderboardParticipant(
                    raceId,
                    participantId,
                    null, // participantName - could be enhanced
                    bib
                );
            } else {
                // Participant disqualified
                await markLiveLeaderboardDisqualifiedOrDNF(
                    raceId,
                    participantId,
                    'disqualified',
                    reason || 'No reason provided'
                );
            }
        }
    } catch (e: any) {
        console.error(`Error upserting participant event [txId: ${event.tx!.transaction}]`, e.message);
    }
}
