import type {Checkpoint} from "../race.types.ts";

export type CheckpointEventData = any[];

const CheckpointElementCount = 11;

export function fromEventDataToCheckpoint(
  checkpointData: CheckpointEventData,
): Checkpoint {
  if (checkpointData.length !== CheckpointElementCount) {
    throw new Error("Invalid checkpoint data");
  }

  const version = parseInt(checkpointData[0]);
  if (version !== 1 && version !== 2) {
    throw new Error(
      "Invalid checkpoint version - expect '1' or '2' but got: " + checkpointData[0],
    );
  }

  const cptype = checkpointData[10];
  let type: "in" | "out" | "split" = "split";
  if (cptype === "i") {
    type = "in";
  } else if (cptype === "o") {
    type = "out";
  } else if (cptype === "s") {
    type = "split";
  }

  if (version === 2) {
    // v2 compact: omitted fields will be filled by deserializeCheckpoints
    return {
      id: checkpointData[1],
      name: checkpointData[2],
      distanceKilometer: 0,
      latitude: 0,
      longitude: 0,
      elevationGain: 0,
      elevationLoss: 0,
      elevation: 0,
      cutoffTimeInMinutes: parseInt(checkpointData[9]) || 0,
      type,
    };
  }

  return {
    id: checkpointData[1],
    name: checkpointData[2],
    distanceKilometer: parseFloat(checkpointData[3]),
    latitude: parseFloat(checkpointData[4]),
    longitude: parseFloat(checkpointData[5]),
    elevationGain: parseInt(checkpointData[6]),
    elevationLoss: parseInt(checkpointData[7]),
    elevation: parseInt(checkpointData[8]),
    cutoffTimeInMinutes: parseInt(checkpointData[9]),
    type,
  };
}

export function fromCheckpointToEventData(
  checkpoint: Checkpoint,
  previousCheckpoint?: Checkpoint,
): CheckpointEventData {
  let type = "s";
  if (checkpoint.type === "in") {
    type = "i";
  } else if (checkpoint.type === "out") {
    type = "o";
  } else if (checkpoint.type === "split") {
    type = "s";
  }

  // v2 compact: "out" checkpoint sharing coords with preceding "in"
  const isCompact =
    checkpoint.type === "out" &&
    previousCheckpoint?.type === "in" &&
    Math.abs(checkpoint.latitude - previousCheckpoint.latitude) < 0.0001 &&
    Math.abs(checkpoint.longitude - previousCheckpoint.longitude) < 0.0001;

  if (isCompact) {
    return [
      2, // version
      checkpoint.id,
      checkpoint.name,
      "",
      "",
      "",
      "",
      "",
      "",
      checkpoint.cutoffTimeInMinutes.toFixed(0),
      type,
    ];
  }

  return [
    1, // version
    checkpoint.id,
    checkpoint.name,
    checkpoint.distanceKilometer.toFixed(2),
    checkpoint.latitude.toFixed(4), // sufficient precision for lat/long (approx. 11m)
    checkpoint.longitude.toFixed(4),
    checkpoint.elevationGain.toFixed(0),
    checkpoint.elevationLoss.toFixed(0),
    checkpoint.elevation.toFixed(0),
    checkpoint.cutoffTimeInMinutes.toFixed(0),
    type,
  ];
}

export function serializeCheckpoints(checkpoints: Checkpoint[]): string {
  return checkpoints
    .map((cp, i) => fromCheckpointToEventData(cp, i > 0 ? checkpoints[i - 1] : undefined))
    .toString();
}

export function deserializeCheckpoints(checkpointData: string): Checkpoint[] {
  const checkpoints: Checkpoint[] = [];
  let buffer: CheckpointEventData[] = [];
  checkpointData?.split(",").forEach((part, i) => {
    buffer.push(part as any);
    if (i % CheckpointElementCount === CheckpointElementCount - 1) {
      const cp = fromEventDataToCheckpoint(buffer);
      // v2 compact: inherit fields from previous checkpoint
      const version = parseInt(String(buffer[0]));
      if (version === 2 && checkpoints.length > 0) {
        const prev = checkpoints[checkpoints.length - 1]!;
        cp.latitude = prev.latitude;
        cp.longitude = prev.longitude;
        cp.distanceKilometer = prev.distanceKilometer;
        cp.elevationGain = prev.elevationGain;
        cp.elevationLoss = prev.elevationLoss;
        cp.elevation = prev.elevation;
      }
      checkpoints.push(cp);
      buffer = [];
    }
  });

  return checkpoints;
}

/**
 * Splits serialized checkpoint data into chunks that each fit within maxBytes.
 * Splits on checkpoint boundaries (every 11 comma-separated elements).
 */
export function splitCheckpointData(data: string, maxBytes: number): string[] {
  const parts = data.split(",");
  const chunks: string[] = [];
  let currentChunk: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    currentChunk.push(parts[i]!);

    // At checkpoint boundary (every 11 elements)
    if (currentChunk.length % CheckpointElementCount === 0) {
      const candidate = currentChunk.join(",");
      if (new TextEncoder().encode(candidate).length > maxBytes) {
        // Current checkpoint pushes over limit - split before it
        const overflow = currentChunk.splice(-CheckpointElementCount);
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.join(","));
        }
        currentChunk = overflow;
      }
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(","));
  }

  return chunks;
}
