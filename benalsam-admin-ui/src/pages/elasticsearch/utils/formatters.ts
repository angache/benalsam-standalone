// ===========================
// ELASTICSEARCH FORMATTERS
// ===========================

import { FormatterConfig, FormattedDocument, EventDetails } from '../types';

export const formatEventData = (source: any, indexName: string): FormattedDocument => {
  // Check if this is a listing document
  if (indexName === 'benalsam_listings') {
    return formatListingData(source);
  }
  
  // User behavior data
  const { event_type, event_data, session_id, device_info, timestamp, user_profile } = source;
  
  const formattedData: FormattedDocument = {
    timestamp: new Date(timestamp).toLocaleString('tr-TR'),
    eventType: event_type,
    sessionId: session_id?.substring(0, 20) + '...',
    device: `${device_info?.platform} ${device_info?.version} (${device_info?.model})`,
    details: {}
  };

  // Add user info if available (handle both old and new formats)
  if (user_profile) {
    // New format: user_profile object
    formattedData.user = user_profile.name || user_profile.email || 'Unknown User';
    if (user_profile.avatar) {
      formattedData.avatar = user_profile.avatar;
    }
  } else if (event_data?.user_name || event_data?.user_email) {
    // Old format: user data in event_data
    formattedData.user = event_data.user_name || event_data.user_email || 'Unknown User';
    if (event_data.user_avatar) {
      formattedData.avatar = event_data.user_avatar;
    }
  } else {
    // Fallback
    formattedData.user = 'Unknown User';
  }

  // Format event-specific data
  switch (event_type) {
    case 'view':
      formattedData.details = {
        screen: event_data?.screen_name,
        timeSpent: `${event_data?.time_spent || 0}s`,
        scrollDepth: `${event_data?.scroll_depth || 0}%`
      };
      break;
    case 'click':
      formattedData.details = {
        element: event_data?.element_type,
        screen: event_data?.screen_name,
        action: event_data?.action_type
      };
      break;
    case 'performance':
      formattedData.details = {
        metric: event_data?.metric_type,
        value: event_data?.value || event_data?.used_mb || event_data?.percentage,
        unit: event_data?.unit || 'MB'
      };
      break;
    case 'error':
      formattedData.details = {
        error: event_data?.error_message,
        stack: event_data?.stack_trace?.substring(0, 100) + '...'
      };
      break;
    default:
      formattedData.details = event_data;
  }

  return formattedData;
};

export const formatListingData = (source: any): FormattedDocument => {
  const {
    id,
    title,
    description,
    category,
    budget,
    location,
    urgency,
    status,
    user_id,
    created_at,
    updated_at,
    popularity_score,
    is_premium
  } = source;

  return {
    timestamp: new Date(created_at).toLocaleString('tr-TR'),
    eventType: 'listing',
    sessionId: id?.substring(0, 20) + '...',
    device: 'Web/Mobile App',
    session: `Session ${user_id?.substring(0, 8)}...`,
    details: {
      title: title?.substring(0, 50) + (title?.length > 50 ? '...' : ''),
      category: category,
      budget: budget ? `${budget} TL` : 'Belirtilmemiş',
      location: location,
      urgency: urgency,
      status: status,
      premium: is_premium ? 'Evet' : 'Hayır',
      popularity: popularity_score || 0
    }
  };
};

export const formatDocument = (config: FormatterConfig): FormattedDocument => {
  const { indexName, source } = config;
  
  if (indexName === 'benalsam_listings') {
    return formatListingData(source);
  }
  
  return formatEventData(source, indexName);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('tr-TR');
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
};

export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('tr-TR').format(num);
};

export const formatCurrency = (amount: number, currency: string = 'TL'): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency
  }).format(amount);
};
