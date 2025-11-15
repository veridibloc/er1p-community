import {EventLedger} from "@er1p-community/event-ledger";

export type RaceIndexerContext = {
    eventLedger: EventLedger;
    processedPendingTx: Set<string>;
    mode: 'walking' | 'listening';
}
