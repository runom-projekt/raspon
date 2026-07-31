import { Prisma } from "@prisma/client";

export interface BookingPriceInput {
  pricePerDay: Prisma.Decimal.Value;
  days: number;
  depositAmount: Prisma.Decimal.Value;
  commissionPct: Prisma.Decimal.Value;
  percentOff?: number | null;
  amountOff?: Prisma.Decimal.Value | null;
}

export function calculateBookingPrice(input: BookingPriceInput) {
  let subtotal = new Prisma.Decimal(input.pricePerDay).mul(input.days);

  if (input.percentOff) {
    subtotal = subtotal.mul(100 - input.percentOff).div(100);
  } else if (input.amountOff) {
    subtotal = subtotal.sub(input.amountOff);
  }

  subtotal = Prisma.Decimal.max(subtotal, 0);
  const commissionAmt = subtotal.mul(input.commissionPct).div(100);
  const totalAmount = subtotal.add(input.depositAmount);

  return {
    subtotal,
    commissionAmt,
    totalAmount,
  };
}

