import { ChainWalker } from "signum-chain-walker";
import { Amount } from "@signumjs/util";
import { Config } from "./config.ts";

/**
 * This example demonstrates how to use `catchUpBlock
 */

const StartBlock = 552_000;
let countedBlocks = 0;
let countedTransactions = 0;
let movedSigna = Amount.Zero();
let mode: "listen" | "sync" = "sync";

function printStats() {
  console.log(
    `Counted ${countedTransactions} transactions since Block ${StartBlock} (in ${countedBlocks} blocks)`,
  );
  console.log(`${movedSigna} were moved`);
  console.log(
    `This is ${movedSigna.clone().divide(countedTransactions)} per tx`,
  );
  console.log(`This is ${movedSigna.clone().divide(countedBlocks)} per block`);
}

const walker = new ChainWalker({
  nodeHost: Config.NodeHost,
  verbose: Config.IsVerbose,
  cachePath: "./race-indexer.cache.json",
})
  .onTransaction((tx) => {
    countedTransactions++;
    movedSigna.add(Amount.fromPlanck(tx.amountNQT));
  })
  .onBlock((b) => {
    countedBlocks++;
    if (mode === "listen") {
      console.log("------\nBlock #", b.height);
      printStats();
    }
  });

(async () => {
  await walker.walk(Config.StartBlock);
  printStats();
  mode = "listen";
  await walker.listen();
})();
