import * as v from "valibot";

export const Src44FieldNames = {
  NAME: "nm",
  ID: "id",

  MAX_PARTICIPANTS: "xmx",
  LATITUDE: "xlt",
  LONGITUDE: "xlg",
  CHECKPOINTS: "xcp",
  DATE_TIME: "xdt",
  TIMESTAMP: "xt",
  MAX_DURATION_MINUTES: "xdu",
  LENGTH_KM: "xs",
  BANNER_LOGO: "xbg",
  IMAGE_LOGO: "xmg",
  RACE_DIRECTOR: "xrd",
  RACE_NAME: "xrn",
  BIB: "xbib",
  CP_NAME: "nm",
  CP_ID: "id",
  CP_DISTANCE: "xd",
  CP_LATITUDE: "xlat",
  CP_LONGITUDE: "xlng",
  CP_TYPE: "xty",
  CP_ELEVATION_GAIN: "xeg",
  CP_ELEVATION_LOSS: "xel",
  CP_ELEVATION: "xe",
  CP_WEATHER_TEMPERATURE: "xwt",
  CP_WEATHER_HUMIDITY: "xwh",
  CP_WEATHER_PRESSURE: "xwp",
  CP_WEATHER_WIND_SPEED: "xws",
  CP_WEATHER_WIND_DIRECTION: "xwd",
  CP_WEATHER_UV_INDEX: "xwv",
  CP_WEATHER_PRECIPITATION: "xwr",
  CP_ACTION: "xact",
  CP_REASON: "xrsn",
};

export const Validators = {
  AccountIdAction: v.regex(/^[1-9][0-9]{15,24}$/, "Invalid account id"),
  LatitudeSchema: v.pipe(v.number(), v.minValue(-90), v.maxValue(90)),
  LongitudeSchema: v.pipe(v.number(), v.minValue(-180), v.maxValue(180)),
  OptionalUrl: v.union([v.literal(""), v.pipe(v.string(), v.url())]),
};

export function validateWithSchema(schema: any, payload: any): string[] {
  const result = v.safeParse(schema, payload);
  if (result.success) {
    return [];
  }
  return result.issues.map((i) => i.message);
}
