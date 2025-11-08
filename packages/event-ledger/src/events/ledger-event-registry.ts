import type { LedgerEventConstructor, LedgerEvent } from "../types";
import type { EventName } from "../event-name";

/**
 * A singleton class responsible for managing the registry of ledger event types.
 * The `LedgerEventRegistry` allows registration and retrieval of event types,
 * associating string identifiers with corresponding event constructor classes.
 */
export class LedgerEventRegistry {
  private eventTypes = new Map<string, LedgerEventConstructor>();
  private static instance: LedgerEventRegistry;

  static getInstance(): LedgerEventRegistry {
    if (!this.instance) {
      this.instance = new LedgerEventRegistry();
    }
    return this.instance;
  }

  register<T extends LedgerEvent>(
    EventClass: LedgerEventConstructor<T>,
    eventName: EventName,
  ): void {
    this.eventTypes.set(eventName.toString(), EventClass);
  }

  get(eventName: EventName): LedgerEventConstructor | undefined {
    return this.eventTypes.get(eventName.toString());
  }
}
