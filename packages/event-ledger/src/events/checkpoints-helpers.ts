import type {Checkpoint} from "../race.types.ts";

export type CheckpointEventData = any[];

const CheckpointElementCount = 11;

export function fromEventDataToCheckpoint(
  checkpointData: CheckpointEventData,
): Checkpoint {
  if (checkpointData.length !== CheckpointElementCount) {
    throw new Error("Invalid checkpoint data");
  }

  if (parseInt(checkpointData[0]) !== 1) {
    throw new Error(
      "Invalid checkpoint version - expect '1' but got: " + checkpointData[0],
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
): CheckpointEventData {
  let type = "s";
  if (checkpoint.type === "in") {
    type = "i";
  } else if (checkpoint.type === "out") {
    type = "o";
  } else if (checkpoint.type === "split") {
    type = "s";
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
  return checkpoints.map(fromCheckpointToEventData).toString();
}

export function deserializeCheckpoints(checkpointData: string): Checkpoint[] {
  const checkpoints: Checkpoint[] = [];
  let buffer: CheckpointEventData[] = [];
  checkpointData?.split(",").forEach((part, i) => {
    buffer.push(part as any);
    if (i % CheckpointElementCount === CheckpointElementCount - 1) {
      checkpoints.push(fromEventDataToCheckpoint(buffer));
      buffer = [];
    }
  });

  return checkpoints;
}
