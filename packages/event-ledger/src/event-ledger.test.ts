import { expect, describe, it, beforeEach } from "bun:test";
import { EventLedger } from "./event-ledger";
import { LedgerEventRegistry } from "./events/ledger-event-registry";

describe("EventLedger", () => {
  let eventLedger: EventLedger;
  let eventRegistry: LedgerEventRegistry;

  beforeEach(() => {
    eventRegistry = LedgerEventRegistry.getInstance();
    eventLedger = new EventLedger({} as any, eventRegistry);
  });

  it("should be instantiable", () => {
    expect(eventLedger).toBeDefined();
  });
});
