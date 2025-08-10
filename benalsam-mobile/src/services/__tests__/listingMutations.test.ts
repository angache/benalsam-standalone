import { createListing } from "../listingService/mutations";

// Mock dependencies
jest.mock("../supabaseClient", () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}));

jest.mock("../imageService", () => ({
  processImagesForSupabase: jest.fn(),
}));

const mockListingData = {
  title: "Test Listing",
  description: "Test description", 
  budget: 1000,
  category: "electronics",
  location: "Istanbul / Kadikoy",
  images: ["image1.jpg"],
  mainImageIndex: 0,
  urgency: "normal",
  contactPreference: "site_only",
  acceptTerms: true,
  duration: 30,
};

describe("Listing Mutations Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates listing successfully", async () => {
    const { supabase } = require("../supabaseClient");
    const { processImagesForSupabase } = require("../imageService");
    
    processImagesForSupabase.mockResolvedValue({
      mainImageUrl: "main-image.jpg",
      additionalImageUrls: [],
    });

    const mockSingle = jest.fn().mockResolvedValue({
      data: { id: "listing-123", ...mockListingData },
      error: null,
    });
    
    supabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: mockSingle,
        }),
      }),
    });

    const result = await createListing(mockListingData, "user-123");
    expect(result).toEqual({ id: "listing-123", ...mockListingData });
  });

  it("handles missing data", async () => {
    const result = await createListing(null, "user-123");
    expect(result).toBeNull();
  });

  it("handles database errors", async () => {
    const { supabase } = require("../supabaseClient");
    const { processImagesForSupabase } = require("../imageService");
    
    processImagesForSupabase.mockResolvedValue({
      mainImageUrl: "main-image.jpg",
      additionalImageUrls: [],
    });

    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: "Database error" },
    });
    
    supabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: mockSingle,
        }),
      }),
    });

    const result = await createListing(mockListingData, "user-123");
    expect(result).toBeNull();
  });
});
