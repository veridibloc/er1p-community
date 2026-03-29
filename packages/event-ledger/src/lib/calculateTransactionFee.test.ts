import { expect, describe, it } from "bun:test";
import { calculateTransactionFee } from "./calculateTransactionFee";

describe("calculateTransactionFee", () => {
  const AllowedFees = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];

  describe("boundary conditions", () => {
    it("should return 0.1 SIGNA for minimum size (empty message)", () => {
      expect(calculateTransactionFee(0).getSigna()).toBe("0.1");
    });

    it("should return 0.1 SIGNA for very small message (1 byte)", () => {
      expect(calculateTransactionFee(1).getSigna()).toBe("0.1");
    });

    it("should return 0.6 SIGNA for message at exact MaxSize boundary", () => {
      expect(calculateTransactionFee(1000).getSigna()).toBe("0.6");
    });

    it("should throw error for message exactly 1 byte over MaxSize", () => {
      expect(() => calculateTransactionFee(1001)).toThrow(
        "Message size is too big - Got: 1001b Max is 1000b",
      );
    });

    it("should throw error with correct message for oversized messages", () => {
      expect(() => calculateTransactionFee(2000)).toThrow(
        "Message size is too big - Got: 2000b Max is 1000b",
      );
    });
  });

  describe("fee progression", () => {
    it("should have non-decreasing fees for increasing sizes", () => {
      const small = parseFloat(calculateTransactionFee(100).getSigna());
      const medium = parseFloat(calculateTransactionFee(400).getSigna());
      const large = parseFloat(calculateTransactionFee(700).getSigna());

      expect(small).toBeLessThanOrEqual(medium);
      expect(medium).toBeLessThanOrEqual(large);
    });

    it("should only return allowed fee values", () => {
      const sizes = [0, 1, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
      sizes.forEach((size) => {
        const fee = parseFloat(calculateTransactionFee(size).getSigna());
        expect(AllowedFees).toContain(fee);
      });
    });

    it("should never return a fee below 0.1", () => {
      const fees = [0, 1, 10, 50, 100].map((size) =>
        parseFloat(calculateTransactionFee(size).getSigna()),
      );
      fees.forEach((fee) => {
        expect(fee).toBeGreaterThanOrEqual(0.1);
      });
    });

    it("should never return a fee above 0.6", () => {
      const fees = [500, 700, 810, 900, 1000].map((size) =>
        parseFloat(calculateTransactionFee(size).getSigna()),
      );
      fees.forEach((fee) => {
        expect(fee).toBeLessThanOrEqual(0.6);
      });
    });
  });

  describe("clamping behavior", () => {
    it("should return same fee for very small messages", () => {
      const fee0 = calculateTransactionFee(0);
      const fee1 = calculateTransactionFee(1);
      expect(fee0.getSigna()).toBe(fee1.getSigna());
    });

    it("should clamp to max fee when message + overhead exceeds max", () => {
      const fee = calculateTransactionFee(1000);
      expect(fee.getSigna()).toBe("0.6");
    });
  });
});
