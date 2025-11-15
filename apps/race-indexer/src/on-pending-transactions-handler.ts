import type {Transaction} from "@signumjs/core";
import type {RaceIndexerContext} from "./types.ts";
import {
    AbstractLedgerEvent,
    CheckpointPassedEvent,
    LedgerEventRegistry, ParticipantConfirmedEvent, ParticipantDisqualifiedEvent,
    RaceFlowEventNames
} from "@er1p-community/event-ledger";
import {upsertCheckpointPassages} from "./db/actions/checkpointPassages.ts";
import {upsertParticipantEvent} from "./db/actions/participantEvents.ts";
import {upsertRaceFlow} from "./db/actions/races.ts";

const raceFlowEventNames = Object.values(RaceFlowEventNames) as string[]

export async function onPendingTransactionHandler(transactions: Transaction[], context: RaceIndexerContext) {
    for (const tx of transactions) {
        try {
            const registry = LedgerEventRegistry.getInstance()
            const event = AbstractLedgerEvent.parse(tx, registry)

            // check if we have already processed this tx
            if (event.tx && context.processedPendingTx.has(event.tx.transaction)) {
                continue;
            }

            if (event.name === CheckpointPassedEvent.Name) {
                await upsertCheckpointPassages(event as CheckpointPassedEvent, true);
            } else if (raceFlowEventNames.includes(event.name)) {
                await upsertRaceFlow(event as any, true);
            } else if (event.name === ParticipantConfirmedEvent.Name) {
                await upsertParticipantEvent(event as ParticipantConfirmedEvent, true);
            } else if (event.name === ParticipantDisqualifiedEvent.Name) {
                await upsertParticipantEvent(event as ParticipantDisqualifiedEvent, true);
            }

        } catch {
            // silently ignore irrelevant events/tx
        } finally {
            context.processedPendingTx.add(tx.transaction)
        }
    }
}
