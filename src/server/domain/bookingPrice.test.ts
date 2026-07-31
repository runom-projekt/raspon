import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateBookingPrice } from "./bookingPrice";

describe("calculateBookingPrice", () => {
  const cases = [
    {
      name: "standard price with deposit and commission",
      input: { pricePerDay: 35, days: 2, depositAmount: 100, commissionPct: 15 },
      expected: { subtotal: "70", commission: "10.5", total: "170" },
    },
    {
      name: "percentage discount",
      input: { pricePerDay: 40, days: 3, depositAmount: 50, commissionPct: 10, percentOff: 25 },
      expected: { subtotal: "90", commission: "9", total: "140" },
    },
    {
      name: "fixed discount cannot make subtotal negative",
      input: { pricePerDay: 20, days: 1, depositAmount: 75, commissionPct: 15, amountOff: 100 },
      expected: { subtotal: "0", commission: "0", total: "75" },
    },
  ] as const;

  for (const testCase of cases) {
    it(testCase.name, () => {
      const result = calculateBookingPrice(testCase.input);
      assert.equal(result.subtotal.toString(), testCase.expected.subtotal);
      assert.equal(result.commissionAmt.toString(), testCase.expected.commission);
      assert.equal(result.totalAmount.toString(), testCase.expected.total);
    });
  }
});

