import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createListing, updateListing, deleteListing } from '../listingService/mutations';

// Mock the clients
vi.mock('../listingServiceClient', () => ({
  listingServiceClient: {
    createListing: vi.fn(),
    updateListing: vi.fn(),
    deleteListing: vi.fn()
  }
}));

vi.mock('../uploadServiceClient', () => ({
  uploadServiceClient: {
    uploadImages: vi.fn()
  }
}));

// Import mocked clients
import { listingServiceClient } from '../listingServiceClient';
import { uploadServiceClient } from '../uploadServiceClient';

describe('Listing Mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createListing', () => {
    it('should create listing successfully with images', async () => {
      // Mock successful responses
      const mockUploadResponse = {
        success: true,
        data: {
          images: [
            { url: 'https://example.com/image1.jpg', publicId: 'img1' },
            { url: 'https://example.com/image2.jpg', publicId: 'img2' }
          ]
        }
      };

      const mockListingResponse = {
        success: true,
        data: {
          jobId: 'job-123',
          listing: {
            id: 'listing-123',
            title: 'Test Listing',
            price: 100,
            images: [
              { url: 'https://example.com/image1.jpg', publicId: 'img1' },
              { url: 'https://example.com/image2.jpg', publicId: 'img2' }
            ]
          }
        }
      };

      vi.mocked(uploadServiceClient.uploadImages).mockResolvedValue(mockUploadResponse);
      vi.mocked(listingServiceClient.createListing).mockResolvedValue(mockListingResponse);

      const listingData = {
        title: 'Test Listing',
        price: 100,
        images: [
          new File(['image1'], 'image1.jpg', { type: 'image/jpeg' }),
          new File(['image2'], 'image2.jpg', { type: 'image/jpeg' })
        ]
      };

      const result = await createListing(listingData);

      expect(uploadServiceClient.uploadImages).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(File),
          expect.any(File)
        ])
      );
      expect(listingServiceClient.createListing).toHaveBeenCalledWith({
        title: 'Test Listing',
        price: 100,
        images: [
          { url: 'https://example.com/image1.jpg', publicId: 'img1' },
          { url: 'https://example.com/image2.jpg', publicId: 'img2' }
        ]
      });
      expect(result).toEqual({
        success: true,
        data: {
          jobId: 'job-123',
          listing: expect.objectContaining({
            id: 'listing-123',
            title: 'Test Listing',
            price: 100
          })
        }
      });
    });

    it('should create listing without images', async () => {
      const mockListingResponse = {
        success: true,
        data: {
          jobId: 'job-123',
          listing: {
            id: 'listing-123',
            title: 'Test Listing Title',
            price: 100,
            images: []
          }
        }
      };

      vi.mocked(listingServiceClient.createListing).mockResolvedValue(mockListingResponse);

      const listingData = {
        title: 'Test Listing Title',
        price: 100,
        images: []
      };

      const result = await createListing(listingData);

      expect(uploadServiceClient.uploadImages).not.toHaveBeenCalled();
      expect(listingServiceClient.createListing).toHaveBeenCalledWith({
        title: 'Test Listing Title',
        price: 100,
        images: []
      });
      expect(result).toEqual(mockListingResponse);
    });

    it('should handle upload service error', async () => {
      vi.mocked(uploadServiceClient.uploadImages).mockRejectedValue(
        new Error('Upload failed')
      );

      const listingData = {
        title: 'Test Listing',
        price: 100,
        images: [
          new File(['image1'], 'image1.jpg', { type: 'image/jpeg' })
        ]
      };

      await expect(createListing(listingData)).rejects.toThrow('Upload failed');
    });

    it('should handle listing service error', async () => {
      const mockUploadResponse = {
        success: true,
        data: {
          images: [{ url: 'https://example.com/image1.jpg', publicId: 'img1' }]
        }
      };

      vi.mocked(uploadServiceClient.uploadImages).mockResolvedValue(mockUploadResponse);
      vi.mocked(listingServiceClient.createListing).mockRejectedValue(
        new Error('Listing creation failed')
      );

      const listingData = {
        title: 'Test Listing',
        price: 100,
        images: [
          new File(['image1'], 'image1.jpg', { type: 'image/jpeg' })
        ]
      };

      await expect(createListing(listingData)).rejects.toThrow('Listing creation failed');
    });

    it('should skip small blobs', async () => {
      const mockListingResponse = {
        success: true,
        data: {
          jobId: 'job-123',
          listing: {
            id: 'listing-123',
            title: 'Test Listing Title',
            price: 100,
            images: []
          }
        }
      };

      vi.mocked(listingServiceClient.createListing).mockResolvedValue(mockListingResponse);

      // Create a small blob (less than 1KB)
      const smallBlob = new Blob(['x'], { type: 'image/jpeg' });
      const smallFile = new File([smallBlob], 'small.jpg', { type: 'image/jpeg' });

      const listingData = {
        title: 'Test Listing Title',
        price: 100,
        images: [smallFile]
      };

      const result = await createListing(listingData);

      expect(uploadServiceClient.uploadImages).not.toHaveBeenCalled();
      expect(listingServiceClient.createListing).toHaveBeenCalledWith({
        title: 'Test Listing Title',
        price: 100,
        images: []
      });
      expect(result).toEqual(mockListingResponse);
    });
  });

  describe('updateListing', () => {
    it('should update listing successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          listing: {
            id: 'listing-123',
            title: 'Updated Listing',
            price: 150
          }
        }
      };

      vi.mocked(listingServiceClient.updateListing).mockResolvedValue(mockResponse);

      const listingId = 'listing-123';
      const updateData = {
        title: 'Updated Listing',
        price: 150
      };

      const result = await updateListing(listingId, updateData);

      expect(listingServiceClient.updateListing).toHaveBeenCalledWith(listingId, updateData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle update error', async () => {
      vi.mocked(listingServiceClient.updateListing).mockRejectedValue(
        new Error('Update failed')
      );

      const listingId = 'listing-123';
      const updateData = {
        title: 'Updated Listing',
        price: 150
      };

      await expect(updateListing(listingId, updateData)).rejects.toThrow('Update failed');
    });
  });

  describe('deleteListing', () => {
    it('should delete listing successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          message: 'Listing deleted successfully'
        }
      };

      vi.mocked(listingServiceClient.deleteListing).mockResolvedValue(mockResponse);

      const listingId = 'listing-123';
      const result = await deleteListing(listingId);

      expect(listingServiceClient.deleteListing).toHaveBeenCalledWith(listingId);
      expect(result).toEqual(mockResponse);
    });

    it('should handle delete error', async () => {
      vi.mocked(listingServiceClient.deleteListing).mockRejectedValue(
        new Error('Delete failed')
      );

      const listingId = 'listing-123';

      await expect(deleteListing(listingId)).rejects.toThrow('Delete failed');
    });
  });
});
