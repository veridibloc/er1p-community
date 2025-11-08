import { AbstractLedgerEvent } from "./abstract-ledger-event";
import type { Transaction } from "@signumjs/core";
import { src44 } from "@signumjs/standards";
import { LedgerEventRegistry } from "./ledger-event-registry";
import { EventName } from "../event-name";
import * as v from "valibot";
import { Src44FieldNames, validateWithSchema } from "./event-helpers";

const ParticipantConfirmedEventSchema = v.object({
  bib: v.pipe(v.string(), v.nonEmpty("Bib is required"), v.maxLength(10)),
  annotation: v.optional(v.pipe(v.string(), v.maxLength(255))),
});

type Payload = {
  bib: string;
  annotation?: string;
};

export class ParticipantConfirmedEvent extends AbstractLedgerEvent<Payload> {
  public static readonly Name = "participant_confirmed";
  public static readonly Version = 1;

  constructor(payload: Payload, tx?: Transaction) {
    super(
      ParticipantConfirmedEvent.Name,
      ParticipantConfirmedEvent.Version,
      payload,
      tx,
    );
  }

  validate(): string[] {
    return validateWithSchema(ParticipantConfirmedEventSchema, this.payload);
  }

  protected descriptorImpl(
    builder: src44.DescriptorDataBuilder,
  ): src44.DescriptorData {
    if (this.payload.annotation) {
      builder.setDescription(this.payload.annotation);
    }
    return builder
      .setCustomField(Src44FieldNames.BIB, this.payload.bib)
      .build();
  }

  static fromTransaction(
    tx: Transaction,
    descriptor: src44.DescriptorData,
  ): ParticipantConfirmedEvent {
    return new ParticipantConfirmedEvent(
      {
        bib: descriptor.getCustomField(Src44FieldNames.BIB) as string,
        annotation: descriptor.description ?? undefined,
      },
      tx,
    );
  }
}

LedgerEventRegistry.getInstance().register(
  ParticipantConfirmedEvent,
  new EventName(
    ParticipantConfirmedEvent.Name,
    ParticipantConfirmedEvent.Version,
  ),
);
