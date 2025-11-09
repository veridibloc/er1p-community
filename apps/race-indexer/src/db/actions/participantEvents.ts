import {ParticipantConfirmedEvent, ParticipantDisqualifiedEvent} from "@er1p/event-ledger";
import {participantEvents, type NewParticipantEvent} from "../schema";
import {db} from "../client.ts";
import {ChainTime} from "@signumjs/util";

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
    } catch (e: any) {
        console.error(`Error upserting participant event [txId: ${event.tx!.transaction}]`, e.message);
    }
}
