import type {Transaction} from "@signumjs/core";
import type {RaceIndexerContext} from "./types.ts";
import {
    AbstractLedgerEvent,
    CheckpointPassedEvent,
    LedgerEventRegistry, ParticipantConfirmedEvent, ParticipantDisqualifiedEvent,
    RaceCreatedEvent, type RaceFlowEvent,
    RaceFlowEventNames
} from "@er1p/event-ledger";
import {insertRace, upsertRaceFlow} from "./db/actions/races.ts";
import {
    upsertCheckpointPassages
} from "./db/actions/checkpointPassages.ts";
import {upsertParticipantEvent} from "./db/actions/participantEvents.ts";

const raceFlowEventNames = Object.values(RaceFlowEventNames) as string[]

export async function onTransactionHandler(tx: Transaction, context: RaceIndexerContext) {
    try {
        const registry = LedgerEventRegistry.getInstance()
        const event = AbstractLedgerEvent.parse(tx, registry)

        if (event.name === CheckpointPassedEvent.Name) {
            await upsertCheckpointPassages(event as CheckpointPassedEvent, false);
        } else if (raceFlowEventNames.includes(event.name)) {
            await upsertRaceFlow(event as RaceFlowEvent, false);
        } else if (event.name === RaceCreatedEvent.Name) {
            await insertRace(event as RaceCreatedEvent);
        } else if (event.name === ParticipantConfirmedEvent.Name) {
            await upsertParticipantEvent(event as ParticipantConfirmedEvent, false);
        } else if (event.name === ParticipantDisqualifiedEvent.Name) {
            await upsertParticipantEvent(event as ParticipantDisqualifiedEvent, false);
        }


    } catch {
        // ignore irrelevant events/tx
    }
}
