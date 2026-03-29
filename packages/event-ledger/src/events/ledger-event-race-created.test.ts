import {expect, describe, it, beforeEach} from "bun:test";
import {RaceCreatedEvent} from "./ledger-event-race-created";
import {LedgerEventRegistry} from "./ledger-event-registry";
import {src44} from "@signumjs/standards";
import type {Transaction} from "@signumjs/core";
import {EventName} from "../event-name";
import {deserializeCheckpoints} from "./checkpoints-helpers.ts";
import type {Checkpoint} from "../race.types.ts";
import type {SignKeys} from "@signumjs/crypto";

function makeCheckpoint(overrides: Partial<Checkpoint> = {}): Checkpoint {
    return {
        id: "cp1",
        name: "Checkpoint 1",
        latitude: 40.72,
        longitude: -74.01,
        distanceKilometer: 5.0,
        elevationGain: 100,
        elevationLoss: 50,
        elevation: 25,
        cutoffTimeInMinutes: 120,
        type: "split",
        ...overrides,
    };
}

function makeManyCheckpoints(count: number): Checkpoint[] {
    return Array.from({length: count}, (_, i) =>
        makeCheckpoint({
            id: `cp${i}`,
            name: `Checkpoint ${i}`,
            latitude: 40.0 + i * 0.01,
            longitude: -74.0 + i * 0.01,
            distanceKilometer: i * 5,
            elevationGain: i * 100,
            elevationLoss: i * 50,
            elevation: 100 + i * 10,
            cutoffTimeInMinutes: i * 60,
        }),
    );
}

// Minimal context/ledger for tests that don't trigger overflow
const dummyContext = {
    ledger: {} as any,
    senderKeys: {signPrivateKey: "key", publicKey: "pub", agreementPrivateKey: "key"} as SignKeys,
    recipientPublicKey: "pub",
    recipientId: "12345678901234567890",
};
const dummyLedger = {} as any;

