import { LedgerEventRegistry } from "./ledger-event-registry";
import type { Transaction } from "@signumjs/core";
import type { LedgerEvent, SerializableLedgerEvent } from "../types";
import { src44 } from "@signumjs/standards";
import { EventName } from "../event-name";

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
  /**
   * Constructs a new instance with the specified parameters.
   *
   * @param {string} name - The type/name of the event.
   * @param {number} version - The version of the events payload.
   * @param {T} payload - The payload associated with the object.
   * @param {Transaction} [tx] - An optional transaction associated with the object.
   * If tx exists, then it means that the event was created from a transaction, i.e. was dispatched to the  legder
   * @return {void} This constructor does not return a value.
   */
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
   *
   * @param {Transaction} tx - The transaction to be parsed, which contains the attachment holding the event data.
   * @param {LedgerEventRegistry} eventRegistry - The registry that maps event types to their corresponding event classes.
   * @return {TEvent} The parsed and validated event instance of the specified type.
   * @throws {LedgerEventParseError} If the event type is not found, if the event type is unknown,
   * or if an error occurs during parsing or validation.
   */
  public static parse<TEvent extends AbstractLedgerEvent>(
    tx: Transaction,
    eventRegistry: LedgerEventRegistry,
  ): TEvent {
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

      const event = EventClass.fromTransaction(tx, descriptorData);
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
   *
   * @param {Transaction} tx - The transaction to be parsed, which contains the attachment holding the event data.
   * @param {LedgerEventRegistry} eventRegistry - The registry that maps event types to their corresponding event classes.
   * @return {TEvent | null} The parsed and validated event instance of the specified type, or null if an error occurs.
   */
  public static safeParse<TEvent extends AbstractLedgerEvent>(
    tx: Transaction,
    eventRegistry: LedgerEventRegistry,
  ): TEvent | null {
    try {
      return AbstractLedgerEvent.parse<TEvent>(tx, eventRegistry);
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
   *
   * @param {src44.DescriptorDataBuilder} descriptorBuilder - The builder instance used to create or manage descriptor data.
   * @return {src44.DescriptorData} The resulting descriptor data created or modified by this method.
   */
  protected abstract descriptorImpl(
    descriptorBuilder: src44.DescriptorDataBuilder,
  ): src44.DescriptorData;

  /**
   * Retrieves the descriptor data by invoking a builder with the specified type.
   *
   * @return {src44.DescriptorData} The constructed descriptor data.
   */
  public descriptor(): src44.DescriptorData {
    return this.descriptorImpl(
      src44.DescriptorDataBuilder.create(
        new EventName(this.name, this.version).toString(),
      ),
    );
  }
}
