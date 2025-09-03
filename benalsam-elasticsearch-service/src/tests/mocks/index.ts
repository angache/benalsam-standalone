export const mockListing = {
  id: 'test-listing-1',
  title: 'Test Listing',
  description: 'Test Description',
  price: 100,
  currency: 'TRY',
  status: 'active',
  category_id: 'test-category',
  user_id: 'test-user',
  attributes: {
    color: 'red',
    size: 'M'
  },
  images: ['image1.jpg', 'image2.jpg'],
  location: {
    lat: 41.0082,
    lon: 28.9784,
    city: 'Istanbul',
    district: 'Beyoglu'
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const mockQueueMessage = {
  type: 'ELASTICSEARCH_SYNC',
  operation: 'INSERT',
  table: 'listings',
  recordId: 'test-listing-1',
  changeData: mockListing,
  messageId: 'job_123_1234567890',
  timestamp: new Date().toISOString()
};

export const mockJob = {
  id: 123,
  table_name: 'listings',
  operation: 'INSERT',
  record_id: 'test-listing-1',
  change_data: mockListing,
  status: 'pending',
  retry_count: 0,
  created_at: new Date().toISOString()
};
