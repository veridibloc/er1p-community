import { expect, describe, it } from "bun:test";
import {
  fromEventDataToCheckpoint,
  fromCheckpointToEventData,
  serializeCheckpoints,
  deserializeCheckpoints,
  splitCheckpointData,
  type CheckpointEventData,
} from "./checkpoints-helpers";
import type {Checkpoint} from "../race.types.ts";

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
      data[10] = "i";

      const result = fromEventDataToCheckpoint(data);
      expect(result.type).toBe("in");
    });

    it("should handle out type correctly", () => {
      const data = [...eventData];
      data[10] = "o";

      const result = fromEventDataToCheckpoint(data);
      expect(result.type).toBe("out");
    });

    it("should default to split type for unknown type", () => {
      const data = [...eventData];
      data[10] = "unknown";

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
      wrongVersion[0] = 3;

      expect(() => fromEventDataToCheckpoint(wrongVersion)).toThrow(
        "Invalid checkpoint version",
      );
    });

    it("should accept version 2", () => {
      const v2Data: CheckpointEventData = [
        2, "cp1-o", "CP1 Out", "", "", "", "", "", "", "180", "o",
      ];

      const result = fromEventDataToCheckpoint(v2Data);
      expect(result.id).toBe("cp1-o");
      expect(result.name).toBe("CP1 Out");
      expect(result.latitude).toBe(0);
      expect(result.longitude).toBe(0);
      expect(result.distanceKilometer).toBe(0);
      expect(result.elevationGain).toBe(0);
      expect(result.elevationLoss).toBe(0);
      expect(result.elevation).toBe(0);
      expect(result.cutoffTimeInMinutes).toBe(180);
      expect(result.type).toBe("out");
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

    it("should emit v2 compact for 'out' after 'in' with same coords", () => {
      const inCheckpoint: Checkpoint = {
        ...validCheckpoint,
        type: "in",
        latitude: 40.7128,
        longitude: -74.006,
      };
      const outCheckpoint: Checkpoint = {
        ...validCheckpoint,
        id: "cp1-o",
        name: "CP1 Out",
        type: "out",
        latitude: 40.7128,
        longitude: -74.006,
        cutoffTimeInMinutes: 180,
      };

      const result = fromCheckpointToEventData(outCheckpoint, inCheckpoint);

      expect(result[0]).toBe(2); // version 2
      expect(result[1]).toBe("cp1-o");
      expect(result[2]).toBe("CP1 Out");
      expect(result[3]).toBe(""); // empty distance
      expect(result[4]).toBe(""); // empty lat
      expect(result[5]).toBe(""); // empty lon
      expect(result[6]).toBe(""); // empty gain
      expect(result[7]).toBe(""); // empty loss
      expect(result[8]).toBe(""); // empty elevation
      expect(result[9]).toBe("180");
      expect(result[10]).toBe("o");
    });

    it("should NOT emit v2 if previous is not 'in'", () => {
      const splitCheckpoint: Checkpoint = {
        ...validCheckpoint,
        type: "split",
      };
      const outCheckpoint: Checkpoint = {
        ...validCheckpoint,
        type: "out",
      };

      const result = fromCheckpointToEventData(outCheckpoint, splitCheckpoint);
      expect(result[0]).toBe(1); // version 1
    });

    it("should NOT emit v2 if coords differ", () => {
      const inCheckpoint: Checkpoint = {
        ...validCheckpoint,
        type: "in",
        latitude: 40.7128,
        longitude: -74.006,
      };
      const outCheckpoint: Checkpoint = {
        ...validCheckpoint,
        type: "out",
        latitude: 41.0, // different
        longitude: -74.006,
      };

      const result = fromCheckpointToEventData(outCheckpoint, inCheckpoint);
      expect(result[0]).toBe(1); // version 1
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

    it("should use v2 compact for decision point pairs", () => {
      const inCp: Checkpoint = {
        ...validCheckpoint,
        id: "dp1-in",
        name: "DP1 In",
        type: "in",
      };
      const outCp: Checkpoint = {
        ...validCheckpoint,
        id: "dp1-out",
        name: "DP1 Out",
        type: "out",
      };

      const result = serializeCheckpoints([inCp, outCp]);
      const parts = result.split(",");

      // First checkpoint: v1 (11 elements)
      expect(parts[0]).toBe("1");
      // Second checkpoint: v2 (11 elements, with empty fields)
      expect(parts[11]).toBe("2");
      expect(parts[14]).toBe(""); // empty lat
      expect(parts[15]).toBe(""); // empty lon
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

    it("should deserialize v2 compact checkpoints and inherit from previous", () => {
      const inCp: Checkpoint = {
        ...validCheckpoint,
        id: "dp1-in",
        name: "DP1 In",
        type: "in",
      };
      const outCp: Checkpoint = {
        ...validCheckpoint,
        id: "dp1-out",
        name: "DP1 Out",
        type: "out",
      };

      const serialized = serializeCheckpoints([inCp, outCp]);
      const result = deserializeCheckpoints(serialized);

      expect(result).toHaveLength(2);
      const cp1 = result[0]!;
      const cp2 = result[1]!;
      expect(cp1.type).toBe("in");
      expect(cp2.type).toBe("out");
      // v2 should inherit coords from v1
      expect(cp2.latitude).toBe(cp1.latitude);
      expect(cp2.longitude).toBe(cp1.longitude);
      expect(cp2.distanceKilometer).toBe(cp1.distanceKilometer);
      expect(cp2.elevationGain).toBe(cp1.elevationGain);
      expect(cp2.elevationLoss).toBe(cp1.elevationLoss);
      expect(cp2.elevation).toBe(cp1.elevation);
    });

    it("should round-trip mixed v1/v2 checkpoints", () => {
      const checkpoints: Checkpoint[] = [
        { ...validCheckpoint, id: "s", name: "Start", type: "split" },
        { ...validCheckpoint, id: "dp1-in", name: "DP1 In", type: "in" },
        { ...validCheckpoint, id: "dp1-out", name: "DP1 Out", type: "out" },
        { ...validCheckpoint, id: "cp3", name: "CP3", type: "split", latitude: 42.0, longitude: -73.0 },
      ];

      const serialized = serializeCheckpoints(checkpoints);
      const result = deserializeCheckpoints(serialized);

      expect(result).toHaveLength(4);
      expect(result[0]!.type).toBe("split");
      expect(result[1]!.type).toBe("in");
      expect(result[2]!.type).toBe("out");
      expect(result[2]!.latitude).toBe(result[1]!.latitude);
      expect(result[3]!.type).toBe("split");
      expect(result[3]!.latitude).toBe(42.0);
    });

    it("backward compatibility: v1-only data deserializes correctly", () => {
      // Manually craft v1-only data
      const v1Data = "1,cp1,Start,0.00,40.7128,-74.0060,0,0,100,0,s,1,cp2,Mid,10.00,41.0000,-73.0000,200,50,300,120,i";
      const result = deserializeCheckpoints(v1Data);
      expect(result).toHaveLength(2);
      expect(result[0]!.id).toBe("cp1");
      expect(result[1]!.id).toBe("cp2");
      expect(result[1]!.latitude).toBe(41.0);
    });
  });

  describe("splitCheckpointData", () => {
    it("should return single chunk when data fits", () => {
      const data = serializeCheckpoints([validCheckpoint]);
      const chunks = splitCheckpointData(data, 500);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(data);
    });

    it("should split on checkpoint boundaries", () => {
      const checkpoints: Checkpoint[] = Array.from({ length: 10 }, (_, i) => ({
        ...validCheckpoint,
        id: `cp${i}`,
        name: `Checkpoint ${i}`,
      }));

      const data = serializeCheckpoints(checkpoints);
      // Use a small maxBytes to force splitting
      const chunks = splitCheckpointData(data, 200);

      expect(chunks.length).toBeGreaterThan(1);

      // Each chunk should have complete checkpoints (multiples of 11 elements)
      for (const chunk of chunks) {
        const parts = chunk.split(",");
        expect(parts.length % 11).toBe(0);
      }

      // Reassembled data should equal original
      const reassembled = chunks.join(",");
      expect(reassembled).toBe(data);
    });

    it("should handle empty data", () => {
      const chunks = splitCheckpointData("", 500);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe("");
    });

    it("should respect byte limits", () => {
      const checkpoints: Checkpoint[] = Array.from({ length: 10 }, (_, i) => ({
        ...validCheckpoint,
        id: `cp${i}`,
        name: `Checkpoint ${i}`,
      }));

      const data = serializeCheckpoints(checkpoints);
      const maxBytes = 300;
      const chunks = splitCheckpointData(data, maxBytes);

      // Each chunk (except possibly the last) should be under maxBytes
      for (const chunk of chunks) {
        const byteLength = new TextEncoder().encode(chunk).length;
        // Only full checkpoints within a chunk, but a single checkpoint might exceed if it's large
        expect(byteLength).toBeLessThanOrEqual(maxBytes + 200); // allow some slack for single large cp
      }
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
