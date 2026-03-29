import {
  Address,
  AttachmentMessage,
  type Ledger,
  type Transaction,
  TransactionArbitrarySubtype,
  type TransactionId,
  type TransactionList,
  TransactionPaymentSubtype,
  TransactionType,
} from "@signumjs/core";
import type { SignKeys } from "@signumjs/crypto";
import { Amount } from "@signumjs/util";
import { HttpError } from "@signumjs/http";
import { LedgerEventRegistry } from "./events/ledger-event-registry";
import { AbstractLedgerEvent } from "./events/abstract-ledger-event";
import type { LedgerEvent } from "./ledger-event.types";
import type { EventName } from "./event-name";

interface FetchPendingEventsArgs {
  recipientId?: string;
  senderId?: string;
  eventNames?: EventName[];
}

interface FetchEventsArgs extends FetchPendingEventsArgs {
  startBlockHeight?: number;
  endBlockHeight?: number;
  firstIndex?: number;
  lastIndex?: number;
}

interface DispatchArgs {
  event: LedgerEvent;
  senderKeys: SignKeys;
  recipientPublicKey: string;
  amount?: Amount;
}

export class EventLedgerError extends Error {}

/**
 * Represents an event ledger that manages and dispatches ledger events.
 *
 * This class is responsible for dispatching events to a ledger and fetching events based on specified criteria.
 */
export class EventLedger {
  public static MAX_EVENTS_PER_PAGE = 500;
  public static MAX_BLOCK_RANGE_SIZE = 50;

  constructor(
    public readonly ledger: Ledger,
    public readonly eventRegistry: LedgerEventRegistry = LedgerEventRegistry.getInstance(),
  ) {}

  /**
   * Dispatches an event to a recipient by sending either a transaction with an amount or a message.
   *
   * The event's descriptor() is called with a context containing the ledger and signing keys,
   * allowing events to send linked overflow transactions if needed.
   */
  async dispatch({
    event,
    recipientPublicKey,
    senderKeys,
    amount,
  }: DispatchArgs): Promise<TransactionId> {
    try {
      const recipientId =
        Address.fromPublicKey(recipientPublicKey).getNumericId();

      const descriptorData = await event.descriptor({
        ledger: this.ledger,
        senderKeys,
        recipientPublicKey,
        recipientId,
      });

      const attachment = new AttachmentMessage({
        message: descriptorData.stringify(),
        messageIsText: true,
      });
      const fee = this.calculateFee(attachment);
      if (amount) {
        return (await this.ledger.transaction.sendAmountToSingleRecipient({
          recipientPublicKey,
          recipientId,
          amountPlanck: amount.getPlanck(),
          feePlanck: fee.getPlanck(),
          deadline: 60,
          senderPrivateKey: senderKeys.signPrivateKey,
          senderPublicKey: senderKeys.publicKey,
          attachment,
        })) as TransactionId;
      }

      return (await this.ledger.message.sendMessage({
        recipientPublicKey,
        recipientId,
        feePlanck: fee.getPlanck(),
        deadline: 60,
        senderPrivateKey: senderKeys.signPrivateKey,
        senderPublicKey: senderKeys.publicKey,
        message: attachment.message,
        messageIsText: true,
      })) as TransactionId;
    } catch (e: any) {
      if (e instanceof HttpError) {
        const errorMessage = `Ledger error while requesting ${e.requestUrl} (Status code: ${e.status} ) - ${e.message}`;
        throw new EventLedgerError(errorMessage);
      }
      throw new EventLedgerError(e.message);
    }
  }

  private isValidEventTransaction(tx: Transaction): boolean {
    return (
      (tx.type === TransactionType.Payment &&
        tx.subtype === TransactionPaymentSubtype.Ordinary) ||
      (tx.type === TransactionType.Arbitrary &&
        tx.subtype === TransactionArbitrarySubtype.Message &&
        tx.attachment.message &&
        tx.attachment.messageIsText)
    );
  }

  /**
   * Fetches pending ledger events that match specific criteria based on the provided arguments.
   */
  async fetchPendingEvents({
    recipientId,
    senderId,
    eventNames,
  }: FetchPendingEventsArgs): Promise<LedgerEvent[]> {
    const pending = await this.ledger.transaction.getUnconfirmedTransactions();

    const events: LedgerEvent[] = [];
    for (const transaction of pending.unconfirmedTransactions) {
      if (!this.isValidEventTransaction(transaction)) {
        continue;
      }

      if (recipientId && transaction.recipient !== recipientId) {
        continue;
      }
      if (senderId && transaction.sender !== senderId) {
        continue;
      }
      const e = await AbstractLedgerEvent.safeParse(transaction, this.eventRegistry, this.ledger);
      if (!e) {
        continue;
      }

      if (eventNames && eventNames.find(({ name }) => name !== e.name)) {
        continue;
      }

      events.push(e);
    }

    return events.sort((a, b) => {
      if (a.payload.dateTime && b.payload.dateTime) {
        return b.payload.dateTime.getTime() - a.payload.dateTime.getTime();
      } else {
        return b.tx!.timestamp - a.tx!.timestamp;
      }
    });
  }

