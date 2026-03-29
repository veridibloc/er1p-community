import { LedgerEventRegistry } from "./ledger-event-registry";
import type { Ledger, Transaction } from "@signumjs/core";
import { src44 } from "@signumjs/standards";
import { EventName } from "../event-name";
import type {LedgerEvent, LedgerEventContext, SerializableLedgerEvent} from "../ledger-event.types.ts";

export class LedgerEventParseError extends Error {
  constructor(
    message: string,
    public readonly severity: "ignorable" | "warning" | "error" | "fatal",
  ) {
    super(message);
  }
}

/**
 * Represents an abstract class for ledger events, defining the required structure, validation logic,
 * and parsing logic for events within a ledger system. This class is designed to be extended by
 * specific event types, each providing their own validation and descriptor logic.
 *
 * @template T - The type of the payload carried by the ledger event.
 * @implements {LedgerEvent<T>}
 */
export abstract class AbstractLedgerEvent<T = any> implements LedgerEvent<T> {
  protected constructor(
    public readonly name: string,
    public readonly version: number,
    public readonly payload: T,
    public readonly tx?: Transaction,
  ) {}

  serialize(): SerializableLedgerEvent<T> {
    return {
      name: this.name,
      version: this.version,
      payload: this.payload,
      tx: this.tx,
    };
  }

  /**
   * Parses a given transaction and attempts to convert it into a specific ledger event instance.
   * Events that need to resolve linked overflow transactions will use the optional ledger parameter.
   */
  public static async parse<TEvent extends AbstractLedgerEvent>(
    tx: Transaction,
    eventRegistry: LedgerEventRegistry,
    ledger: Ledger,
  ): Promise<TEvent> {
    try {
      if (!tx.attachment.message)
        throw new LedgerEventParseError(
          "Attachment is not valid SRC44",
          "ignorable",
        );
      const descriptorData = src44.DescriptorData.parse(tx.attachment.message);
      const eventName = EventName.safeParse(descriptorData.name);
      if (!eventName) {
        throw new LedgerEventParseError(
          "Attachment is valid SRC44, but no valid event name was not found",
          "ignorable",
        );
      }

      const EventClass = eventRegistry.get(eventName);
      if (!EventClass) {
        throw new LedgerEventParseError(
          `Unknown event type: ${eventName}`,
          "warning",
        );
      }

      const event = await EventClass.fromTransaction(tx, descriptorData, ledger);
      const errors = event.validate();
      if (errors.length > 0) {
        throw new LedgerEventParseError(
          `Validation Failed: ${errors.join("\n")}`,
          "error",
        );
      }
      return event as unknown as TEvent;
    } catch (error: any) {
      if (error instanceof LedgerEventParseError) {
        throw error;
      }
      throw new LedgerEventParseError(error.message, "error");
    }
  }

  /**
   * Parses a given transaction and attempts to convert it into a specific ledger event instance.
   * Returns null if parsing fails.
   */
  public static async safeParse<TEvent extends AbstractLedgerEvent>(
    tx: Transaction,
    eventRegistry: LedgerEventRegistry,
    ledger: Ledger,
  ): Promise<TEvent | null> {
    try {
      return await AbstractLedgerEvent.parse<TEvent>(tx, eventRegistry, ledger);
    } catch (error: any) {
      console.debug(
        `Event Parsing Failed for tx: ${tx.transaction}`,
        error.message,
      );
      return null;
    }
  }

  abstract validate(): string[];

  /**
   * Abstract method to implement the descriptor logic using the provided DescriptorDataBuilder.
   * Events that need multi-transaction support can use the optional context.
   */
  protected abstract descriptorImpl(
    descriptorBuilder: src44.DescriptorDataBuilder,
    context: LedgerEventContext,
  ): Promise<src44.DescriptorData>;

  /**
   * Builds and returns the SRC44 descriptor for this event.
   * The optional context provides ledger access for events that need to send linked transactions.
   */
  public async descriptor(context: LedgerEventContext): Promise<src44.DescriptorData> {
    return this.descriptorImpl(
      src44.DescriptorDataBuilder.create(
        new EventName(this.name, this.version).toString(),
      ),
      context,
    );
  }
}
