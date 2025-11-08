import { AbstractLedgerEvent } from "./abstract-ledger-event";
import type { Transaction } from "@signumjs/core";
import { src44 } from "@signumjs/standards";
import { LedgerEventRegistry } from "./ledger-event-registry";
import type { Checkpoint, Race } from "@er1p/types";
import * as v from "valibot";
import { EventName } from "../event-name";
import {
  Validators,
  Src44FieldNames,
  validateWithSchema,
} from "./event-helpers";
import {
  deserializeCheckpoints,
  serializeCheckpoints,
} from "./checkpoints-helpers.ts";

const RaceCreatedSchema = v.object({
  id: v.pipe(
    v.string(),
    v.nonEmpty("Race/Account Id is required"),
    Validators.AccountIdAction,
  ),
  name: v.pipe(v.string(), v.nonEmpty()),
  description: v.pipe(v.string(), v.nonEmpty()),
  directorId: v.pipe(v.string(), v.nonEmpty()),
  maxParticipants: v.pipe(v.number(), v.minValue(1)),
  latitude: Validators.LatitudeSchema,
  longitude: Validators.LongitudeSchema,
  checkpoints: v.array(
    v.object({
      id: v.pipe(v.string(), v.nonEmpty()),
      name: v.pipe(v.string(), v.nonEmpty(), v.maxLength(24)),
      latitude: Validators.LatitudeSchema,
      longitude: Validators.LongitudeSchema,
      distanceKilometer: v.pipe(v.number(), v.minValue(0)),
      elevationGain: v.pipe(v.number(), v.minValue(0)),
      elevationLoss: v.pipe(v.number(), v.minValue(0)),
      type: v.picklist(["split", "in", "out"]),
    }),
  ),
  dateTime: v.date(),
  durationMinutes: v.pipe(v.number(), v.minValue(0.1)),
  lengthKilometer: v.pipe(v.number(), v.minValue(0.1)),
  bannerLogoUrl: Validators.OptionalUrl,
  imageLogoUrl: Validators.OptionalUrl,
});

// TODO: Checkpoints can exceed out tx payload limit... we need to split them into multiple tx

export class RaceCreatedEvent extends AbstractLedgerEvent<Race> {
  public static readonly Name = "race_created";
  public static readonly Version = 1;

  constructor(payload: Race, tx?: Transaction) {
    super(RaceCreatedEvent.Name, RaceCreatedEvent.Version, payload, tx);
  }

  validate(): string[] {
    return validateWithSchema(RaceCreatedSchema, this.payload);
  }

  protected descriptorImpl(
    builder: src44.DescriptorDataBuilder,
  ): src44.DescriptorData {
    const args = this.payload;

    return builder
      .setDescription(args.description)
      .setType("biz")
      .setCustomField(Src44FieldNames.RACE_DIRECTOR, args.directorId)
      .setCustomField(Src44FieldNames.RACE_NAME, args.name)
      .setCustomField(
        Src44FieldNames.MAX_PARTICIPANTS,
        args.maxParticipants.toString(),
      )
      .setCustomField(Src44FieldNames.LATITUDE, args.latitude.toString())
      .setCustomField(Src44FieldNames.LONGITUDE, args.longitude.toString())
      .setCustomField(
        Src44FieldNames.CHECKPOINTS,
        serializeCheckpoints(args.checkpoints),
      )
      .setCustomField(
        Src44FieldNames.DATE_TIME,
        args.dateTime.getTime().toString(),
      )
      .setCustomField(
        Src44FieldNames.MAX_DURATION_MINUTES,
        args.durationMinutes.toString(),
      )
      .setCustomField(
        Src44FieldNames.LENGTH_KM,
        args.lengthKilometer.toString(),
      )
      .setCustomField(
        Src44FieldNames.BANNER_LOGO,
        args.bannerLogoUrl.toString(),
      )
      .setCustomField(Src44FieldNames.IMAGE_LOGO, args.imageLogoUrl.toString())
      .build();
  }

  static fromTransaction(
    tx: Transaction,
    descriptor: src44.DescriptorData,
  ): RaceCreatedEvent {
    const d = descriptor;

    return new RaceCreatedEvent(
      {
        id: tx.recipient ?? "",
        name: (d.getCustomField(Src44FieldNames.RACE_NAME) as string) || "",
        description: d.description,
        directorId:
          (d.getCustomField(Src44FieldNames.RACE_DIRECTOR) as string) || "",
        maxParticipants: parseInt(
          (d.getCustomField(Src44FieldNames.MAX_PARTICIPANTS) as string) || "0",
        ),
        latitude: parseFloat(
          (d.getCustomField(Src44FieldNames.LATITUDE) as string) || "0",
        ),
        longitude: parseFloat(
          (d.getCustomField(Src44FieldNames.LONGITUDE) as string) || "0",
        ),
        checkpoints: deserializeCheckpoints(
          d.getCustomField(Src44FieldNames.CHECKPOINTS) as string,
        ),
        dateTime: new Date(
          parseInt(
            (d.getCustomField(Src44FieldNames.DATE_TIME) as string) || "0",
          ),
        ),
        durationMinutes: parseInt(
          (d.getCustomField(Src44FieldNames.MAX_DURATION_MINUTES) as string) ||
            "0",
        ),
        lengthKilometer: parseFloat(
          (d.getCustomField(Src44FieldNames.LENGTH_KM) as string) || "0",
        ),
        bannerLogoUrl:
          (d.getCustomField(Src44FieldNames.BANNER_LOGO) as string) || "",
        imageLogoUrl:
          (d.getCustomField(Src44FieldNames.IMAGE_LOGO) as string) || "",
      },
      tx,
    );
  }
}

LedgerEventRegistry.getInstance().register(
  RaceCreatedEvent,
  new EventName(RaceCreatedEvent.Name, RaceCreatedEvent.Version),
);
