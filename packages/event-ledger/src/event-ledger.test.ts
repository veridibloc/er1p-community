import { expect, describe, it, beforeEach } from "bun:test";
import { EventLedger } from "./event-ledger";
import { LedgerEventRegistry } from "./events/ledger-event-registry";
import { AttachmentMessage } from "@signumjs/core";

// Mock the Ledger since we're only testing the calculateFee method
const mockLedger = {} as any;

describe("EventLedger", () => {
  let eventLedger: EventLedger;
  let eventRegistry: LedgerEventRegistry;

  beforeEach(() => {
    eventRegistry = LedgerEventRegistry.getInstance();
    eventLedger = new EventLedger(mockLedger, eventRegistry);
  });
  describe("EventLedger calculateFee", () => {
    let eventLedger: EventLedger;

    beforeEach(() => {
      const mockLedger = {} as any;
      const eventRegistry = LedgerEventRegistry.getInstance();
      eventLedger = new EventLedger(mockLedger, eventRegistry);
    });

    const testFee = (messageLength: number) => {
      const attachment = new AttachmentMessage({
        message: "x".repeat(messageLength),
        messageIsText: true,
      });
      return (eventLedger as any).calculateFee(attachment);
    };

    describe("boundary conditions", () => {
      it("should return 0.01 SIGNA for minimum size (empty message)", () => {
        expect(testFee(0).getSigna()).toBe("0.01");
      });

      it("should return 0.01 SIGNA for very small message (1 byte)", () => {
        expect(testFee(1).getSigna()).toBe("0.01");
      });

      it("should return 0.06 SIGNA for maximum size", () => {
        expect(testFee(810).getSigna()).toBe("0.06"); // 810 + 190 = 1000 total
      });

      it("should return 0.06 SIGNA for message at exact MaxSize boundary", () => {
        expect(testFee(1000).getSigna()).toBe("0.06");
      });

      it("should throw error for message exactly 1 byte over MaxSize", () => {
        expect(() => testFee(1001)).toThrow(
          "Message size is too big - Got: 1001b Max is 1000b",
        );
      });

      it("should throw error with correct message for oversized messages", () => {
        expect(() => testFee(2000)).toThrow(
          "Message size is too big - Got: 2000b Max is 1000b",
        );
      });
    });

    describe("fee calculation", () => {
      it("should return 0.035 SIGNA for middle size", () => {
        const fee = testFee(405); // 405 + 190 = 595 total (middle of 190-1000 range)
        expect(parseFloat(fee.getSigna())).toBeCloseTo(0.035, 3);
      });

      it("should calculate fee correctly for quarter range", () => {
        // 190 + 202.5 = 392.5 (quarter of range from 190 to 1000)
        const fee = testFee(203);
        const expectedFee = 0.01 + 0.25 * (0.06 - 0.01); // 0.01 + 0.0125 = 0.0225
        // Rounding to 3 decimals may cause slight differences
        expect(parseFloat(fee.getSigna())).toBeCloseTo(expectedFee, 2);
      });

      it("should calculate fee correctly for three-quarter range", () => {
        // 190 + 607.5 = 797.5 (three-quarters of range from 190 to 1000)
        const fee = testFee(608);
        const expectedFee = 0.01 + 0.75 * (0.06 - 0.01); // 0.01 + 0.0375 = 0.0475
        // Rounding to 3 decimals may cause slight differences
        expect(parseFloat(fee.getSigna())).toBeCloseTo(expectedFee, 2);
      });

      it("should round fees to 3 decimal places", () => {
        const fee = testFee(100);
        const feeString = fee.getSigna();
        const decimalPart = feeString.split(".")[1];
        expect(decimalPart?.length).toBeLessThanOrEqual(3);
      });
    });

    describe("fee progression", () => {
      it("should have increasing fees for increasing sizes", () => {
        const small = parseFloat(testFee(100).getSigna());
        const medium = parseFloat(testFee(400).getSigna());
        const large = parseFloat(testFee(700).getSigna());

        expect(small).toBeLessThan(medium);
        expect(medium).toBeLessThan(large);
      });

      it("should never return a fee below MinFee", () => {
        const fees = [0, 1, 10, 50, 100].map((size) =>
          parseFloat(testFee(size).getSigna()),
        );
        fees.forEach((fee) => {
          expect(fee).toBeGreaterThanOrEqual(0.01);
        });
      });

      it("should never return a fee above MaxFee", () => {
        const fees = [500, 700, 810, 900, 1000].map((size) =>
          parseFloat(testFee(size).getSigna()),
        );
        fees.forEach((fee) => {
          expect(fee).toBeLessThanOrEqual(0.06);
        });
      });

      it("should have linear progression between min and max", () => {
        const size1 = 100;
        const size2 = 200;
        const size3 = 300;

        const fee1 = parseFloat(testFee(size1).getSigna());
        const fee2 = parseFloat(testFee(size2).getSigna());
        const fee3 = parseFloat(testFee(size3).getSigna());

        const diff1 = fee2 - fee1;
        const diff2 = fee3 - fee2;

        // Differences should be approximately equal (linear progression)
        // Allow for rounding effects
        expect(Math.abs(diff1 - diff2)).toBeLessThan(0.002);
      });
    });

    describe("clamping behavior", () => {
      it("should clamp totalSize to MinSize when below minimum", () => {
        // Even though this shouldn't happen with TxOverhead=190 and MinSize=190,
        // the code has clamping logic
        const fee0 = testFee(0);
        const fee1 = testFee(1);
        // Since totalSize is always >= 190 (TxOverhead), both should give MinFee
        expect(fee0.getSigna()).toBe(fee1.getSigna());
      });

      it("should clamp totalSize to MaxSize when message + overhead exceeds max", () => {
        // When messageSize=1000, totalSize=1190, which should be clamped to 1000
        const fee = testFee(1000);
        expect(fee.getSigna()).toBe("0.06");
      });
    });
  });
});
