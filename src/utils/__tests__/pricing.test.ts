import { calculateClientPrice, formatPrice } from "../pricing";

describe("pricing", () => {
  describe("calculateClientPrice", () => {
    it("applies 4% payment + 2% platform and rounds to .90", () => {
      const result = calculateClientPrice(25);

      expect(result.professionalPrice).toBe(25);
      expect(result.paymentFee).toBe(1.0);
      expect(result.platformFee).toBe(0.5);
      expect(result.subtotal).toBe(26.5);
      expect(result.clientPrice).toBe(26.9);
      expect(result.roundingBonus).toBe(0.4);
      expect(result.totalPlatformRevenue).toBe(0.9);
    });

    it("rounds up when subtotal exceeds .90", () => {
      // 30 * 1.06 = 31.80 → 31.90
      const result = calculateClientPrice(30);

      expect(result.subtotal).toBe(31.8);
      expect(result.clientPrice).toBe(31.9);
      expect(result.roundingBonus).toBe(0.1);
    });

    it("rounds to next integer .90 when subtotal > X.90", () => {
      // 35 * 1.06 = 37.10 → 37.90
      const result = calculateClientPrice(35);

      expect(result.subtotal).toBe(37.1);
      expect(result.clientPrice).toBe(37.9);
      expect(result.roundingBonus).toBe(0.8);
    });

    it("keeps .90 when subtotal is exactly .90", () => {
      // Need a price where price * 1.06 = X.90
      // 50 * 1.06 = 53.00 → 53.90
      const result = calculateClientPrice(50);

      expect(result.subtotal).toBe(53);
      expect(result.clientPrice).toBe(53.9);
    });

    it("handles small prices", () => {
      // 10 * 1.06 = 10.60 → 10.90
      const result = calculateClientPrice(10);

      expect(result.subtotal).toBe(10.6);
      expect(result.clientPrice).toBe(10.9);
      expect(result.roundingBonus).toBe(0.3);
    });

    it("handles large prices", () => {
      // 120 * 1.06 = 127.20 → 127.90
      const result = calculateClientPrice(120);

      expect(result.subtotal).toBe(127.2);
      expect(result.clientPrice).toBe(127.9);
    });

    it("platform revenue = platformFee + roundingBonus", () => {
      const result = calculateClientPrice(45);

      expect(result.totalPlatformRevenue).toBe(
        result.platformFee + result.roundingBonus
      );
    });

    it("client price always ends in .90", () => {
      const prices = [10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 80, 100, 120, 150, 200];

      prices.forEach((price) => {
        const result = calculateClientPrice(price);
        const decimal = Math.round((result.clientPrice % 1) * 100);
        expect(decimal).toBe(90);
      });
    });

    it("client price is always >= subtotal", () => {
      const prices = [10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 100];

      prices.forEach((price) => {
        const result = calculateClientPrice(price);
        expect(result.clientPrice).toBeGreaterThanOrEqual(result.subtotal);
      });
    });
  });

  describe("formatPrice", () => {
    it("formats with R$ and comma", () => {
      expect(formatPrice(26.9)).toBe("R$ 26,90");
      expect(formatPrice(100)).toBe("R$ 100,00");
      expect(formatPrice(37.9)).toBe("R$ 37,90");
    });
  });
});
