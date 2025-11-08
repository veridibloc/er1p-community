import { AbstractLedgerEvent } from "./abstract-ledger-event";
import type { Transaction } from "@signumjs/core";
import { src44 } from "@signumjs/standards";
import { Src44FieldNames, validateWithSchema } from "./event-helpers";
import * as v from "valibot";
import { LedgerEventRegistry } from "./ledger-event-registry";
import { EventName } from "../event-name";

const RaceFlowEventSchema = v.object({
  dateTime: v.date(),
  reason: v.optional(v.pipe(v.string(), v.maxLength(255))),
});

interface RaceGenericFlowPayload {
  dateTime: Date;
  reason?: string;
}

abstract class BaseRaceFlowEvent extends AbstractLedgerEvent<RaceGenericFlowPayload> {
  constructor(
    name: string,
    version: number,
    payload: RaceGenericFlowPayload,
    tx?: Transaction,
  ) {
    super(name, version, payload, tx);
  }

  validate(): string[] {
    return validateWithSchema(RaceFlowEventSchema, this.payload);
  }

  protected descriptorImpl(
    builder: src44.DescriptorDataBuilder,
  ): src44.DescriptorData {
    const args = this.payload;
    if (args.reason) {
      builder.setDescription(args.reason);
    }
    return builder
      .setType("biz")
      .setCustomField(
        Src44FieldNames.DATE_TIME,
        args.dateTime.getTime().toString(),
      )
      .build();
  }

  protected static createFromTransaction<T extends BaseRaceFlowEvent>(
    this: new (payload: RaceGenericFlowPayload, tx?: Transaction) => T,
    tx: Transaction,
    descriptor: src44.DescriptorData,
  ): T {
    const d = descriptor;
    return new this(
      {
        dateTime: new Date(
          parseInt(
            (d.getCustomField(Src44FieldNames.DATE_TIME) as string) || "0",
          ),
        ),
        reason: d.description ?? undefined,
      },
      tx,
    );
  }
}

export enum RaceFlowEventNames {
  RaceStarted = "race_started",
  RaceStopped = "race_stopped",
  RaceResumed = "race_resumed",
  RaceCancelled = "race_cancelled",
  RaceEnded = "race_ended",
}

export const RaceFlowEventNamesArray: EventName[] = [
  { version: 1, name: RaceFlowEventNames.RaceStarted },
  { version: 1, name: RaceFlowEventNames.RaceStopped },
  { version: 1, name: RaceFlowEventNames.RaceResumed },
  { version: 1, name: RaceFlowEventNames.RaceCancelled },
  { version: 1, name: RaceFlowEventNames.RaceEnded },
];

/**
 * Creates a class representing a race flow event with a specified name and version.
 *
 * @param {RaceFlowEventNames} name - The name of the race flow event.
 * @param {number} [version=1] - The version of the race flow event. Defaults to 1 if not specified.
 * @return {typeof BaseRaceFlowEvent} A class inheriting from BaseRaceFlowEvent that represents the race flow event.
 */
function createRaceFlowEventClass(
  name: RaceFlowEventNames,
  version: number = 1,
) {
  class RaceFlowEvent extends BaseRaceFlowEvent {
    public static readonly Name = name;
    public static readonly Version = version;

    constructor(payload: RaceGenericFlowPayload, tx?: Transaction) {
      super(name, version, payload, tx);
    }

    static fromTransaction(tx: Transaction, descriptor: src44.DescriptorData) {
      return BaseRaceFlowEvent.createFromTransaction.call(this, tx, descriptor);
    }
  }
  return RaceFlowEvent;
}

/**
 * Creates a new race flow event instance based on the specified type and payload.
 *
 * @param {RaceFlowEventNames} type - The type of the race flow event to be created.
 * @param {RaceGenericFlowPayload} payload - The payload data to be associated with the race flow event.
 * @param {Transaction} [tx] - Optional transaction object associated with the event.
 * @return {Object} An instance of the race flow event class corresponding to the specified type.
 */
export function createRaceFlowEvent(
  type: RaceFlowEventNames,
  payload: RaceGenericFlowPayload,
  tx?: Transaction,
) {
  const EventClass = createRaceFlowEventClass(type);
  return new EventClass(payload, tx);
}

export type RaceFlowEvent = ReturnType<typeof createRaceFlowEvent>;

Object.values(RaceFlowEventNames).forEach((name) => {
  const EventClass = createRaceFlowEventClass(name);
  LedgerEventRegistry.getInstance().register(
    EventClass,
    new EventName(EventClass.Name, EventClass.Version),
  );
});
