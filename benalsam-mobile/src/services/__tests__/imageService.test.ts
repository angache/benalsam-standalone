import { uploadImages, processImagesForSupabase, deleteImages } from "../imageService";

// Mock Supabase
jest.mock("../supabaseClient", () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        remove: jest.fn(),
      })),
    },
  },
}));

describe("Image Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("uploadImages", () => {
    it("uploads local files successfully", async () => {
      const { supabase } = require("../supabaseClient");
      
      const mockFiles = [
        { uri: "file://path/to/image1.jpg", name: "image1.jpg" },
      ];

      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: "user123/image1.jpg" },
        error: null,
      });

      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: "https://example.com/image1.jpg" },
      });

      supabase.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      });

      const result = await uploadImages(mockFiles, "user123", "item_images");

      expect(result).toEqual(["https://example.com/image1.jpg"]);
      expect(mockUpload).toHaveBeenCalledTimes(1);
      expect(mockGetPublicUrl).toHaveBeenCalledTimes(1);
    });
  });

  describe("processImagesForSupabase", () => {
    it("handles stock images only", async () => {
      const mockImages = [
        { 
          uri: "https://unsplash.com/stock-image1.jpg",
          isStockImage: true,
          isUploaded: true
        },
        { 
          uri: "https://unsplash.com/stock-image2.jpg",
          isStockImage: true,
          isUploaded: true
        },
      ];

      const result = await processImagesForSupabase(
        mockImages,
        0,
        "item_images",
        "listings",
        "user123",
        "electronics"
      );

      expect(result.mainImageUrl).toBe("https://unsplash.com/stock-image1.jpg");
      expect(result.additionalImageUrls).toEqual([
        "https://unsplash.com/stock-image2.jpg"
      ]);
    });

    it("handles empty images array", async () => {
      const result = await processImagesForSupabase(
        [],
        0,
        "item_images",
        "listings",
        "user123",
        "electronics"
      );

      expect(result.mainImageUrl).toBe("");
      expect(result.additionalImageUrls).toEqual([]);
    });
  });

  describe("deleteImages", () => {
    it("deletes images successfully", async () => {
      const { supabase } = require("../supabaseClient");
      
      const mockRemove = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      supabase.storage.from.mockReturnValue({
        remove: mockRemove,
      });

      const imageUrls = [
        "https://example.supabase.co/storage/v1/object/public/item_images/user123/image1.jpg",
      ];

      await deleteImages(imageUrls);

      expect(mockRemove).toHaveBeenCalledWith([
        "user123/image1.jpg",
      ]);
    });

    it("handles empty URLs array", async () => {
      const result = await deleteImages([]);
      expect(result).toBeUndefined();
    });
  });
}); 