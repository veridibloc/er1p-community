import { AbstractLedgerEvent } from "./abstract-ledger-event";
import type { Transaction } from "@signumjs/core";
import { src44 } from "@signumjs/standards";
import { LedgerEventRegistry } from "./ledger-event-registry";
import { EventName } from "../event-name";
import {
  Src44FieldNames,
  validateWithSchema,
  Validators,
} from "./event-helpers";
import * as v from "valibot";

const CheckpointPassedEventSchema = v.object({
  checkpointId: v.pipe(v.string(), v.nonEmpty("Checkpoint ID is required")),
  latitude: Validators.LatitudeSchema,
  longitude: Validators.LongitudeSchema,
  dateTime: v.pipe(
    v.date(),
    v.maxValue(new Date(), "Date time must be in the past"),
  ),
  kilometer: v.pipe(v.number(), v.minValue(0)),
  elevationGain: v.pipe(
    v.number(),
    v.minValue(0, "Elevation gain must be zero or positive"),
  ),
  elevationLoss: v.pipe(
    v.number(),
    v.minValue(0, "Elevation loss must be zero or positive"),
  ),
  elevation: v.number(),
  weatherTemperature: v.pipe(v.number(), v.minValue(-90), v.maxValue(90)),
  weatherUvIndex: v.pipe(v.number(), v.minValue(0), v.maxValue(20)),
  weatherHumidity: v.pipe(v.number(), v.minValue(0), v.maxValue(100)),
  weatherPressure: v.pipe(v.number(), v.minValue(0), v.maxValue(100000)),
  weatherPrecipitation: v.pipe(v.number(), v.minValue(0), v.maxValue(100)),
  windSpeed: v.pipe(v.number(), v.minValue(0), v.maxValue(300)),
  windDirection: v.pipe(v.number(), v.minValue(0), v.maxValue(360)),
  type: v.picklist(["split", "in", "out"]),
  action: v.picklist(["continue", "give_up", "disqualified"]),
  reason: v.optional(v.string()),
});

type Payload = v.InferInput<typeof CheckpointPassedEventSchema>;

export class CheckpointPassedEvent extends AbstractLedgerEvent<Payload> {
  public static readonly Name = "checkpoint_passed";
  public static readonly Version = 1;

  constructor(payload: Payload, tx?: Transaction) {
    super(
      CheckpointPassedEvent.Name,
      CheckpointPassedEvent.Version,
      payload,
      tx,
    );
  }

  validate(): string[] {
    return validateWithSchema(CheckpointPassedEventSchema, this.payload);
  }

  protected descriptorImpl(
    builder: src44.DescriptorDataBuilder,
  ): src44.DescriptorData {
    const {
      checkpointId,
      dateTime,
      kilometer,
      latitude,
      longitude,
      elevationLoss,
      elevationGain,
      elevation,
      weatherTemperature,
      weatherHumidity,
      weatherPressure,
      windSpeed,
      windDirection,
      weatherUvIndex,
      weatherPrecipitation,
      type,
      action,
      reason,
    } = this.payload;
    return builder
      .setId(checkpointId)
      .setCustomField(Src44FieldNames.DATE_TIME, dateTime.getTime().toString())
      .setCustomField(Src44FieldNames.LENGTH_KM, kilometer.toString())
      .setCustomField(Src44FieldNames.LATITUDE, latitude.toString())
      .setCustomField(Src44FieldNames.LONGITUDE, longitude.toString())
      .setCustomField(
        Src44FieldNames.CP_ELEVATION_GAIN,
        elevationGain.toString(),
      )
      .setCustomField(
        Src44FieldNames.CP_ELEVATION_LOSS,
        elevationLoss.toString(),
      )
      .setCustomField(Src44FieldNames.CP_ELEVATION, elevation.toString())
      .setCustomField(
        Src44FieldNames.CP_WEATHER_PRESSURE,
        weatherPressure.toString(),
      )
      .setCustomField(
        Src44FieldNames.CP_WEATHER_HUMIDITY,
        weatherHumidity.toString(),
      )
      .setCustomField(
        Src44FieldNames.CP_WEATHER_TEMPERATURE,
        weatherTemperature.toString(),
      )
      .setCustomField(
        Src44FieldNames.CP_WEATHER_WIND_DIRECTION,
        windDirection.toString(),
      )
      .setCustomField(
        Src44FieldNames.CP_WEATHER_WIND_SPEED,
        windSpeed.toString(),
      )
      .setCustomField(
        Src44FieldNames.CP_WEATHER_UV_INDEX,
        weatherUvIndex.toString(),
      )
      .setCustomField(
        Src44FieldNames.CP_WEATHER_PRECIPITATION,
        weatherPrecipitation.toString(),
      )
      .setCustomField(
        Src44FieldNames.CP_TYPE,
        CheckpointPassedEvent.typeToSrc44(type),
      )
      .setCustomField(
        Src44FieldNames.CP_ACTION,
        CheckpointPassedEvent.actionToSrc44(this.payload.action),
      )
      .setCustomField(Src44FieldNames.CP_REASON, reason ?? "")
      .build();
  }

