
    import React, { useEffect, useState, useRef } from 'react';
    import { motion } from 'framer-motion';
    import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
    import ListingCard from '@/components/ListingCard';
    import { Button } from '@/components/ui/button';
    import { toast } from '@/components/ui/use-toast';

    const FeaturedListings = ({ title, fetchFunction, currentUser, onToggleFavorite }) => {
      const [listings, setListings] = useState([]);
      const [loading, setLoading] = useState(true);
      const scrollContainerRef = useRef(null);

      useEffect(() => {
        const loadListings = async () => {
          setLoading(true);
          try {
            const fetchedData = await fetchFunction(currentUser?.id);
            const listingsArray = Array.isArray(fetchedData) ? fetchedData : (fetchedData?.listings);
            setListings(listingsArray || []);
          } catch (error) {
            console.error(`Error fetching listings for ${title}:`, error);
            toast({
              title: 'Hata',
              description: `${title} yüklenirken bir sorun oluştu.`,
              variant: 'destructive',
            });
            setListings([]);
          } finally {
            setLoading(false);
          }
        };

        loadListings();
      }, [fetchFunction, title, currentUser]);

      const scroll = (direction) => {
        const { current } = scrollContainerRef;
        if (current) {
          const scrollAmount = current.offsetWidth * 0.8;
          current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
      };

      const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.05,
          },
        },
      };

      const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
      };

      if (loading) {
        return (
          <section className="py-6 sm:py-8 lg:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="h-4 sm:h-6 lg:h-8 bg-muted/50 rounded w-1/4 mb-4 sm:mb-6 lg:mb-8 animate-pulse"></div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-full">
                    <div className="h-28 sm:h-32 lg:h-36 bg-muted/50 rounded-t-lg animate-pulse"></div>
                    <div className="p-2 sm:p-3 border border-t-0 border-border rounded-b-lg bg-card/30">
                      <div className="h-3 sm:h-4 bg-muted/50 rounded w-3/4 mb-1 sm:mb-2 animate-pulse"></div>
                      <div className="h-2 sm:h-3 bg-muted/50 rounded w-1/2 mb-2 sm:mb-4 animate-pulse"></div>
                      <div className="h-6 sm:h-8 bg-muted/50 rounded w-full animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      if (!listings || listings.length === 0) {
        return null;
      }

      return (
        <section className="py-6 sm:py-8 lg:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 lg:mb-8 gap-3 sm:gap-4">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient">{title}</h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="text-primary hover:text-primary/80 text-xs sm:text-sm lg:text-base px-2 sm:px-3">
                  Tümünü Gör <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                </Button>
              </div>
            </div>
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {listings.slice(0, 8).map((listing) => (
                <motion.div key={listing.id} variants={itemVariants}>
                  <ListingCard
                    listing={listing}
                    currentUser={currentUser}
                    onToggleFavorite={onToggleFavorite}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      );
    };

    export default FeaturedListings;
  