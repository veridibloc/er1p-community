import { AbstractLedgerEvent } from "./abstract-ledger-event";
import type { Transaction } from "@signumjs/core";
import { src44 } from "@signumjs/standards";

export interface LedgerEventConstructor<
  T extends AbstractLedgerEvent = AbstractLedgerEvent,
> {
  new (...args: any[]): T;
  fromTransaction(tx: Transaction, descriptor: src44.DescriptorData): T;
}
