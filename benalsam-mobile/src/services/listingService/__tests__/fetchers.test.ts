import { fetchMyListings } from '../fetchers';

// Simple integration tests for fetchMyListings function
describe('fetchMyListings Integration Tests', () => {
  it('handles invalid user ID gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Test with invalid UUID format
    const result = await fetchMyListings('invalid-user-id');
    
    // Function should handle errors gracefully and return empty array
    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching my listings:', 
      expect.objectContaining({
        message: expect.stringContaining('invalid input syntax for type uuid')
      })
    );
    
    consoleSpy.mockRestore();
  });

  it('handles valid UUID format without database connection', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Use a valid UUID format
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';
    const result = await fetchMyListings(validUUID);
    
    // Should return empty array (no database connection in test environment)
    expect(result).toEqual([]);
    
    consoleSpy.mockRestore();
  });

  it('returns expected data structure', async () => {
    // Test that the function exists and is callable
    expect(typeof fetchMyListings).toBe('function');
    
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';
    const result = await fetchMyListings(validUUID);
    
    // Should return an array
    expect(Array.isArray(result)).toBe(true);
  });

  it('handles null or undefined input', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Test with null input (TypeScript should catch this, but test runtime behavior)
    const result = await fetchMyListings(null as any);
    
    expect(result).toEqual([]);
    
    consoleSpy.mockRestore();
  });

  it('handles empty string input', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const result = await fetchMyListings('');
    
    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching my listings:', 
      expect.objectContaining({
        message: expect.stringContaining('invalid input syntax')
      })
    );
    
    consoleSpy.mockRestore();
  });
}); 