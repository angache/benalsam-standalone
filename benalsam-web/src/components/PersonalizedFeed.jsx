import React from 'react';
import FeaturedListings from '@/components/FeaturedListings';
import { fetchRecentlyViewedListings, fetchListingsMatchingLastSearch } from '@/services/listingService';

const PersonalizedFeed = ({ currentUser, onToggleFavorite }) => {
  return (
    <React.Fragment>
      <FeaturedListings
        title="Son Gezdiğiniz İlanlar"
        fetchFunction={() => fetchRecentlyViewedListings(currentUser?.id)}
        currentUser={currentUser}
        onToggleFavorite={onToggleFavorite}
      />
      <FeaturedListings
        title="Son Aramanıza Uygun İlanlar"
        fetchFunction={() => fetchListingsMatchingLastSearch(currentUser?.id)}
        currentUser={currentUser}
        onToggleFavorite={onToggleFavorite}
      />
    </React.Fragment>
  );
};

export default PersonalizedFeed;