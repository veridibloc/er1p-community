import type {Ledger, Transaction} from "@signumjs/core";
import type {SignKeys} from "@signumjs/crypto";
import {src44} from "@signumjs/standards";

/**
 * Context provided to events that need to perform multi-transaction operations
 * (e.g. overflow linked transactions). Gives the event access to the ledger
 * and signing credentials without coupling the EventLedger to specific event types.
 */
export interface LedgerEventContext {
    ledger: Ledger;
    senderKeys: SignKeys;
    recipientPublicKey: string;
    recipientId: string;
}

/**
 * This interface represents a ledger event that can be serialized. It is used to encapsulate
 * details of an event within a ledger system, including its name, version, and associated payload.
 *
 * @template T - The type of the payload contained in the ledger event. Defaults to `any` if not specified.
 *
 * @property {string} name - The name of the ledger event.
 * @property {number} version - The version of the ledger event. Used to indicate the version of the event format.
 * @property {T} payload - The payload associated with the ledger event. The type is defined by the generic parameter `T`.
 * @property {Transaction} [tx] - Optional transaction metadata associated with the ledger event.
 */
export interface SerializableLedgerEvent<T = any>
    extends Pick<LedgerEvent<T>, "name" | "version" | "payload" | "tx"> {
}

/**
 * Represents a ledger event with associated metadata and a payload.
 * This interface is generic and can handle a payload of any type.
 *
 * @template T - The type of the payload carried by the ledger event.
 */
export interface LedgerEvent<T = any> {
    name: string;
    version: number;
    payload: T;
    tx?: Transaction;

    validate(): string[];

    /**
     * Builds and returns the SRC44 descriptor for this event.
     * Events that need to send linked overflow transactions can use the optional context
     * to access the ledger and signing keys.
     */
    descriptor(context: LedgerEventContext): Promise<src44.DescriptorData>;

    serialize(): SerializableLedgerEvent<T>;
}

/**
 * An interface representing a constructor for LedgerEvent objects, allowing the instantiation
 * of a new LedgerEvent instance or creating one from a Transaction and relevant descriptor data.
 *
 * Events that reference linked overflow transactions can use the optional ledger parameter
 * to resolve them during deserialization.
 */
export interface LedgerEventConstructor<T extends LedgerEvent = LedgerEvent> {
    new(...args: any[]): T;

    fromTransaction(
        tx: Transaction,
        descriptorData: src44.DescriptorData,
        ledger: Ledger,
    ): Promise<T>;
}