  /**
   * Fetches ledger events based on the provided filters and criteria.
   */
  async fetchEvents({
    recipientId,
    senderId,
    startBlockHeight,
    endBlockHeight,
    eventNames,
    firstIndex = 0,
    lastIndex = EventLedger.MAX_EVENTS_PER_PAGE,
  }: FetchEventsArgs): Promise<LedgerEvent[]> {
    const blockRequests = [];
    let startTimestamp = 0;
    let endTimestamp = 0;
    if (startBlockHeight) {
      blockRequests.push(
        this.ledger.block.getBlockByHeight(startBlockHeight, false),
      );
    }
    if (endBlockHeight) {
      blockRequests.push(
        this.ledger.block.getBlockByHeight(endBlockHeight, false),
      );
    }
    if (blockRequests.length > 0) {
      const [startBlock, endBlock] = await Promise.all(blockRequests);
      startTimestamp = startBlock?.timestamp ?? 0;
      endTimestamp = endBlock?.timestamp ?? 0;
    }

    let transactionList: TransactionList = {
      transactions: [],
      requestProcessingTime: 0,
    };
    if (recipientId && senderId) {
      transactionList =
        await this.ledger.account.getAccountTransactionsBetweenSenderAndRecipient(
          {
            recipientId,
            senderId,
            firstIndex,
            lastIndex,
            timestamp: startTimestamp.toString(),
          },
        );
    } else if (recipientId) {
      transactionList =
        await this.ledger.account.getAccountTransactionsToRecipient({
          recipientId,
          firstIndex,
          lastIndex,
          timestamp: startTimestamp.toString(),
        });
    } else if (senderId) {
      transactionList =
        await this.ledger.account.getAccountTransactionsFromSender({
          senderId,
          firstIndex,
          lastIndex,
          timestamp: startTimestamp.toString(),
        });
    } else {
      const blockRange = Math.abs(firstIndex - lastIndex);
      if (blockRange > EventLedger.MAX_BLOCK_RANGE_SIZE) {
        throw new Error(
          `Block range too large (max ${EventLedger.MAX_BLOCK_RANGE_SIZE})`,
        );
      }

      const blockList = await this.ledger.block.getBlocks(
        firstIndex,
        firstIndex + lastIndex,
        true,
      );
      const allTransactions = blockList.blocks.flatMap(
        (block) => block.transactions as unknown as Transaction[],
      );

      transactionList = {
        transactions: allTransactions,
        requestProcessingTime: 0,
      };
    }

    const events: LedgerEvent[] = [];
    for (let tx of transactionList.transactions) {
      if (!this.isValidEventTransaction(tx)) {
        continue;
      }
      if (startTimestamp > 0 && tx.timestamp < startTimestamp) continue;
      if (endTimestamp > 0 && tx.timestamp > endTimestamp) continue;
      const e = await AbstractLedgerEvent.safeParse(tx, this.eventRegistry, this.ledger);
      if (!e) {
        continue;
      }

      if (
        eventNames &&
        !eventNames.find((en) => en.name.toString() === e.name)
      ) {
        continue;
      }

      events.push(e);
    }
    return events;
  }

  private calculateFee(attachment: AttachmentMessage): Amount {
    const TxOverhead = 190;
    const MinSize = 190;
    const MaxSize = 1000;
    const MinFee = 0.01;
    const MaxFee = 0.06;
    const messageSize = attachment.message.length;
    const totalSize = TxOverhead + messageSize;

    if (messageSize > MaxSize) {
      throw new Error(
        `Message size is too big - Got: ${messageSize}b Max is ${MaxSize}b`,
      );
    }

    const clampedSize = Math.max(MinSize, Math.min(MaxSize, totalSize));
    const sizeRatio = (clampedSize - MinSize) / (MaxSize - MinSize);
    const calculatedFee = MinFee + sizeRatio * (MaxFee - MinFee);
    const roundedFee = Math.round(calculatedFee * 1000) / 1000;

    // Ensure fee never exceeds MaxFee after rounding
    const cappedFee = Math.min(roundedFee, MaxFee);

    return Amount.fromSigna(cappedFee);
  }
}
