import type { Transaction } from "@signumjs/core";
import { src44 } from "@signumjs/standards";

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
  extends Pick<LedgerEvent<T>, "name" | "version" | "payload" | "tx"> {}

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

  /**
   * Validates the implementation of a specific functionality or logic.
   * This method must be implemented by subclasses to define their validation behavior.
   *
   * @return {string[]} An array of error messages as strings, where each message represents
   * a specific validation error. If no errors are found, the array will be empty.
   */
  validate(): string[];
  /**
   * Retrieves the descriptor data associated with the event.
   * This method must be implemented by subclasses to define their descriptor behavior.
   *
   * @return {src44.DescriptorData} The descriptor data associated with the event.
   */
  descriptor(): src44.DescriptorData;

  /**
   * Converts the current object or data structure into a serialized format.
   * The method allows the object to be transformed into a storable and transferable format.
   *
   * @return {any} The serialized representation of the object or data structure.
   */
  serialize(): SerializableLedgerEvent<T>;
}

/**
 * An interface representing a constructor for LedgerEvent objects, allowing the instantiation
 * of a new LedgerEvent instance or creating one from a Transaction and relevant descriptor data.
 *
 * @template T - A type that extends the LedgerEvent base class.
 *
 * @interface
 *
 * @method
 * @name new
 * @description Creates a new instance of the specified LedgerEvent, passing additional arguments
 * to the constructor as needed.
 *
 * @method
 * @name fromTransaction
 * @description Instantiates a LedgerEvent object of type T using a given Transaction and descriptor data.
 * Useful for creating events based on raw transaction details.
 * @param {Transaction} tx - The data representing a financial or ledger transaction.
 * @param {src44.DescriptorData} descriptorData - Additional metadata or information to associate
 * with the LedgerEvent instance.
 * @returns {T} A new instance of a LedgerEvent-derived object populated with the provided data.
 */
export interface LedgerEventConstructor<T extends LedgerEvent = LedgerEvent> {
  new (...args: any[]): T;
  fromTransaction(tx: Transaction, descriptorData: src44.DescriptorData): T;
}
