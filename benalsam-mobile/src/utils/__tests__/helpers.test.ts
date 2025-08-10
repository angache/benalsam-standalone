import {
  isValidTurkishPhoneNumber,
  capitalize,
  generateMobileId,
  debounce,
  isDeviceOnline,
  getDevicePixelRatio,
  formatFileSize,
  isImageCached,
  formatMobileDate
} from '../helpers';

describe("Mobile Helper Functions", () => {
  describe("isValidTurkishPhoneNumber", () => {
    it("validates Turkish phone numbers", () => {
      expect(isValidTurkishPhoneNumber("05551234567")).toBe(true);
      expect(isValidTurkishPhoneNumber("+905551234567")).toBe(true);
      expect(isValidTurkishPhoneNumber("0555 123 45 67")).toBe(true);
    });

    it("rejects invalid phone numbers", () => {
      expect(isValidTurkishPhoneNumber("1234567890")).toBe(false);
      expect(isValidTurkishPhoneNumber("0555123456")).toBe(false); // too short
      expect(isValidTurkishPhoneNumber("055512345678")).toBe(false); // too long
      expect(isValidTurkishPhoneNumber("")).toBe(false);
    });
  });

  describe("capitalize", () => {
    it("capitalizes first letter", () => {
      expect(capitalize("hello")).toBe("Hello");
      expect(capitalize("WORLD")).toBe("World");
      expect(capitalize("tEST")).toBe("Test");
    });

    it("handles single character", () => {
      expect(capitalize("a")).toBe("A");
    });

    it("handles empty string", () => {
      expect(capitalize("")).toBe("");
    });
  });

  describe("generateMobileId", () => {
    it("generates unique IDs", () => {
      const id1 = generateMobileId();
      const id2 = generateMobileId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
      expect(id1.length).toBeGreaterThan(0);
    });

    it("generates alphanumeric IDs", () => {
      const id = generateMobileId();
      expect(id).toMatch(/^[a-z0-9]+$/);
    });
  });

  describe("debounce", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("delays function execution", () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("cancels previous calls", () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("passes arguments correctly", () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn("test", 123);

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith("test", 123);
    });
  });

  describe("isDeviceOnline", () => {
    it("returns online status", () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      expect(isDeviceOnline()).toBe(true);

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      expect(isDeviceOnline()).toBe(false);
    });
  });

  describe("getDevicePixelRatio", () => {
    it("returns device pixel ratio", () => {
      // Mock window.devicePixelRatio
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        value: 2
      });

      expect(getDevicePixelRatio()).toBe(2);

      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        value: undefined
      });

      expect(getDevicePixelRatio()).toBe(1);
    });
  });

  describe("formatFileSize", () => {
    it("formats file sizes correctly", () => {
      expect(formatFileSize(0)).toBe("0 Bytes");
      expect(formatFileSize(1024)).toBe("1 KB");
      expect(formatFileSize(1048576)).toBe("1 MB");
      expect(formatFileSize(1073741824)).toBe("1 GB");
    });

    it("handles decimal values", () => {
      expect(formatFileSize(1536)).toBe("1.5 KB");
      expect(formatFileSize(1572864)).toBe("1.5 MB");
    });
  });

  describe("isImageCached", () => {
    it("checks if image is cached", () => {
      // Mock Image constructor
      const mockImage = {
        src: '',
        complete: true
      };
      
      global.Image = jest.fn(() => mockImage as any);

      expect(isImageCached("test.jpg")).toBe(true);

      mockImage.complete = false;
      expect(isImageCached("test.jpg")).toBe(false);
    });
  });

  describe("formatMobileDate", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-01-01T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("formats recent times correctly", () => {
      const oneHourAgo = new Date('2023-01-01T11:00:00Z');
      const oneDayAgo = new Date('2022-12-31T12:00:00Z');
      const threeDaysAgo = new Date('2022-12-29T12:00:00Z');

      expect(formatMobileDate(oneHourAgo)).toMatch(/\d{1,2}:\d{2}/);
      expect(formatMobileDate(oneDayAgo)).toBe("Dün");
      expect(formatMobileDate(threeDaysAgo)).toMatch(/Ara \d{1,2}/);
    });

    it("handles string dates", () => {
      const oneHourAgo = "2023-01-01T11:00:00Z";
      expect(formatMobileDate(oneHourAgo)).toMatch(/\d{1,2}:\d{2}/);
    });
  });
});
