import {ChainWalker} from "signum-chain-walker";
import {Config} from "./config.ts";
import {onPendingTransactionHandler} from "./on-pending-transactions-handler.ts";
import {onTransactionHandler} from "./on-transaction-handler.ts";
import {EventLedger} from "@er1p-community/event-ledger";
import type {RaceIndexerContext} from "./types.ts";


const processedPendingTx = new Set<string>()
const context: any = {}

const walker = new ChainWalker({
    nodeHost: Config.NodeHost,
    verbose: Config.IsVerbose,
    cachePath: "./race-indexer.cache.json",
})
    .onPendingTransactions((tx) => onPendingTransactionHandler(tx, context as RaceIndexerContext))
    .onTransaction((tx) => onTransactionHandler(tx, context as RaceIndexerContext))
    .onBlock( () => {
        processedPendingTx.clear()
    });


(async () => {
    context.mode = "walking";
    context.eventLedger = new EventLedger(walker.ledgerClient);
    context.processedPendingTx = new Set<string>();
    await walker.walk(Config.StartBlock);
    context.mode = "listening";
    context.processedPendingTx = new Set<string>();
    await walker.listen();
})();
