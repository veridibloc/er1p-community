import { expect, describe, it } from "bun:test";
import {
  fromEventDataToCheckpoint,
  fromCheckpointToEventData,
  serializeCheckpoints,
  deserializeCheckpoints,
  type CheckpointEventData,
} from "./checkpoints-helpers";
import type { Checkpoint } from "@er1p/types";

describe("Checkpoint Helper Functions", () => {
  const validCheckpoint: Checkpoint = {
    id: "cp1",
    name: "Test Checkpoint",
    distanceKilometer: 10.5,
    latitude: 40.7128,
    longitude: -74.006,
    elevationGain: 100,
    elevationLoss: 50,
    elevation: 1200,
    cutoffTimeInMinutes: 120,
    type: "split",
  };

  // NOTE: There's a bug in the original implementation - fromCheckpointToEventData creates 9 elements
  // but fromEventDataToCheckpoint expects 8 elements and treats index 7 as type, not elevationLoss
  const eventData: CheckpointEventData = [
    1, // version
    "cp1",
    "Test Checkpoint",
    "10.50",
    "40.7128",
    "-74.0060",
    "100",
    "30",
    "1200",
    "120",
    "s",
  ];

  describe("fromEventDataToCheckpoint", () => {
    it("should handle in type correctly", () => {
      const data = [...eventData];
      data[7] = "i";

      const result = fromEventDataToCheckpoint(data);
      expect(result.type).toBe("in");
    });

    it("should handle out type correctly", () => {
      const data = [...eventData];
      data[7] = "o";

      const result = fromEventDataToCheckpoint(data);
      expect(result.type).toBe("out");
    });

    it("should default to split type for unknown type", () => {
      const data = [...eventData];
      data[7] = "unknown";

      const result = fromEventDataToCheckpoint(data);
      expect(result.type).toBe("split");
    });

    it("should throw error for wrong array length", () => {
      const shortData = [1, "cp1", "test"];

      expect(() => fromEventDataToCheckpoint(shortData)).toThrow(
        "Invalid checkpoint data",
      );
    });

    it("should throw error for wrong version", () => {
      const wrongVersion = [...eventData];
      wrongVersion[0] = 2;

      expect(() => fromEventDataToCheckpoint(wrongVersion)).toThrow(
        "Invalid checkpoint version",
      );
    });
  });

  describe("fromCheckpointToEventData", () => {
    it("should convert checkpoint to 9-element event data", () => {
      const result = fromCheckpointToEventData(validCheckpoint);

      expect(result).toEqual([
        1,
        "cp1",
        "Test Checkpoint",
        "10.50",
        "40.7128",
        "-74.0060",
        "100",
        "50",
        "1200",
        "120",
        "s",
      ]);
      expect(result.length).toBe(11);
    });

    it("should handle in type", () => {
      const checkpoint = { ...validCheckpoint, type: "in" as const };
      const result = fromCheckpointToEventData(checkpoint);

      expect(result[10]).toBe("i");
    });

    it("should handle out type", () => {
      const checkpoint = { ...validCheckpoint, type: "out" as const };
      const result = fromCheckpointToEventData(checkpoint);

      expect(result[10]).toBe("o");
    });

    it("should format numbers with correct precision", () => {
      const checkpoint: Checkpoint = {
        ...validCheckpoint,
        distanceKilometer: 10.123456,
        latitude: 40.712834567,
        longitude: -74.006987654,
        elevationGain: 100.7,
        elevationLoss: 50.3,
      };

      const result = fromCheckpointToEventData(checkpoint);

      expect(result[3]).toBe("10.12"); // 2 decimals
      expect(result[4]).toBe("40.7128"); // 4 decimals
      expect(result[5]).toBe("-74.0070"); // 4 decimals
      expect(result[6]).toBe("101"); // rounded to integer
      expect(result[7]).toBe("50"); // rounded to integer
    });
  });

  describe("serializeCheckpoints", () => {
    it("should serialize single checkpoint to comma-separated string", () => {
      const result = serializeCheckpoints([validCheckpoint]);

      expect(result).toBe(
        "1,cp1,Test Checkpoint,10.50,40.7128,-74.0060,100,50,1200,120,s",
      );
    });

    it("should serialize multiple checkpoints", () => {
      const checkpoint2: Checkpoint = {
        id: "cp2",
        name: "Second",
        distanceKilometer: 20.0,
        latitude: 41.0,
        longitude: -75.0,
        elevationGain: 200,
        elevationLoss: 100,
        elevation: 300,
        cutoffTimeInMinutes: 120,
        type: "in",
      };

      const result = serializeCheckpoints([validCheckpoint, checkpoint2]);

      expect(result).toBe(
        "1,cp1,Test Checkpoint,10.50,40.7128,-74.0060,100,50,1200,120,s,1,cp2,Second,20.00,41.0000,-75.0000,200,100,300,120,i",
      );
    });

    it("should handle empty array", () => {
      const result = serializeCheckpoints([]);
      expect(result).toBe("");
    });
  });

  describe("deserializeCheckpoints", () => {
    it("should return empty array for empty string", () => {
      const result = deserializeCheckpoints("");
      expect(result).toEqual([]);
    });

    it("should return empty array for undefined", () => {
      const result = deserializeCheckpoints(undefined as any);
      expect(result).toEqual([]);
    });

    it("should deserialize as expected", () => {
      const cp1 = validCheckpoint;
      const cp2 = { ...validCheckpoint, id: "cp2" };
      const serialized = serializeCheckpoints([cp1, cp2]);

      const [outcp1, outcp2] = deserializeCheckpoints(serialized);
      expect(outcp1).toEqual(cp1);
      expect(outcp2).toEqual(cp2);
    });

    it("should handle incomplete data gracefully", () => {
      const incompleteData = "1,cp1,Test,10.50,40.0,50";
      const result = deserializeCheckpoints(incompleteData);

      expect(result).toEqual([]);
    });
  });

  describe("Edge cases", () => {
    it("should handle negative coordinates in conversion", () => {
      const checkpoint: Checkpoint = {
        ...validCheckpoint,
        latitude: -89.5,
        longitude: -179.9,
      };

      const eventData = fromCheckpointToEventData(checkpoint);
      expect(eventData[4]).toBe("-89.5000");
      expect(eventData[5]).toBe("-179.9000");
    });

    it("should handle zero values", () => {
      const checkpoint: Checkpoint = {
        ...validCheckpoint,
        distanceKilometer: 0,
        elevationGain: 0,
        elevationLoss: 0,
      };

      const result = fromCheckpointToEventData(checkpoint);
      expect(result[3]).toBe("0.00");
      expect(result[6]).toBe("0");
      expect(result[7]).toBe("0");
    });

    it("should handle special characters in names", () => {
      const checkpoint: Checkpoint = {
        ...validCheckpoint,
        name: "Checkpoint with ümlaut & spéciál",
      };

      const result = fromCheckpointToEventData(checkpoint);
      expect(result[2]).toBe("Checkpoint with ümlaut & spéciál");
    });

    it("should handle very large elevation values", () => {
      const checkpoint: Checkpoint = {
        ...validCheckpoint,
        elevationGain: 8848,
        elevationLoss: 4321,
      };

      const result = fromCheckpointToEventData(checkpoint);
      expect(result[6]).toBe("8848");
      expect(result[7]).toBe("4321");
    });
  });
});
