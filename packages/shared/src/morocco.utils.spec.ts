import { validateCIN, validateICE, validateMoroccanPhone, formatPhone, generateInvoiceNumber, validateRIB } from './morocco.utils';

describe('Morocco Utils', () => {
  describe('validateCIN', () => {
    it('should accept valid CIN formats', () => {
      expect(validateCIN('AB123456')).toBe(true);
      expect(validateCIN('A12345')).toBe(true);
      expect(validateCIN('BH234567')).toBe(true);
      expect(validateCIN('JB345678')).toBe(true);
    });

    it('should accept lowercase (case-insensitive)', () => {
      expect(validateCIN('ab123456')).toBe(true);
    });

    it('should reject invalid CIN formats', () => {
      expect(validateCIN('')).toBe(false);
      expect(validateCIN('123456')).toBe(false);
      expect(validateCIN('ABC123456')).toBe(false); // 3 letters
      expect(validateCIN('A1234')).toBe(false); // too short
      expect(validateCIN('AB1234567')).toBe(false); // too long
    });
  });

  describe('validateICE', () => {
    it('should accept valid 15-digit ICE', () => {
      expect(validateICE('001234567890123')).toBe(true);
      expect(validateICE('123456789012345')).toBe(true);
    });

    it('should reject invalid ICE', () => {
      expect(validateICE('')).toBe(false);
      expect(validateICE('12345')).toBe(false);
      expect(validateICE('1234567890123456')).toBe(false); // 16 digits
      expect(validateICE('00123456789ABCD')).toBe(false); // letters
    });
  });

  describe('validateMoroccanPhone', () => {
    it('should accept valid Moroccan phone numbers', () => {
      expect(validateMoroccanPhone('+212661000001')).toBe(true);
      expect(validateMoroccanPhone('+212522000000')).toBe(true);
      expect(validateMoroccanPhone('+212700000000')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validateMoroccanPhone('')).toBe(false);
      expect(validateMoroccanPhone('0661000001')).toBe(false);
      expect(validateMoroccanPhone('+212161000001')).toBe(false); // starts with 1
      expect(validateMoroccanPhone('+33661000001')).toBe(false); // French
    });
  });

  describe('formatPhone', () => {
    it('should convert 0-prefix to +212', () => {
      expect(formatPhone('0661000001')).toBe('+212661000001');
    });

    it('should add + to 212-prefix', () => {
      expect(formatPhone('212661000001')).toBe('+212661000001');
    });

    it('should handle already-formatted numbers', () => {
      expect(formatPhone('+212661000001')).toBe('+212661000001');
    });
  });

  describe('generateInvoiceNumber', () => {
    it('should generate correct format', () => {
      expect(generateInvoiceNumber(1, 2025)).toBe('FLA-2025-00001');
      expect(generateInvoiceNumber(42, 2025)).toBe('FLA-2025-00042');
      expect(generateInvoiceNumber(12345, 2025)).toBe('FLA-2025-12345');
    });
  });

  describe('validateRIB', () => {
    it('should accept valid 24-digit RIB', () => {
      expect(validateRIB('225810000123456789012345')).toBe(true);
    });

    it('should accept RIB with spaces', () => {
      expect(validateRIB('225 810 000 123 456 789 012 345')).toBe(true);
    });

    it('should reject invalid RIB', () => {
      expect(validateRIB('12345')).toBe(false);
      expect(validateRIB('')).toBe(false);
    });
  });
});
