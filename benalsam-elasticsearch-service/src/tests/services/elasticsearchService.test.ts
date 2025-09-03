import { elasticsearchService } from '../../services/elasticsearchService';
import { mockListing } from '../mocks';
import { Client } from '@elastic/elasticsearch';

// Mock Elasticsearch client
jest.mock('@elastic/elasticsearch');

describe('ElasticsearchService', () => {
  let mockClient: jest.Mocked<Client>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock client
    mockClient = {
      index: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
      indices: {
        exists: jest.fn(),
        create: jest.fn(),
        putMapping: jest.fn(),
        delete: jest.fn(),
        putAlias: jest.fn(),
        stats: jest.fn()
      },
      cluster: {
        health: jest.fn()
      },
      bulk: jest.fn(),
      exists: jest.fn(),
      reindex: jest.fn()
    } as unknown as jest.Mocked<Client>;

    // Mock getClient to return our mock client
    jest.spyOn(elasticsearchService as any, 'getClient').mockResolvedValue(mockClient);
  });

  describe('insertListing', () => {
    it('should insert a listing successfully', async () => {
      mockClient.index.mockResolvedValueOnce({ result: 'created' });

      await elasticsearchService.insertListing(mockListing);

      expect(mockClient.index).toHaveBeenCalledWith({
        index: 'benalsam_listings',
        id: mockListing.id,
        body: mockListing,
        refresh: true,
        timeout: '30s'
      });
    });

    it('should throw error when insert fails', async () => {
      const error = new Error('Insert failed');
      mockClient.index.mockRejectedValueOnce(error);

      await expect(elasticsearchService.insertListing(mockListing))
        .rejects
        .toThrow('Insert failed');
    });
  });

  describe('updateListing', () => {
    it('should update a listing successfully', async () => {
      mockClient.exists.mockResolvedValueOnce(true);
      mockClient.update.mockResolvedValueOnce({ result: 'updated' });

      const update = { title: 'Updated Title' };
      await elasticsearchService.updateListing(mockListing.id, update);

      expect(mockClient.update).toHaveBeenCalledWith({
        index: 'benalsam_listings',
        id: mockListing.id,
        body: {
          doc: update,
          doc_as_upsert: true
        },
        refresh: true,
        timeout: '30s'
      });
    });

    it('should throw error when listing does not exist', async () => {
      mockClient.exists.mockResolvedValueOnce(false);

      await expect(elasticsearchService.updateListing(mockListing.id, { title: 'Updated' }))
        .rejects
        .toThrow(`Listing ${mockListing.id} not found`);
    });
  });

  describe('deleteListing', () => {
    it('should delete a listing successfully', async () => {
      mockClient.delete.mockResolvedValueOnce({ result: 'deleted' });

      await elasticsearchService.deleteListing(mockListing.id);

      expect(mockClient.delete).toHaveBeenCalledWith({
        index: 'benalsam_listings',
        id: mockListing.id,
        refresh: true,
        timeout: '30s'
      });
    });
  });

  describe('searchListings', () => {
    it('should perform basic search successfully', async () => {
      const mockResponse = {
        hits: {
          hits: [
            {
              _source: mockListing,
              _score: 1.0
            }
          ],
          total: 1
        }
      };

      mockClient.search.mockResolvedValueOnce(mockResponse);

      const result = await elasticsearchService.searchListings({
        query: 'test',
        limit: 10,
        page: 0
      });

      expect(result.hits).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.hits[0]).toMatchObject(mockListing);
    });

    it('should apply filters correctly', async () => {
      mockClient.search.mockResolvedValueOnce({
        hits: { hits: [], total: 0 }
      });

      await elasticsearchService.searchListings({
        category: 'test-category',
        priceRange: { min: 0, max: 100 },
        status: 'active'
      });

      expect(mockClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                filter: expect.arrayContaining([
                  { term: { category_id: 'test-category' } },
                  { range: { price: { gte: 0, lte: 100 } } },
                  { term: { status: 'active' } }
                ])
              })
            })
          })
        })
      );
    });
  });

  describe('bulkOperation', () => {
    it('should perform bulk operations successfully', async () => {
      mockClient.bulk.mockResolvedValueOnce({
        items: [
          { index: { status: 200 } },
          { update: { status: 200 } },
          { delete: { status: 200 } }
        ]
      });

      const operations = [
        { action: 'index', id: '1', data: mockListing },
        { action: 'update', id: '2', data: { title: 'Updated' } },
        { action: 'delete', id: '3' }
      ];

      await elasticsearchService.bulkOperation(operations as any);

      expect(mockClient.bulk).toHaveBeenCalled();
    });

    it('should throw error when bulk operation has failures', async () => {
      mockClient.bulk.mockResolvedValueOnce({
        items: [
          { index: { error: { type: 'mapper_parsing_exception' } } }
        ]
      });

      const operations = [
        { action: 'index', id: '1', data: mockListing }
      ];

      await expect(elasticsearchService.bulkOperation(operations as any))
        .rejects
        .toThrow('Bulk operation failed with 1 errors');
    });
  });

  describe('checkHealth', () => {
    it('should return healthy status when everything is ok', async () => {
      mockClient.cluster.health.mockResolvedValueOnce({
        status: 'green',
        cluster_name: 'test'
      });

      mockClient.indices.stats.mockResolvedValueOnce({
        indices: {
          benalsam_listings: {
            total: {
              docs: { count: 100 },
              store: { size_in_bytes: 1000 }
            }
          }
        }
      });

      const health = await elasticsearchService.checkHealth();

      expect(health.healthy).toBe(true);
      expect(health.details.status).toBe('green');
      expect(health.details.numberOfDocuments).toBe(100);
    });

    it('should return unhealthy status when cluster is red', async () => {
      mockClient.cluster.health.mockResolvedValueOnce({
        status: 'red',
        cluster_name: 'test'
      });

      mockClient.indices.stats.mockResolvedValueOnce({
        indices: {
          benalsam_listings: {
            total: {
              docs: { count: 100 },
              store: { size_in_bytes: 1000 }
            }
          }
        }
      });

      const health = await elasticsearchService.checkHealth();

      expect(health.healthy).toBe(false);
    });
  });
});
