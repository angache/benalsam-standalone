'use client';

import React from 'react';
import useAISuggestions from '../hooks/useAISuggestions';

const AISuggestions = ({ 
  query = '', 
  categoryId = null, 
  onSuggestionClick = null,
  maxSuggestions = 10,
  showTrending = true,
  showPopular = true,
  className = ''
}) => {
  const {
    suggestions,
    groupedSuggestions,
    isLoading,
    error,
    hasSuggestions
  } = useAISuggestions(query, categoryId);

  const handleSuggestionClick = (suggestion) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    }
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'trending':
        return '🔥';
      case 'popular':
        return '⭐';
      case 'category':
        return '🤖';
      case 'search':
        return '🔍';
      default:
        return '💡';
    }
  };

  const getSuggestionBadge = (suggestion) => {
    if (suggestion.metadata?.trending) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Trending
        </span>
      );
    }
    
    if (suggestion.metadata?.searchCount) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {suggestion.metadata.searchCount} arama
        </span>
      );
    }

    if (suggestion.metadata?.suggestionType) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {suggestion.metadata.suggestionType}
        </span>
      );
    }

    return null;
  };

  const getSuggestionScore = (score) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.8) return 'text-blue-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const renderSuggestionItem = (suggestion) => (
    <div
      key={suggestion.id}
      onClick={() => handleSuggestionClick(suggestion)}
      className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
    >
      <div className="flex items-center space-x-3 flex-1">
        <span className="text-lg">{getSuggestionIcon(suggestion.type)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900 truncate">
              {suggestion.text}
            </span>
            {getSuggestionBadge(suggestion)}
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`text-xs font-medium ${getSuggestionScore(suggestion.score)}`}>
              {Math.round(suggestion.score * 100)}% eşleşme
            </span>
            <span className="text-xs text-gray-500 capitalize">
              {suggestion.type}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {suggestion.metadata?.isApproved && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Onaylı
          </span>
        )}
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );

  const renderGroupedSuggestions = () => {
    const sections = [];

    // Group suggestions by category (Sahibinden.com style)
    const categoryGroups = {};
    
    // Group all suggestions by category
    [...(groupedSuggestions.category || []), ...(groupedSuggestions.trending || [])].forEach(suggestion => {
      const categoryName = suggestion.metadata?.categoryName || 'Genel';
      if (!categoryGroups[categoryName]) {
        categoryGroups[categoryName] = [];
      }
      categoryGroups[categoryName].push(suggestion);
    });

    // Create sections for each category
    Object.entries(categoryGroups).forEach(([categoryName, suggestions]) => {
      sections.push({
        title: `📂 ${categoryName}`,
        suggestions: suggestions,
        icon: '📂',
        categoryName: categoryName
      });
    });

    // Add search suggestions if any
    if (groupedSuggestions.search && groupedSuggestions.search.length > 0) {
      sections.push({
        title: '🔍 Arama Önerileri',
        suggestions: groupedSuggestions.search,
        icon: '🔍'
      });
    }

    // Add popular suggestions if any
    if (showPopular && groupedSuggestions.popular && groupedSuggestions.popular.length > 0) {
      sections.push({
        title: '⭐ Popüler Aramalar',
        suggestions: groupedSuggestions.popular,
        icon: '⭐'
      });
    }

    return sections.map((section, index) => (
      <div key={section.title} className={index > 0 ? 'border-t border-gray-200' : ''}>
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
            <span>{section.icon}</span>
            <span>{section.title}</span>
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {section.suggestions.slice(0, maxSuggestions).map(renderSuggestionItem)}
        </div>
      </div>
    ));
  };

  if (isLoading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}>
        <div className="p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">AI önerileri yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}>
        <div className="p-4">
          <div className="flex items-center space-x-3 text-red-600">
            <span>⚠️</span>
            <span className="text-sm">Öneriler yüklenirken hata oluştu</span>
          </div>
        </div>
      </div>
    );
  }

  if (!hasSuggestions) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}>
        <div className="p-4">
          <div className="flex items-center space-x-3 text-gray-500">
            <span>💡</span>
            <span className="text-sm">Henüz öneri bulunamadı</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto ${className}`}>
      {renderGroupedSuggestions()}
      
      {suggestions.length > maxSuggestions && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            {suggestions.length - maxSuggestions} öneri daha...
          </p>
        </div>
      )}
    </div>
  );
};

export default AISuggestions;
