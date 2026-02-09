import { tvaRateToNumber, calculateTVA, calculateTTC, parseAmount } from './currency.utils';

describe('Currency Utils', () => {
  describe('tvaRateToNumber', () => {
    it('should convert TVA enum to number', () => {
      expect(tvaRateToNumber('TVA_0')).toBe(0);
      expect(tvaRateToNumber('TVA_7')).toBe(0.07);
      expect(tvaRateToNumber('TVA_10')).toBe(0.1);
      expect(tvaRateToNumber('TVA_14')).toBe(0.14);
      expect(tvaRateToNumber('TVA_20')).toBe(0.2);
    });

    it('should return 0 for unknown rates', () => {
      expect(tvaRateToNumber('UNKNOWN')).toBe(0);
      expect(tvaRateToNumber('')).toBe(0);
    });
  });

  describe('calculateTVA', () => {
    it('should calculate TVA correctly', () => {
      expect(calculateTVA(10000, 'TVA_20')).toBeCloseTo(2000, 2);
      expect(calculateTVA(10000, 'TVA_14')).toBeCloseTo(1400, 2);
      expect(calculateTVA(10000, 'TVA_10')).toBeCloseTo(1000, 2);
      expect(calculateTVA(10000, 'TVA_7')).toBeCloseTo(700, 2);
      expect(calculateTVA(10000, 'TVA_0')).toBe(0);
    });

    it('should handle zero subtotal', () => {
      expect(calculateTVA(0, 'TVA_20')).toBe(0);
    });
  });

  describe('calculateTTC', () => {
    it('should calculate TTC correctly', () => {
      expect(calculateTTC(10000, 'TVA_20')).toBeCloseTo(12000, 2);
      expect(calculateTTC(10000, 'TVA_0')).toBe(10000);
      expect(calculateTTC(5000, 'TVA_14')).toBeCloseTo(5700, 2);
    });
  });

  describe('parseAmount', () => {
    it('should parse formatted amounts', () => {
      expect(parseAmount('1 234,56')).toBe(1234.56);
      expect(parseAmount('10 000,00 MAD')).toBe(10000);
    });

    it('should return 0 for invalid inputs', () => {
      expect(parseAmount('')).toBe(0);
      expect(parseAmount('abc')).toBe(0);
    });
  });
});
