import { AbstractLedgerEvent } from "./abstract-ledger-event";
import type { Transaction } from "@signumjs/core";
import { src44 } from "@signumjs/standards";
import { LedgerEventRegistry } from "./ledger-event-registry";
import { EventName } from "../event-name";
import { Src44FieldNames, validateWithSchema } from "./event-helpers";
import * as v from "valibot";

const ParticipantDisqualifiedEventSchema = v.object({
  reason: v.optional(v.pipe(v.string(), v.maxLength(255))),
  dateTime: v.date(),
});

type Payload = {
  reason: string;
  dateTime: Date;
};

export class ParticipantDisqualifiedEvent extends AbstractLedgerEvent<Payload> {
  public static readonly Name = "participant_disqualified";
  public static readonly Version = 1;

  constructor(payload: Payload, tx?: Transaction) {
    super(
      ParticipantDisqualifiedEvent.Name,
      ParticipantDisqualifiedEvent.Version,
      payload,
      tx,
    );
  }

  validate(): string[] {
    return validateWithSchema(ParticipantDisqualifiedEventSchema, this.payload);
  }

  protected descriptorImpl(
    builder: src44.DescriptorDataBuilder,
  ): src44.DescriptorData {
    return builder
      .setDescription(this.payload.reason)
      .setCustomField(
        Src44FieldNames.DATE_TIME,
        this.payload.dateTime.getTime().toString(),
      )
      .build();
  }

  static fromTransaction(
    tx: Transaction,
    descriptor: src44.DescriptorData,
  ): ParticipantDisqualifiedEvent {
    return new ParticipantDisqualifiedEvent(
      {
        reason: descriptor.description,
        dateTime: new Date(
          parseInt(
            (descriptor.getCustomField(Src44FieldNames.DATE_TIME) as string) ||
              "0",
          ),
        ),
      },
      tx,
    );
  }
}

LedgerEventRegistry.getInstance().register(
  ParticipantDisqualifiedEvent,
  new EventName(
    ParticipantDisqualifiedEvent.Name,
    ParticipantDisqualifiedEvent.Version,
  ),
);