  protected static typeToSrc44(type: Payload["type"]): string {
    if (type === "split") {
      return "s";
    }
    if (type === "in") {
      return "i";
    }
    if (type === "out") {
      return "o";
    }
    throw new Error(`Unknown type: ${type}`);
  }

  protected static src44ToType(src44Type: string): Payload["type"] {
    if (src44Type === "s") {
      return "split";
    }
    if (src44Type === "i") {
      return "in";
    }
    if (src44Type === "o") {
      return "out";
    }
    throw new Error(`Unknown type: ${src44Type}`);
  }

  protected static actionToSrc44(action: Payload["action"]): string {
    if (action === "continue") {
      return "c";
    }
    if (action === "give_up") {
      return "g";
    }
    if (action === "disqualified") {
      return "d";
    }
    throw new Error(`Unknown action: ${action}`);
  }

  protected static src44ToAction(src44Action: string): Payload["action"] {
    if (src44Action === "c") {
      return "continue";
    }
    if (src44Action === "g") {
      return "give_up";
    }
    if (src44Action === "d") {
      return "disqualified";
    }
    throw new Error(`Unknown action: ${src44Action}`);
  }

  static fromTransaction(
    tx: Transaction,
    descriptor: src44.DescriptorData,
  ): CheckpointPassedEvent {
    const d = descriptor.raw;

    return new CheckpointPassedEvent(
      {
        checkpointId: d.id as string,
        dateTime: new Date(
          parseInt((d[Src44FieldNames.DATE_TIME] as string) ?? "0"),
        ),
        kilometer: Number(d[Src44FieldNames.LENGTH_KM]),
        latitude: Number(d[Src44FieldNames.LATITUDE]),
        longitude: Number(d[Src44FieldNames.LONGITUDE]),
        elevationGain: Number(d[Src44FieldNames.CP_ELEVATION_GAIN]),
        elevationLoss: Number(d[Src44FieldNames.CP_ELEVATION_LOSS]),
        elevation: Number(d[Src44FieldNames.CP_ELEVATION]),
        weatherTemperature: Number(d[Src44FieldNames.CP_WEATHER_TEMPERATURE]),
        weatherHumidity: Number(d[Src44FieldNames.CP_WEATHER_HUMIDITY]),
        weatherPressure: Number(d[Src44FieldNames.CP_WEATHER_PRESSURE]),
        windSpeed: Number(d[Src44FieldNames.CP_WEATHER_WIND_SPEED]),
        windDirection: Number(d[Src44FieldNames.CP_WEATHER_WIND_DIRECTION]),
        weatherUvIndex: Number(d[Src44FieldNames.CP_WEATHER_UV_INDEX]),
        weatherPrecipitation: Number(
          d[Src44FieldNames.CP_WEATHER_PRECIPITATION],
        ),
        type: CheckpointPassedEvent.src44ToType(
          d[Src44FieldNames.CP_TYPE] as string,
        ),
        action: CheckpointPassedEvent.src44ToAction(
          d[Src44FieldNames.CP_ACTION] as string,
        ),
        reason: d[Src44FieldNames.CP_REASON] as string,
      },
      tx,
    );
  }
}

LedgerEventRegistry.getInstance().register(
  CheckpointPassedEvent,
  new EventName(CheckpointPassedEvent.Name, CheckpointPassedEvent.Version),
);
