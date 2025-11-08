import { expect, describe, it, beforeEach } from "bun:test";
import { RaceCreatedEvent } from "./ledger-event-race-created";
import { LedgerEventRegistry } from "./ledger-event-registry";
import { src44 } from "@signumjs/standards";
import type { Transaction } from "@signumjs/core";
import { EventName } from "../event-name";
import type { Checkpoint } from "@er1p/types";
import { deserializeCheckpoints } from "./checkpoints-helpers.ts";

describe("RaceCreatedEvent", () => {
  let validRacePayload: any;
  let mockTransaction: Transaction;

  beforeEach(() => {
    // Valid race payload for testing
    validRacePayload = {
      id: "12345678901234567890",
      name: "Test Marathon",
      description: "A test marathon race",
      directorId: "98765432109876543210",
      maxParticipants: 100,
      latitude: 40.7128,
      longitude: -74.006,
      checkpoints: [
        {
          id: "cp1",
          name: "Checkpoint 1",
          latitude: 40.72,
          longitude: -74.01,
          distanceKilometer: 5.0,
          elevationGain: 100,
          elevationLoss: 50,
          type: "split",
        } as Checkpoint,
        {
          id: "cp2",
          name: "Checkpoint 2",
          latitude: 40.73,
          longitude: -74.02,
          distanceKilometer: 10.0,
          elevationGain: 200,
          elevationLoss: 100,
          type: "split",
        } as Checkpoint,
      ],
      dateTime: new Date("2024-12-25T09:00:00Z"),
      durationMinutes: 180,
      lengthKilometer: 42.195,
      bannerLogoUrl: "https://example.com/banner.jpg",
      imageLogoUrl: "https://example.com/logo.jpg",
    };

    // Mock transaction for testing fromTransaction method
    mockTransaction = {
      attachment: {
        message: "mock message",
        messageIsText: true,
      },
    } as Transaction;
  });

  describe("Constructor", () => {
    it("should create a RaceCreatedEvent with correct properties", () => {
      const event = new RaceCreatedEvent(validRacePayload);

      expect(event.name).toBe("race_created");
      expect(event.version).toBe(1);
      expect(event.payload).toBe(validRacePayload);
      expect(event.tx).toBeUndefined();
    });

    it("should create a RaceCreatedEvent with transaction", () => {
      const event = new RaceCreatedEvent(validRacePayload, mockTransaction);

      expect(event.name).toBe("race_created");
      expect(event.version).toBe(1);
      expect(event.payload).toBe(validRacePayload);
      expect(event.tx).toBe(mockTransaction);
    });
  });

  describe("Static properties", () => {
    it("should have correct static Name property", () => {
      expect(RaceCreatedEvent.Name).toBe("race_created");
    });

    it("should have correct static Version property", () => {
      expect(RaceCreatedEvent.Version).toBe(1);
    });
  });

  describe("validate()", () => {
    it("should return empty array for valid payload", () => {
      const event = new RaceCreatedEvent(validRacePayload);
      const errors = event.validate();

      expect(errors).toEqual([]);
    });

    it("should return errors for invalid account id", () => {
      const invalidPayload = { ...validRacePayload, id: "invalid" };
      const event = new RaceCreatedEvent(invalidPayload);
      const errors = event.validate();

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((error) => error.includes("Invalid account id"))).toBe(
        true,
      );
    });

    it("should return errors for empty name", () => {
      const invalidPayload = { ...validRacePayload, name: "" };
      const event = new RaceCreatedEvent(invalidPayload);
      const errors = event.validate();

      expect(errors.length).toBeGreaterThan(0);
    });

    it("should return errors for empty description", () => {
      const invalidPayload = { ...validRacePayload, description: "" };
      const event = new RaceCreatedEvent(invalidPayload);
      const errors = event.validate();

      expect(errors.length).toBeGreaterThan(0);
    });

    it("should return errors for invalid maxParticipants", () => {
      const invalidPayload = { ...validRacePayload, maxParticipants: 0 };
      const event = new RaceCreatedEvent(invalidPayload);
      const errors = event.validate();

      expect(errors.length).toBeGreaterThan(0);
    });

    it("should return errors for invalid latitude", () => {
      const invalidPayload = { ...validRacePayload, latitude: 91 };
      const event = new RaceCreatedEvent(invalidPayload);
      const errors = event.validate();

      expect(errors.length).toBeGreaterThan(0);
    });

    it("should return errors for invalid longitude", () => {
      const invalidPayload = { ...validRacePayload, longitude: -181 };
      const event = new RaceCreatedEvent(invalidPayload);
      const errors = event.validate();

      expect(errors.length).toBeGreaterThan(0);
    });

    it("should return errors for invalid checkpoint data", () => {
      const invalidPayload = {
        ...validRacePayload,
        checkpoints: [
          {
            id: "",
            name: "Checkpoint 1",
            latitude: 40.72,
            longitude: -74.01,
            distanceKilometer: 5.0,
          },
        ],
      };
      const event = new RaceCreatedEvent(invalidPayload);
      const errors = event.validate();

      expect(errors.length).toBeGreaterThan(0);
    });

    it("should return errors for invalid URLs", () => {
      const invalidPayload = {
        ...validRacePayload,
        bannerLogoUrl: "not-a-url",
        imageLogoUrl: "also-not-a-url",
      };
      const event = new RaceCreatedEvent(invalidPayload);
      const errors = event.validate();

      expect(errors.length).toBeGreaterThan(0);
    });

    it("should return errors for negative duration", () => {
      const invalidPayload = { ...validRacePayload, durationMinutes: -10 };
      const event = new RaceCreatedEvent(invalidPayload);
      const errors = event.validate();

      expect(errors.length).toBeGreaterThan(0);
    });

    it("should return errors for negative length", () => {
      const invalidPayload = { ...validRacePayload, lengthKilometer: -5 };
      const event = new RaceCreatedEvent(invalidPayload);
      const errors = event.validate();

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe("descriptor()", () => {
    it("should generate correct descriptor data", () => {
      const event = new RaceCreatedEvent(validRacePayload);
      const descriptor = event.descriptor();

      expect(descriptor.name).toBe("race_created@1");
      expect(descriptor.description).toBe(validRacePayload.description);
      expect(descriptor.type).toBe("biz");
      expect(descriptor.getCustomField("xrd")).toBe(
        validRacePayload.directorId,
      );
      expect(descriptor.getCustomField("xrn")).toBe(validRacePayload.name);
      expect(descriptor.getCustomField("xmx")).toBe(
        validRacePayload.maxParticipants.toString(),
      );
      expect(descriptor.getCustomField("xlt")).toBe(
        validRacePayload.latitude.toString(),
      );
      expect(descriptor.getCustomField("xlg")).toBe(
        validRacePayload.longitude.toString(),
      );
      expect(descriptor.getCustomField("xdt")).toBe(
        validRacePayload.dateTime.getTime().toString(),
      );
      expect(descriptor.getCustomField("xdu")).toBe(
        validRacePayload.durationMinutes.toString(),
      );
      expect(descriptor.getCustomField("xs")).toBe(
        validRacePayload.lengthKilometer.toString(),
      );
      expect(descriptor.getCustomField("xbg")).toBe(
        validRacePayload.bannerLogoUrl,
      );
      expect(descriptor.getCustomField("xmg")).toBe(
        validRacePayload.imageLogoUrl,
      );
    });

    it("should include correctly formatted checkpoints", () => {
      const event = new RaceCreatedEvent(validRacePayload);
      const descriptor = event.descriptor();
      const checkpoints = deserializeCheckpoints(
        descriptor.getCustomField("xcp") as string,
      );
      expect(checkpoints).toHaveLength(2);
    });
  });

  describe("fromTransaction()", () => {
    let mockDescriptor: src44.DescriptorData;

    beforeEach(() => {
      // Create a mock descriptor with all the custom fields
      mockDescriptor = {
        account: "12345678901234567890",
        name: "race_created",
        description: "A test marathon race",
        getCustomField: (field: string) => {
          const fields: Record<string, any> = {
            xrd: "98765432109876543210",
            xrn: "Test Marathon",
            xmx: "100",
            xlt: "40.7128",
            xlg: "-74.0060",
            xcp: "1,cp1,Checkpoint 1,5.0,40.72,-74.01,100,50,s",
            xdt: "1703505600000", // 2023-12-25T09:00:00Z timestamp
            xdu: "180",
            xs: "42.195",
            xbg: "https://example.com/banner.jpg",
            xmg: "https://example.com/logo.jpg",
          };
          return fields[field];
        },
      } as src44.DescriptorData;
    });

    it("should create RaceCreatedEvent from transaction and descriptor", () => {
      const event = RaceCreatedEvent.fromTransaction(
        { ...mockTransaction, recipient: "12345678901234567890" },
        mockDescriptor,
      );

      expect(event).toBeInstanceOf(RaceCreatedEvent);
      expect(event.payload.id).toBe("12345678901234567890");
      expect(event.payload.name).toBe("Test Marathon");
      expect(event.payload.description).toBe("A test marathon race");
      expect(event.payload.directorId).toBe("98765432109876543210");
      expect(event.payload.maxParticipants).toBe(100);
      expect(event.payload.latitude).toBe(40.7128);
      expect(event.payload.longitude).toBe(-74.006);
      expect(event.payload.durationMinutes).toBe(180);
      expect(event.payload.lengthKilometer).toBe(42.195);
      expect(event.payload.bannerLogoUrl).toBe(
        "https://example.com/banner.jpg",
      );
      expect(event.payload.imageLogoUrl).toBe("https://example.com/logo.jpg");
      expect(event.tx).toEqual({
        ...mockTransaction,
        recipient: "12345678901234567890",
      });
    });

    it("should handle missing custom fields with default values", () => {
      const emptyDescriptor = src44.DescriptorDataBuilder.create(
        "race_created@1",
      )
        .setAccount("12345678901234567890")
        .setDescription("A test race")
        .build();

      const event = RaceCreatedEvent.fromTransaction(
        mockTransaction,
        emptyDescriptor,
      );
      expect(event.payload.directorId).toBe("");
      expect(event.payload.maxParticipants).toBe(0);
      expect(event.payload.latitude).toBe(0);
      expect(event.payload.longitude).toBe(0);
      expect(event.payload.durationMinutes).toBe(0);
      expect(event.payload.lengthKilometer).toBe(0);
      expect(event.payload.bannerLogoUrl).toBe("");
      expect(event.payload.imageLogoUrl).toBe("");
    });

    it("should parse date correctly from timestamp", () => {
      const event = RaceCreatedEvent.fromTransaction(
        mockTransaction,
        mockDescriptor,
      );
      const expectedDate = new Date(1703505600000);

      expect(event.payload.dateTime.getTime()).toBe(expectedDate.getTime());
    });

    it("should handle checkpoints array", () => {
      const event = RaceCreatedEvent.fromTransaction(
        mockTransaction,
        mockDescriptor,
      );

      expect(event.payload.checkpoints).toHaveLength(1);
      expect(event.payload.checkpoints[0]).toEqual({
        name: "Checkpoint 1",
        id: "cp1",
        distanceKilometer: 5.0,
        latitude: 40.72,
        longitude: -74.01,
        elevationGain: 100,
        elevationLoss: 50,
        type: "split",
      });
    });
  });

  describe("Integration with LedgerEventRegistry", () => {
    it("should be registered in the LedgerEventRegistry", () => {
      const registry = LedgerEventRegistry.getInstance();
      const EventClass = registry.get(new EventName("race_created", 1));

      expect(EventClass).toBe(RaceCreatedEvent);
    });
  });

  describe("Edge cases", () => {
    it("should handle empty checkpoints array", () => {
      const payloadWithoutCheckpoints = {
        ...validRacePayload,
        checkpoints: [],
      };
      const event = new RaceCreatedEvent(payloadWithoutCheckpoints);
      const descriptor = event.descriptor();

      expect(descriptor.getCustomField("xcp")).toEqual("");
    });

    it("should handle very long account IDs", () => {
      const longId = "123456789012345678901234567890"; // 30 digits
      const payloadWithLongId = { ...validRacePayload, id: longId };
      const event = new RaceCreatedEvent(payloadWithLongId);

      // Should not throw during validation since the regex allows 15-24 digits
      // This should actually fail validation
      const errors = event.validate();
      expect(errors.length).toBeGreaterThan(0);
    });

    it("should handle minimum valid values", () => {
      const minValidPayload = {
        ...validRacePayload,
        maxParticipants: 1,
        latitude: -90,
        longitude: -180,
        durationMinutes: 0.1,
        lengthKilometer: 0.1,
        checkpoints: [
          {
            id: "cp1",
            name: "CP1",
            latitude: -90,
            longitude: -180,
            distanceKilometer: 0.1,
            elevationGain: 0.1,
            elevationLoss: 0.1,
            type: "split",
          },
        ],
      };

      const event = new RaceCreatedEvent(minValidPayload);
      const errors = event.validate();

      expect(errors).toEqual([]);
    });

    it("should handle maximum valid values", () => {
      const maxValidPayload = {
        ...validRacePayload,
        latitude: 90,
        longitude: 180,
        checkpoints: [
          {
            id: "cp1",
            name: "Checkpoint 1",
            latitude: 90,
            longitude: 180,
            distanceKilometer: 1000,
            elevationGain: 10000,
            elevationLoss: 10000,
            type: "split",
          } as Checkpoint,
        ],
      };

      const event = new RaceCreatedEvent(maxValidPayload);
      const errors = event.validate();

      expect(errors).toEqual([]);
    });
  });
});