describe("RaceCreatedEvent", () => {
    let validRacePayload: any;
    let mockTransaction: Transaction;

    beforeEach(() => {
        validRacePayload = {
            id: "12345678901234567890",
            name: "Test Marathon",
            description: "A test marathon race",
            directorId: "98765432109876543210",
            maxParticipants: 100,
            latitude: 40.7128,
            longitude: -74.006,
            checkpoints: [
                makeCheckpoint({id: "cp1", name: "Checkpoint 1"}),
                makeCheckpoint({
                    id: "cp2",
                    name: "Checkpoint 2",
                    latitude: 40.73,
                    longitude: -74.02,
                    distanceKilometer: 10.0,
                    elevationGain: 200,
                    elevationLoss: 100,
                    elevation: 35,
                    cutoffTimeInMinutes: 90,
                }),
            ],
            dateTime: new Date("2024-12-25T09:00:00Z"),
            durationMinutes: 180,
            lengthKilometer: 42.195,
            bannerLogoUrl: "https://example.com/banner.jpg",
            imageLogoUrl: "https://example.com/logo.jpg",
        };

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
            expect(event.validate()).toEqual([]);
        });

        it("should return errors for invalid account id", () => {
            const event = new RaceCreatedEvent({...validRacePayload, id: "invalid"});
            const errors = event.validate();
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some((e) => e.includes("Invalid account id"))).toBe(true);
        });

        it("should return errors for empty name", () => {
            expect(new RaceCreatedEvent({...validRacePayload, name: ""}).validate().length).toBeGreaterThan(0);
        });

        it("should return errors for empty description", () => {
            expect(new RaceCreatedEvent({...validRacePayload, description: ""}).validate().length).toBeGreaterThan(0);
        });

        it("should return errors for invalid maxParticipants", () => {
            expect(new RaceCreatedEvent({...validRacePayload, maxParticipants: 0}).validate().length).toBeGreaterThan(0);
        });

        it("should return errors for invalid latitude", () => {
            expect(new RaceCreatedEvent({...validRacePayload, latitude: 91}).validate().length).toBeGreaterThan(0);
        });

        it("should return errors for invalid longitude", () => {
            expect(new RaceCreatedEvent({...validRacePayload, longitude: -181}).validate().length).toBeGreaterThan(0);
        });

        it("should return errors for invalid checkpoint data", () => {
            const event = new RaceCreatedEvent({
                ...validRacePayload,
                checkpoints: [{id: "", name: "Checkpoint 1", latitude: 40.72, longitude: -74.01, distanceKilometer: 5.0}],
            });
            expect(event.validate().length).toBeGreaterThan(0);
        });

        it("should return errors for invalid URLs", () => {
            const event = new RaceCreatedEvent({...validRacePayload, bannerLogoUrl: "not-a-url", imageLogoUrl: "also-not-a-url"});
            expect(event.validate().length).toBeGreaterThan(0);
        });

        it("should return errors for negative duration", () => {
            expect(new RaceCreatedEvent({...validRacePayload, durationMinutes: -10}).validate().length).toBeGreaterThan(0);
        });

        it("should return errors for negative length", () => {
            expect(new RaceCreatedEvent({...validRacePayload, lengthKilometer: -5}).validate().length).toBeGreaterThan(0);
        });
    });

    describe("descriptor()", () => {
        it("should generate correct descriptor data", async () => {
            const event = new RaceCreatedEvent(validRacePayload);
            const descriptor = await event.descriptor(dummyContext);

            expect(descriptor.name).toBe("race_created@1");
            expect(descriptor.description).toBe(validRacePayload.description);
            expect(descriptor.type).toBe("biz");
            expect(descriptor.getCustomField("xrd")).toBe(validRacePayload.directorId);
            expect(descriptor.getCustomField("xrn")).toBe(validRacePayload.name);
            expect(descriptor.getCustomField("xmx")).toBe(validRacePayload.maxParticipants.toString());
            expect(descriptor.getCustomField("xlt")).toBe(validRacePayload.latitude.toString());
            expect(descriptor.getCustomField("xlg")).toBe(validRacePayload.longitude.toString());
            expect(descriptor.getCustomField("xdt")).toBe(validRacePayload.dateTime.getTime().toString());
            expect(descriptor.getCustomField("xdu")).toBe(validRacePayload.durationMinutes.toString());
            expect(descriptor.getCustomField("xs")).toBe(validRacePayload.lengthKilometer.toString());
            expect(descriptor.getCustomField("xbg")).toBe(validRacePayload.bannerLogoUrl);
            expect(descriptor.getCustomField("xmg")).toBe(validRacePayload.imageLogoUrl);
        });

        it("should include correctly formatted checkpoints", async () => {
            const event = new RaceCreatedEvent(validRacePayload);
            const descriptor = await event.descriptor(dummyContext);
            const checkpoints = deserializeCheckpoints(descriptor.getCustomField("xcp") as string);
            expect(checkpoints).toHaveLength(2);
        });

        it("should send overflow txs and return ref when context is provided", async () => {
            const payload = {...validRacePayload, checkpoints: makeManyCheckpoints(14)};
            const event = new RaceCreatedEvent(payload);

            const sentMessages: string[] = [];
            let txCounter = 0;

            const mockLedger = {
                message: {
                    sendMessage: async (args: any) => {
                        sentMessages.push(args.message);
                        txCounter++;
                        return {transaction: `tx${txCounter}`};
                    },
                },
            };

            const context = {
                ledger: mockLedger as any,
                senderKeys: {signPrivateKey: "key", publicKey: "pub", agreementPrivateKey: "key"} as SignKeys,
                recipientPublicKey: "pub",
                recipientId: "12345678901234567890",
            };

            const descriptor = await event.descriptor(context);

            const xcp = descriptor.getCustomField("xcp") as string;
            expect(xcp.startsWith("ref:")).toBe(true);
            expect(sentMessages.length).toBeGreaterThan(0);

            // Each overflow message should be valid SRC44
            for (const msg of sentMessages) {
                const parsed = src44.DescriptorData.parse(msg);
                expect(parsed.name).toBe("checkpoint_data@1");
                expect(parsed.getCustomField("xcp")).toBeTruthy();
                expect(parsed.getCustomField("xord")).toBeTruthy();
            }
        });

        it("should chain overflow txs — ref points to last-sent (first chunk)", async () => {
            const payload = {...validRacePayload, checkpoints: makeManyCheckpoints(14)};
            const event = new RaceCreatedEvent(payload);

            let txCounter = 0;
            const mockLedger = {
                message: {
                    sendMessage: async () => {
                        txCounter++;
                        return {transaction: `tx${txCounter}`};
                    },
                },
            };

            const context = {
                ledger: mockLedger as any,
                senderKeys: {signPrivateKey: "key", publicKey: "pub", agreementPrivateKey: "key"} as SignKeys,
                recipientPublicKey: "pub",
                recipientId: "12345678901234567890",
            };

            const descriptor = await event.descriptor(context);
            const xcp = descriptor.getCustomField("xcp") as string;
            expect(xcp).toBe(`ref:tx${txCounter}`);
        });
    });

    describe("fromTransaction()", () => {
        let mockDescriptor: src44.DescriptorData;

        beforeEach(() => {
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
                        xcp: "1,cp1,Checkpoint 1,5.0,40.72,-74.01,100,50,25,120,s",
                        xdt: "1703505600000",
                        xdu: "180",
                        xs: "42.195",
                        xbg: "https://example.com/banner.jpg",
                        xmg: "https://example.com/logo.jpg",
                    };
                    return fields[field];
                },
            } as src44.DescriptorData;
        });

        it("should create RaceCreatedEvent from transaction and descriptor", async () => {
            const event = await RaceCreatedEvent.fromTransaction(
                {...mockTransaction, recipient: "12345678901234567890"},
                mockDescriptor,
                dummyLedger,
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
            expect(event.payload.bannerLogoUrl).toBe("https://example.com/banner.jpg");
            expect(event.payload.imageLogoUrl).toBe("https://example.com/logo.jpg");
        });

        it("should handle missing custom fields with default values", async () => {
            const emptyDescriptor = src44.DescriptorDataBuilder.create("race_created@1")
                .setAccount("12345678901234567890")
                .setDescription("A test race")
                .build();

            const event = await RaceCreatedEvent.fromTransaction(mockTransaction, emptyDescriptor, dummyLedger);
            expect(event.payload.directorId).toBe("");
            expect(event.payload.maxParticipants).toBe(0);
            expect(event.payload.latitude).toBe(0);
            expect(event.payload.longitude).toBe(0);
        });

        it("should parse date correctly from timestamp", async () => {
            const event = await RaceCreatedEvent.fromTransaction(mockTransaction, mockDescriptor, dummyLedger);
            expect(event.payload.dateTime.getTime()).toBe(new Date(1703505600000).getTime());
        });

        it("should handle checkpoints array", async () => {
            const event = await RaceCreatedEvent.fromTransaction(mockTransaction, mockDescriptor, dummyLedger);
            expect(event.payload.checkpoints).toHaveLength(1);
            expect(event.payload.checkpoints[0]).toEqual({
                name: "Checkpoint 1", id: "cp1", distanceKilometer: 5.0,
                latitude: 40.72, longitude: -74.01, elevation: 25,
                elevationGain: 100, elevationLoss: 50, cutoffTimeInMinutes: 120, type: "split",
            });
        });

        it("should resolve overflow chain when ledger is provided", async () => {
            const overflowDescriptor = {
                ...mockDescriptor,
                getCustomField: (field: string) => {
                    if (field === "xcp") return "ref:txA";
                    return mockDescriptor.getCustomField(field);
                },
            } as src44.DescriptorData;

            const cp1Data = "1,cp1,Start,0.00,40.0000,-74.0000,0,0,100,0,s";
            const cp2Data = "1,cp2,End,10.00,41.0000,-73.0000,200,50,300,120,s";

            const overflowTxA = src44.DescriptorDataBuilder.create("checkpoint_data@1")
                .setType("biz")
                .setCustomField("xord", "1")
                .setCustomField("xcp", cp1Data)
                .setCustomField("xntx", "txB")
                .build()
                .stringify();

            const overflowTxB = src44.DescriptorDataBuilder.create("checkpoint_data@1")
                .setType("biz")
                .setCustomField("xord", "2")
                .setCustomField("xcp", cp2Data)
                .build()
                .stringify();

            const mockLedger = {
                transaction: {
                    getTransaction: async (txId: string) => {
                        if (txId === "txA") return {attachment: {message: overflowTxA}};
                        if (txId === "txB") return {attachment: {message: overflowTxB}};
                        throw new Error(`Unknown tx: ${txId}`);
                    },
                },
            };

            const event = await RaceCreatedEvent.fromTransaction(
                mockTransaction,
                overflowDescriptor,
                mockLedger as any,
            );

            expect(event.payload.checkpoints).toHaveLength(2);
            expect(event.payload.checkpoints[0]!.id).toBe("cp1");
            expect(event.payload.checkpoints[0]!.name).toBe("Start");
            expect(event.payload.checkpoints[1]!.id).toBe("cp2");
            expect(event.payload.checkpoints[1]!.latitude).toBe(41.0);
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
        it("should handle empty checkpoints array", async () => {
            const event = new RaceCreatedEvent({...validRacePayload, checkpoints: []});
            const descriptor = await event.descriptor(dummyContext);
            expect(descriptor.getCustomField("xcp")).toEqual("");
        });

        it("should handle very long account IDs", () => {
            const event = new RaceCreatedEvent({...validRacePayload, id: "123456789012345678901234567890"});
            expect(event.validate().length).toBeGreaterThan(0);
        });

        it("should handle minimum valid values", () => {
            const minPayload = {
                ...validRacePayload,
                maxParticipants: 1, latitude: -90, longitude: -180,
                durationMinutes: 0.1, lengthKilometer: 0.1,
                checkpoints: [{
                    id: "cp1", name: "CP1", latitude: -90, longitude: -180,
                    distanceKilometer: 0.1, elevationGain: 0.1, elevationLoss: 0.1, type: "split",
                }],
            };
            expect(new RaceCreatedEvent(minPayload).validate()).toEqual([]);
        });

        it("should handle maximum valid values", () => {
            const maxPayload = {
                ...validRacePayload,
                latitude: 90, longitude: 180,
                checkpoints: [{
                    id: "cp1", name: "Checkpoint 1", latitude: 90, longitude: 180,
                    distanceKilometer: 1000, elevationGain: 10000, elevationLoss: 10000, type: "split",
                } as Checkpoint],
            };
            expect(new RaceCreatedEvent(maxPayload).validate()).toEqual([]);
        });
    });
});
