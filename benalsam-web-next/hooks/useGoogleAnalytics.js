import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = 'G-611Q91H7X7';

export const useGoogleAnalytics = () => {
  const pathname = usePathname();

  // Page view tracking
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: pathname + searchParams.toString(),
        page_title: document.title,
      });
    }
  }, [location]);

  // Custom event tracking
  const trackEvent = (action, category, label, value) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  };

  // Page view tracking
  const trackPageView = (page_title, page_location) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_title: page_title,
        page_location: page_location,
      });
    }
  };

  // User interaction tracking
  const trackUserInteraction = (interaction_type, details) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'user_interaction', {
        event_category: 'engagement',
        event_label: interaction_type,
        custom_parameters: details,
      });
    }
  };

  // Listing interaction tracking
  const trackListingInteraction = (action, listing_id, listing_title) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: 'listing',
        event_label: listing_title,
        custom_parameter_1: listing_id,
      });
    }
  };

  // Search tracking
  const trackSearch = (search_term, results_count) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'search', {
        event_category: 'engagement',
        event_label: search_term,
        value: results_count,
      });
    }
  };

  // Conversion tracking
  const trackConversion = (conversion_type, value) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'conversion', {
        event_category: 'conversion',
        event_label: conversion_type,
        value: value,
      });
    }
  };

  return {
    trackEvent,
    trackPageView,
    trackUserInteraction,
    trackListingInteraction,
    trackSearch,
    trackConversion,
  };
};

export default useGoogleAnalytics;
